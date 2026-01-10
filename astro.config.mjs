import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import { rehypeTreesitter } from "@blog/rehype-tree-sitter";
import rehypeCodeDirectives from "@blog/rehype-code-directives";

import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";

const rehypePlugins = [
  rehypeTreesitter,
  rehypeCodeDirectives,
  rehypeSlug,
  [
    rehypeAutolinkHeadings,
    {
      behavior: "wrap",
    },
  ],
];

export default defineConfig({
  output: "static",
  site: "https://pricehiller.com",
  prefetch: true,
  image: {
    layout: "constrained",
  },
  integrations: [
    react(),
    mdx({
      rehypePlugins: rehypePlugins,
    }),
    sitemap(),
  ],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: rehypePlugins,
  },
});
