import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import remarkMath from "remark-math";
import rehypeTypst from "@myriaddreamin/rehype-typst";

import { rehypeTreesitter } from "@blog/rehype-tree-sitter";
import rehypeCodeDirectives from "@blog/rehype-code-directives";

import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";

import rehypeAstroRelativeMarkdownLinks from "astro-rehype-relative-markdown-links";

export default defineConfig({
  output: "static",
  site: "https://pricehiller.com",
  prefetch: true,
  build: {
    assets: "assets",
  },
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      rehypeTypst,
      rehypeTreesitter,
      rehypeCodeDirectives,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
        },
      ],
      rehypeAstroRelativeMarkdownLinks,
    ],
    remarkPlugins: [remarkMath],
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: "assets/static/[name]-[hash:20][extname]",
          chunkFileNames: "js/chunks/[name]-[hash:20].js",
          entryFileNames: "js/[name]-[hash:20].js",
        },
      },
    },
  },
});
