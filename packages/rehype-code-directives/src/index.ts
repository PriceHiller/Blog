import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element, ElementContent, Text } from "hast";

interface RenderLine {
  nodes: ElementContent[];
  newline?: Text;
  stack: string[];
}

interface Scope {
  triggerClass: string;
  children: ElementContent[];
}

export default function rehypeCodeDirectives() {
  const marker = ":::";

  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return;

      const codeElement = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "code",
      );
      if (!codeElement) return;

      const flatNodes: ElementContent[] = [];
      for (const child of codeElement.children) {
        if (child.type === "text" && child.value.includes("\n")) {
          child.value.split(/(\n)/g).forEach((part) => {
            if (part) flatNodes.push({ type: "text", value: part });
          });
        } else {
          flatNodes.push(child);
        }
      }

      const lines: { nodes: ElementContent[]; newline?: Text }[] = [];
      let currentBuffer: ElementContent[] = [];

      for (const n of flatNodes) {
        if (n.type === "text" && n.value === "\n") {
          lines.push({ nodes: currentBuffer, newline: n });
          currentBuffer = [];
        } else {
          currentBuffer.push(n);
        }
      }
      if (currentBuffer.length > 0) {
        lines.push({ nodes: currentBuffer });
      }

      const renderLines: RenderLine[] = [];
      const activeStack: string[] = [];

      for (const line of lines) {
        const lineText = line.nodes
          .map((n) => toString(n))
          .join("")
          .trim();
        let isDirective = false;

        if (lineText.includes(marker)) {
          if (lineText.endsWith(marker) && !lineText.includes("[")) {
            activeStack.pop();
            isDirective = true;
          } else {
            const matches = lineText.match(/\[(.*?)\]/g);
            if (matches) {
              for (const m of matches) {
                const content = m.slice(1, -1);
                const eqIndex = content.indexOf("=");
                if (eqIndex > -1) {
                  const key = content.slice(0, eqIndex).trim();
                  let value = content.slice(eqIndex + 1).trim();

                  if (
                    (value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))
                  ) {
                    value = value.slice(1, -1);
                  }

                  if (key.toLowerCase() === "class") {
                    activeStack.push(value);
                    isDirective = true;
                  }
                }
              }
            }
          }
        }

        if (!isDirective) {
          renderLines.push({
            nodes: line.nodes,
            newline: line.newline,
            stack: [...activeStack],
          });
        }
      }

      const newRootChildren: ElementContent[] = [];
      const scopeStack: Scope[] = [
        { triggerClass: "ROOT", children: newRootChildren },
      ];

      for (const line of renderLines) {
        let commonDepth = 0;

        while (
          commonDepth < line.stack.length &&
          commonDepth + 1 < scopeStack.length &&
          line.stack[commonDepth] === scopeStack[commonDepth + 1].triggerClass
        ) {
          commonDepth++;
        }

        while (scopeStack.length > commonDepth + 1) {
          scopeStack.pop();
        }

        while (scopeStack.length <= line.stack.length) {
          const nextClass = line.stack[scopeStack.length - 1];
          const newSpan: Element = {
            type: "element",
            tagName: "span",
            properties: { className: [nextClass] },
            children: [],
          };

          scopeStack[scopeStack.length - 1].children.push(newSpan);
          scopeStack.push({
            triggerClass: nextClass,
            children: newSpan.children,
          });
        }

        const currentScope = scopeStack[scopeStack.length - 1];
        currentScope.children.push(...line.nodes);
        if (line.newline) {
          currentScope.children.push(line.newline);
        }
      }

      codeElement.children = newRootChildren;
    });
  };
}
