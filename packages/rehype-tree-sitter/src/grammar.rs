use const_format::concatcp;
use std::borrow::Cow;
use tree_sitter::Language;
use tree_sitter_highlight::HighlightConfiguration;

macro_rules! language_def {
    ($name:ident) => {{
        unsafe extern "C" {
            fn $name() -> Language;
        }
        unsafe { $name() }
    }};
}

const ECMA_HIGHLIGHTS_QUERY: &str = include_str!("../grammars/custom/queries/ecma/highlights.scm");
const JAVASCRIPT_HIGHLIGHTS_QUERY: &str =
    include_str!("../grammars/custom/queries/javascript/highlights.scm");
const TYPESCRIPT_HIGHLIGHTS_QUERY: &str = concatcp!(
    include_str!("../grammars/custom/queries/typescript/highlights.scm"),
    ECMA_HIGHLIGHTS_QUERY,
    tree_sitter_javascript::HIGHLIGHT_QUERY
);

const BASH_HIGHLIGHTS_QUERY: &str = concatcp!(include_str!(
    "../grammars/custom/queries/bash/highlights.scm"
));
const BASH_LOCALS_QUERY: &str = include_str!("../grammars/custom/queries/bash/locals.scm");

#[derive(Debug, Clone)]
pub struct LangConfig {
    pub name: &'static str,
    pub aliases: &'static [&'static str],
    pub language: Language,
    pub highlights_query: Cow<'static, str>,
    pub injections_query: Cow<'static, str>,
    pub locals_query: Cow<'static, str>,
}

impl LangConfig {
    pub fn all() -> Vec<Self> {
        [
            Self {
                name: "c",
                aliases: &[],
                language: language_def!(tree_sitter_c),
                highlights_query: include_str!("../grammars/custom/queries/c/highlights.scm")
                    .into(),
                injections_query: include_str!("../grammars/custom/queries/c/injections.scm")
                    .into(),
                locals_query: include_str!("../grammars/custom/queries/c/locals.scm").into(),
            },
            Self {
                name: "printf",
                aliases: &[],
                language: language_def!(tree_sitter_printf),
                highlights_query: include_str!("../grammars/custom/queries/printf/highlights.scm")
                    .into(),
                injections_query: "".into(),
                locals_query: "".into(),
            },
            Self {
                name: "python",
                aliases: &["py"],
                language: tree_sitter_python::LANGUAGE.into(),
                highlights_query: tree_sitter_python::HIGHLIGHTS_QUERY.into(),
                injections_query: "".into(),
                locals_query: "".into(),
            },
            Self {
                name: "nix",
                aliases: &[],
                language: language_def!(tree_sitter_nix),
                highlights_query: include_str!("../grammars/custom/queries/nix/highlights.scm")
                    .into(),
                injections_query: include_str!(
                    "../grammars/tree-sitter-nix/queries/injections.scm"
                )
                .into(),
                locals_query: include_str!("../grammars/custom/queries/nix/locals.scm").into(),
            },
            Self {
                name: "javascript",
                aliases: &["js"],
                language: tree_sitter_javascript::LANGUAGE.into(),
                highlights_query: format!(
                    "{}\n{}",
                    ECMA_HIGHLIGHTS_QUERY, JAVASCRIPT_HIGHLIGHTS_QUERY
                )
                .into(),
                injections_query: tree_sitter_javascript::INJECTIONS_QUERY.into(),
                locals_query: tree_sitter_javascript::LOCALS_QUERY.into(),
            },
            Self {
                name: "typescript",
                aliases: &["ts"],
                language: language_def!(tree_sitter_typescript),
                highlights_query: format!(
                    "{}\n{}",
                    TYPESCRIPT_HIGHLIGHTS_QUERY, JAVASCRIPT_HIGHLIGHTS_QUERY
                )
                .into(),
                injections_query: tree_sitter_javascript::INJECTIONS_QUERY.into(),
                locals_query: format!(
                    "{}\n{}",
                    include_str!("../grammars/custom/queries/typescript/locals.scm"),
                    tree_sitter_javascript::LOCALS_QUERY
                )
                .into(),
            },
            Self {
                name: "tsx",
                aliases: &["typescriptreact"],
                language: language_def!(tree_sitter_tsx),
                highlights_query: format!(
                    "{}\n{}\n{}",
                    TYPESCRIPT_HIGHLIGHTS_QUERY,
                    JAVASCRIPT_HIGHLIGHTS_QUERY,
                    tree_sitter_javascript::JSX_HIGHLIGHT_QUERY,
                )
                .into(),
                injections_query: tree_sitter_javascript::INJECTIONS_QUERY.into(),
                locals_query: format!(
                    "{}\n{}",
                    tree_sitter_typescript::LOCALS_QUERY,
                    tree_sitter_javascript::LOCALS_QUERY
                )
                .into(),
            },
            Self {
                name: "jsx",
                aliases: &["javascriptreact"],
                language: tree_sitter_javascript::LANGUAGE.into(),
                highlights_query: format!(
                    "{}\n{}\n",
                    tree_sitter_javascript::HIGHLIGHT_QUERY,
                    tree_sitter_javascript::JSX_HIGHLIGHT_QUERY,
                )
                .into(),
                injections_query: tree_sitter_javascript::INJECTIONS_QUERY.into(),
                locals_query: tree_sitter_javascript::LOCALS_QUERY.into(),
            },
            Self {
                name: "bash",
                aliases: &["sh", "shell"],
                language: language_def!(tree_sitter_bash),
                highlights_query: BASH_HIGHLIGHTS_QUERY.into(),
                injections_query: "".into(),
                locals_query: BASH_LOCALS_QUERY.into(),
            },
            Self {
                name: "ruby",
                aliases: &["rb"],
                language: language_def!(tree_sitter_ruby),
                highlights_query: include_str!("../grammars/custom/queries/ruby/highlights.scm")
                    .into(),
                injections_query: "".into(),
                locals_query: include_str!("../grammars/custom/queries/ruby/locals.scm").into(),
            },
            Self {
                name: "comment",
                aliases: &[],
                language: language_def!(tree_sitter_comment),
                highlights_query: include_str!("../grammars/custom/queries/comment/highlights.scm")
                    .into(),
                injections_query: "".into(),
                locals_query: "".into(),
            },
        ]
        .iter_mut()
        .map(|grammar| {
            // For some odd reason, @spell can cause @comment and others to
            // break
            grammar.highlights_query = grammar.highlights_query.replace("@spell", "").into();
            grammar.clone()
        })
        .collect()
    }

    pub fn into_highlight_config(
        self,
        capture_names: &[&str],
    ) -> Result<HighlightConfiguration, String> {
        let mut config = HighlightConfiguration::new(
            self.language,
            self.name,
            &self.highlights_query,
            &self.injections_query,
            &self.locals_query,
        )
        .map_err(|e| format!("Query error for {}: {e:?}", self.name))?;

        config.configure(capture_names);

        Ok(config)
    }
}
