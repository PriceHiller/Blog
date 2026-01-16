import React from "react";
import { createPortal } from "react-dom";

export default function Thang() {
  const [blocks] = React.useState(() =>
    Array.from(document.querySelectorAll("pre:has(> code)")),
  );

  blocks.map((block, i) =>
    createPortal(
      <button onClick={() => navigator.clipboard.writeText(block.textContent)}>
        Copy
      </button>,
      block,
    ),
  );

  return <div>nah</div>;
}
