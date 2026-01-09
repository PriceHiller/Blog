import { type Post, type PostsGroupedByDate } from "@/utils/posts";
import type { CustomHtmlElement } from "@/utils/types";
import type { PostDate } from "@/utils/posts";
import { Calendar, Tag } from "lucide-react";


export function ArticleDate({ date }: { date: PostDate }) {
  const ArticleDate = "article-date" as CustomHtmlElement;
  return (
    <ArticleDate>
      <Calendar className="date-icon" />
      <time dateTime={date.getPostDateISOString()}>
        {date.getPostDateString()}
      </time>
    </ArticleDate>
  );
}
export function ArticleTag({ tag }: { tag: string }) {
  return (
    <a className="article-tag" href={`/tags/${tag}`} key={tag}>
      <Tag className="tag-icon" />
      {tag.toString()}
    </a>
  );
}

export function ArticleTags({ tags }: { tags: string[] }) {
  const ArticleTags = "article-tags" as CustomHtmlElement;
  return (
    <ArticleTags>
      {tags.sort().map((tag) => (
        <ArticleTag tag={tag} key={tag} />
      ))}
    </ArticleTags>
  );
}

export function PostHeader({ post }: { post: Post }) {
  const ArticleTitle = "article-title" as CustomHtmlElement;
  const ArticleInfo = "article-info" as CustomHtmlElement;
  return (
    <>
      <ArticleTitle>{post.data.title}</ArticleTitle>
      <ArticleInfo>
        <ArticleDate date={post.date} />
        <ArticleTags tags={post.data.tags} />
      </ArticleInfo>
    </>
  );
}

export function PostListing({ posts }: { posts: PostsGroupedByDate }) {
  const postsGroupedByDate = posts;
  const listing = postsGroupedByDate.keys().map((date) => {
    const dateStr = date;
    const posts = postsGroupedByDate.get(date) as Post[];

    return (
      <div className="post-listing-group" key={`posts-listing-${dateStr}`}>
        <ArticleDate date={posts[0].date} />
        <div className="post-listing">
          {posts.map((post) => (
            <div
              className="post-listing-entry"
              key={post.id}
            >
              <a className="post" href={`/posts/${post.id}`}>{post.data.title}</a>
              <ArticleTags tags={post.data.tags} />
            </div>
          ))}
        </div>
      </div>
    );
  });

  return <div className="posts">{Array.from(listing)}</div>;
}
