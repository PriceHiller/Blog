import { getCollection } from "astro:content";

export class PostDate extends Date {
  public getPostDateString(options?: Intl.DateTimeFormatOptions): string {
    return this.toLocaleDateString("en-US", {
      // When we try to turn this into a LocaleDateString for the pretty
      // formatting, it picks up timezone as `America/Chicago`. Since the post
      // dates are defined the by directory prefix in ISO format
      // (e.g. 2025-12-28), Javascript takes them in as UTC dates and then
      // attempts to convert the to the local timezone. This ends up with those
      // times being offset by a negative hours amount (-6 for CST) and they get
      // output as a day behind effectively (e.g. 2025-12-28 becomes
      // 2025-12-27). By forcing the timezone here to UTC, those dates get
      // properly output as expected (2025-12-28 -> 2025-12-28).
      timeZone: "UTC",
      dateStyle: "full",
      ...options,
    });
  }

  public getPostDateISOString(): string {
    return this.toISOString().substring(0, 10);
  }
}

export async function getPosts() {
  const posts = await getCollection("posts");

  return posts
    .map((post) => {
      const match = post.id.match(/^(\d{4}-\d{2}-\d{2})(?:-(.+))?$/);
      return {
        ...post,
        date: new PostDate(match ? match[1] : "0000-00-00"),
        title: post.data.title || (match ? match[2] : post.id),
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export type Post = Awaited<ReturnType<typeof getPosts>>[number];

export function groupPostsByDate(posts: Post[]) {
  let postsByDate = new Map<string, Post[]>();
  posts.forEach((post) => {
    const dateStr = post.date.getPostDateString();
    const collection = postsByDate.get(dateStr) ?? [];
    collection.push(post);
    postsByDate.set(dateStr, collection);
  });
  return postsByDate;
}


export type PostsGroupedByDate = ReturnType<typeof groupPostsByDate>;

export async function getAllTags() {
  const posts = await getPosts();
  let tags: Map<string, Post[]> = new Map();

  posts.forEach((post) => {
    post.data.tags.forEach((tag) => {
      const collection = tags.get(tag) ?? [];
      collection.push(post);
      tags.set(tag, collection);
    });
  });
  return tags;
}
