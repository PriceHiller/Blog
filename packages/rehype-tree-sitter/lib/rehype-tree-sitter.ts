import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import { fromHtml } from "hast-util-from-html";
import type { Root, Element, ElementContent } from "hast";
import type { Plugin } from "unified";

import { highlight } from "../index.js";

function splitLines(children: ElementContent[]): ElementContent[][] {
  const lines: ElementContent[][] = [[]];

  for (const child of children) {
    if (child.type === "text") {
      const parts = child.value.split("\n");
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          lines.push([]);
        }
        if (parts[i] !== "") {
          lines[lines.length - 1].push({ type: "text", value: parts[i] });
        }
      }
    } else if (child.type === "element") {
      const subLines = splitLines(child.children);
      for (let i = 0; i < subLines.length; i++) {
        if (i > 0) {
          lines.push([]);
        }
        if (subLines[i].length > 0) {
          lines[lines.length - 1].push({
            type: "element",
            tagName: child.tagName,
            properties: { ...child.properties },
            children: subLines[i],
          });
        }
      }
    } else {
      // Comments, etc. — keep on current line
      lines[lines.length - 1].push(child);
    }
  }

  return lines;
}

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
        const errMsg: string = e.toString();
        if (!errMsg.startsWith("Error: Unsupported language:")) {
          console.warn(
            `[rehype-treesitter ${e.toString()}] Failed to highlight ${language} block:`,
          );
        }
      }

      // Parse highlighted HTML into HAST, then split into lines
      const fragment = fromHtml(code, { fragment: true });
      const lines = splitLines(fragment.children as ElementContent[]);

      // Wrap each line in <span class="line">, separated by \n text nodes
      const newChildren: ElementContent[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
          newChildren.push({ type: "text", value: "\n" });
        }
        newChildren.push({
          type: "element",
          tagName: "span",
          properties: { className: ["line"] },
          children: lines[i],
        });
      }

      codeElement.children = newChildren;

      node.properties = node.properties || {};
      const classes = (node.properties.className as string[]) || [];
      if (!classes.includes("ts-highlighted")) {
        node.properties.className = [...classes, "ts-highlighted"];
      }
    });
  };
};

export default rehypeTreesitter;
