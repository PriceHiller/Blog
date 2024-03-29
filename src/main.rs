use anyhow::{Context, Ok};
use blog::{
    markdown::article::{Article, FrontMatter},
    page_gen::{
        articles::Articles,
        tags::{TagArticles, Tags},
    },
    TemplateRenderer,
};
use clap::Parser;
use std::{collections::HashMap, fs::DirEntry, path::PathBuf};
use tera::Tera;

#[derive(Parser, Debug)]
#[command(author = "Price Hiller <price@orion-technologies.io>", version = "0.1", about = "Parses markdown documents to html with code syntax highlighting", long_about = None)]
struct Args {
    /// Path to a directory containing markdown files to parse
    #[arg()]
    documents: PathBuf,

    /// Whether or not the parsed file should be written back as <FILE_NAME>.html
    #[arg(short, long, value_name = "write-html", default_value_t = false)]
    write_html: bool,

    /// Path to a custom theme to use instead of default
    #[arg(short, long)]
    theme: Option<PathBuf>,
}

fn main() -> anyhow::Result<()> {
    let comrak_settings = blog::markdown::MDComrakSettings::default().unwrap();
    let posts_dir = PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/posts/"));
    let posts_walkable =
        std::fs::read_dir(&posts_dir).context("Unable to read posts directory!")?;
    let out_path = PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/out"));
    std::fs::create_dir_all(&out_path)
        .context(format!("Unable to create out directory at '{out_path:?}'"))?;

    let mut tera = Tera::new(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/assets/templates/**/*.html"
    ))
    .context("Tera Template Import Error")?;
    tera.autoescape_on(vec![]);
    let mut detected_tags_article: HashMap<String, Vec<(FrontMatter, String)>> = HashMap::new();
    let mut article_links: Vec<(FrontMatter, String)> = Vec::new();
    println!("Rendering Articles");
    for dir_entry in posts_walkable {
        let path = dir_entry?.path();
        if !path.is_file() {
            continue;
        }
        println!(
            "Parsing Article: {}",
            path.file_name().unwrap().to_str().unwrap()
        );
        let parsed_article = Article::parse(&path, &comrak_settings).unwrap();
        println!(
            "Rendering Article Template: {} - {}",
            path.file_name().unwrap().to_str().unwrap(),
            &parsed_article.frontmatter.name
        );
        let rendered_article = parsed_article
            .render_template(&tera)
            .context("Article Template Rendering Error")?;
        let new_file_name = String::from(path.file_stem().unwrap().to_str().unwrap()) + ".html";
        write_file(
            &out_path.join(PathBuf::from(format!("articles/{}", &new_file_name))),
            rendered_article.as_bytes(),
        )?;
        println!("Finished Rendering Article Template");

        for article_tag in &parsed_article.frontmatter.tags {
            let tag = detected_tags_article
                .entry(article_tag.clone())
                .or_default();
            tag.push((parsed_article.frontmatter.clone(), new_file_name.clone()));
        }
        article_links.push((parsed_article.frontmatter.clone(), new_file_name.clone()));
    }
    println!("Finished rendering Article templates");

    println!("Rendering Articles Page");
    let articles_page = Articles::new(&article_links)
        .render_template(&tera)
        .context("Main Articles Page Rendering Error")?;
    let articles_write_path = &out_path.join("articles.html");
    write_file(articles_write_path, articles_page.as_bytes())?;
    println!("Finished Rendering Articles Page");

    println!("Rendering Tags Page");
    let tags_page = Tags::new(&detected_tags_article.keys().collect::<Vec<&String>>())
        .render_template(&tera)
        .context("Main Tags Page Rendering Error")?;

    let tags_write_path = &out_path.join("tags.html");
    write_file(tags_write_path, tags_page.as_bytes())?;
    println!("Finished Rendering Tags Page");

    println!("Rendering Individual Tag Pages");
    for (tag, article_link) in detected_tags_article.iter() {
        println!("Rendering Tag Page: {}", &tag);
        let tag_article = TagArticles::new(tag, article_link).render_template(&tera)?;
        write_file(
            &out_path.join(format!("tags/{tag}.html")),
            tag_article.as_bytes(),
        )?;
    }
    println!("Finished rendering Individual Tag Pages");

    // TODO: Refactor this so we recursively walk a directory and get these instead of updating a
    // vec everytime
    let static_pages = vec!["home.html", "credits.html", "contact.html"];
    let static_context = tera::Context::new();

    for static_page in static_pages {
        println!("Rendering Static Page: {}", &static_page);
        let rendered_static_page =
            tera.render(&format!("static/{}", &static_page), &static_context)?;
        write_file(&out_path.join(static_page), rendered_static_page.as_bytes())?;
        println!("Finished Rendering Static Page: {}", &static_page);
    }

    let base_asset_dir = PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/assets/"));
    copy_recursive(&base_asset_dir.join("style/"), &out_path.join("style"))?;
    copy_recursive(
        &base_asset_dir.join("static/"),
        &out_path.join("assets/static/"),
    )?;
    copy_recursive(
        &posts_dir.join("assets/"),
        &out_path.join("articles/assets"),
    )?;

    Ok(())
}

fn copy_recursive(src: &PathBuf, dest: &PathBuf) -> anyhow::Result<()> {
    println!("Copying {} to {}", src.display(), dest.display());
    std::fs::create_dir_all(dest)?;
    blog::iter_dir(src, &|entry: &DirEntry| -> anyhow::Result<()> {
        let mut dest = dest.clone();
        let filetype = entry.file_type()?;

        // This ensures all non base dirs are also copied. Basically copies whole directories under
        // `src` to `dest`
        if let Some(parent) = entry.path().parent() {
            if parent != src.as_path() {
                dest = dest.join(parent.to_path_buf().components().last().unwrap());
                std::fs::create_dir_all(&dest)?;
            }
        }
        dest = dest.join(entry.file_name());

        if filetype.is_symlink() {
            let _ = std::fs::remove_file(&dest);
            std::fs::copy(std::fs::read_link(entry.path())?, &dest)?;
        } else {
            let _ = std::fs::remove_file(&dest);
            std::fs::copy(entry.path(), &dest)?;
        }
        Ok(())
    })
}

fn write_file(file_path: &PathBuf, contents: &[u8]) -> anyhow::Result<()> {
    let mut dir = file_path.clone();
    if dir.pop() {
        std::fs::create_dir_all(dir)?;
    }

    std::fs::write(file_path, contents).context(format!("Failed to write to {file_path:?}"))
}
