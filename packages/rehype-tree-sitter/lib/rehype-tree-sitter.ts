import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import { fromHtml } from "hast-util-from-html";
import type { Root, Element, ElementContent } from "hast";
import type { Plugin } from "unified";

import { highlight } from "../index.js";

const rehypeTreesitter: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return;

      const codeElement = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "code",
      );

      if (!codeElement) return;

      const className = codeElement.properties?.className as
        | string[]
        | undefined;
      const languageClass = className?.find((c) => c.startsWith("language-"));

      const language = languageClass
        ? languageClass.replace("language-", "")
        : "text";

      let code: string = toString(codeElement);

      try {
        code = highlight(code, language);
      } catch (e: any) {
        // This is a shitty way of handling errors, but it works and that's good
        // enough for now 🤷
        const errMsg: string = e.toString();
        if (!errMsg.startsWith("Error: Unsupported language:")) {
          console.warn(
            `[rehype-treesitter ${e.toString()}] Failed to highlight ${language} block:`,
          );
        }
      }

      code = code
        .split("\n")
        .map((line) => `<span class="line">${line}</span>`)
        .join("\n");

      const fragment = fromHtml(code, { fragment: true });

      codeElement.children = fragment.children as ElementContent[];

      node.properties = node.properties || {};
      const classes = (node.properties.className as string[]) || [];
      if (!classes.includes("ts-highlighted")) {
        node.properties.className = [...classes, "ts-highlighted"];
      }
    });
  };
};

export default rehypeTreesitter;
