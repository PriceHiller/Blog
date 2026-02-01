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

const __Posts = await (async () => {
  const posts = await getCollection("posts");

  return posts.map((post) => {
    const match = post.filePath!.match(/.*\/posts\/(\d{4}-\d{2}-\d{2})(?:-(.+))?\/.*.mdx?$/);
    return {
      ...post,
      date: new PostDate(match ? match[1] : "0000-00-00"),
      title: post.data.title || (match ? match[2] : post.id),
    };
  });
})();

export type Post = (typeof __Posts)[number];

export type TagCount = {
  tag: string;
  count: number;
};

export class PostsArray extends Array<Post> {
  constructor(...posts: Post[]) {
    posts = posts.sort((a, b) => b.date.getTime() - a.date.getTime());
    super(...posts);
  }

  taggedWith(tag: string) {
    return new PostsArray(
      ...this.filter((post) => post.data.tags.includes(tag)),
    );
  }

  groupedByDate() {
    let postsByDate = new Map<string, PostsArray>();
    this.forEach((post) => {
      const dateStr = post.date.getPostDateString();
      const collection = postsByDate.get(dateStr) ?? new PostsArray(...[]);
      collection.push(post);
      postsByDate.set(dateStr, collection);
    });
    return postsByDate;
  }

  allTags(): TagCount[] {
    let tags: Map<string, number> = new Map();

    this.forEach((post) => {
      post.data.tags.forEach((tag) => {
        tags.set(tag, (tags.get(tag) ?? 0) + 1);
      });
    });

    return [...tags]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }
}

export const Posts = new PostsArray(...__Posts);
