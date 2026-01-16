import { type Post } from "@/utils/posts";
import type { CustomHtmlElement } from "@/utils/types";
import type { PostDate, PostsArray, TagCount } from "@/utils/posts";
import { Calendar, Tag } from "lucide-react";

export const ArticleDateElement = "article-date" as CustomHtmlElement;
export function ArticleDate({ date }: { date: PostDate }) {
  return (
    <ArticleDateElement>
      <Calendar className="date-icon" />
      <time dateTime={date.getPostDateISOString()}>
        {date.getPostDateString()}
      </time>
    </ArticleDateElement>
  );
}
export function ArticleTag({ tag, count }: { tag: string; count?: number }) {
  return (
    <a
      className="article-tag"
      href={`/tags/${tag}`}
      data-tag-count={count ? count : undefined}
      key={tag}
    >
      <Tag className="tag-icon" />
      {tag.toString()}
    </a>
  );
}

export const ArticleTagsElement = "article-tags" as CustomHtmlElement;
export function ArticleTags({ tags }: { tags: string[] }) {
  return (
    <ArticleTagsElement>
      {tags.sort().map((tag) => (
        <ArticleTag tag={tag} key={tag} />
      ))}
    </ArticleTagsElement>
  );
}

export function ArticleTagsWithCount({ tags }: { tags: TagCount[] }) {
  return (
    <ArticleTagsElement>
      {tags.map(({ tag, count }) => (
        <ArticleTag tag={tag} count={count} key={tag} />
      ))}
    </ArticleTagsElement>
  );
}

export const ArticleTitleElement = "article-title" as CustomHtmlElement;
export const ArticleInfoElement = "article-info" as CustomHtmlElement;
export function PostHeader({ post }: { post: Post }) {
  return (
    <>
      <ArticleTitleElement>{post.data.title}</ArticleTitleElement>
      <ArticleInfoElement>
        <ArticleDate date={post.date} />
        <ArticleTags tags={[...post.data.tags]} />
      </ArticleInfoElement>
    </>
  );
}

export function PostListing({ posts }: { posts: PostsArray }) {
  const postsGroupedByDate = posts.groupedByDate();
  const listing = postsGroupedByDate.keys().map((date) => {
    const dateStr = date;
    const posts = postsGroupedByDate.get(date) as Post[];

    return (
      <div className="post-listing-group" key={`posts-listing-${dateStr}`}>
        <ArticleDate date={posts[0].date} />
        <div className="post-listing">
          {posts.map((post) => (
            <div className="post-listing-entry" key={post.id}>
              <a className="post" href={`/posts/${post.id}`}>
                {post.data.title}
              </a>
              <ArticleTags tags={[...post.data.tags]} />
            </div>
          ))}
        </div>
      </div>
    );
  });

  return <div className="posts">{Array.from(listing)}</div>;
}
