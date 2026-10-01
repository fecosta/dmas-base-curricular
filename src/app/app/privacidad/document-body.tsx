import { Fragment } from "react";
import type { Block, Inline } from "@/lib/privacy/documents";

/**
 * Renders a parsed privacy document.
 *
 * The document's own level-1 heading becomes the page `<h1>`, so everything
 * below it keeps its relative depth and the reading surface has exactly one
 * top-level heading.
 */
function InlineRuns({ nodes }: { nodes: Inline[] }) {
  return <>
    {nodes.map((node, index) => <Fragment key={index}>
      {"break" in node ? <br /> : node.strong ? <strong>{node.text}</strong> : node.text}
    </Fragment>)}
  </>;
}

export function PrivacyDocumentBody({ blocks }: { blocks: Block[] }) {
  return <div className="max-w-3xl space-y-5">
    {blocks.map((block, index) => {
      if (block.kind === "rule") return <hr key={index} className="border-hairline" />;
      if (block.kind === "list") {
        return <ul key={index} className="ms-5 list-disc space-y-2 text-ink-soft">
          {block.items.map((item, position) => <li key={position}><InlineRuns nodes={item} /></li>)}
        </ul>;
      }
      if (block.kind === "paragraph") {
        return <p key={index} className="text-ink-soft"><InlineRuns nodes={block.inlines} /></p>;
      }
      if (block.level === 1) {
        return <h1 key={index} className="text-3xl leading-tight sm:text-4xl">
          <InlineRuns nodes={block.inlines} />
        </h1>;
      }
      if (block.level === 2) {
        return <h2 key={index} className="pt-4 text-2xl"><InlineRuns nodes={block.inlines} /></h2>;
      }
      return <h3 key={index} className="pt-2 text-lg"><InlineRuns nodes={block.inlines} /></h3>;
    })}
  </div>;
}
