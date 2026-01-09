import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const posts = defineCollection({
  loader: glob({ pattern: "*/index.{mdx,md}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string().optional(),
    tags: z
    .array(z.string())
    .optional()
    .default([])
    .transform((arr) => [...new Set(arr)].sort()),
  }),
});

export const collections = { posts };
