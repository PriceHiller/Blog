import { useState } from "react";
import { createPortal } from "react-dom";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button onClick={handleCopy} className="copy-btn" aria-label="Copy code">
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function CodeBlockEnhancer() {
  const [codeBlocks, setCodeBlocks] = useState<
    { wrapper: HTMLElement; code: string }[]
  >([]);

  useState(() => {
    const blocks: { wrapper: HTMLElement; code: string }[] = [];

    document.querySelectorAll("pre:has(code)").forEach((pre) => {
      if (pre.classList.contains("code-wrapper")) return;

      const code = pre.querySelector("code")?.textContent ?? "";

      const wrapper = pre;
      wrapper.className = "code-wrapper";

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "copy-btn-container";

      wrapper.appendChild(buttonContainer);

      blocks.push({ wrapper: buttonContainer, code });
    });

    setCodeBlocks(blocks);

    document.querySelectorAll(".code-folded").forEach((el) => {
      const lineCount = (el.textContent?.split("\n").length ?? 1) - 1;
      el.setAttribute("data-lines", `${lineCount}`);
    });

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const folded = target.closest(".code-folded");
      if (folded) {
        e.preventDefault();
        folded.classList.toggle("expanded");
        return;
      }

      const blur = target.closest(".hl-blur");
      if (blur) {
        blur.classList.add("revealed");
      } else {
        document.querySelectorAll(".hl-blur.revealed").forEach((el) => {
          el.classList.remove("revealed");
        });
      }
    };

    document.addEventListener("click", handleClick);
  });

  return (
    <>
      {codeBlocks.map(({ wrapper, code }, index) =>
        createPortal(
          <CopyButton code={code} />,
          wrapper,
          `code-block-${index}`,
        ),
      )}
    </>
  );
}
