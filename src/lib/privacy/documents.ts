import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { privacyDocuments, type PrivacyDocumentId } from "@/lib/privacy/contract";

/**
 * The user-facing privacy documents, read from the authoritative repository
 * files rather than re-typed into components.
 *
 * `docs/PRIVACY_NOTICE.md` and `docs/TERMS_OF_USE.md` are the single source of
 * truth for this copy. Forking them into JSX would create a second version that
 * drifts, and the privacy contract requires the product surface to match the
 * notice. Updating the document updates the page.
 *
 * Only the constructs these two documents actually use are supported — ATX
 * headings, paragraphs, `-` bullets, `**strong**`, thematic breaks and hard line
 * breaks. That is deliberately not a general Markdown implementation: a
 * dependency for two known-shape documents would be more surface than the
 * problem. `assertRenderable` fails the build-time/test contract if a document
 * later grows a construct this cannot represent, so unsupported syntax can
 * never render as stray literal characters in a legal document.
 */

/** A run of text, optionally emphasised. Hard breaks are their own node. */
export type Inline = { text: string; strong?: true } | { break: true };

export type Block =
  | { kind: "heading"; level: 1 | 2 | 3; inlines: Inline[] }
  | { kind: "paragraph"; inlines: Inline[] }
  | { kind: "list"; items: Inline[][] }
  | { kind: "rule" };

const headings: Record<string, 1 | 2 | 3> = { "#": 1, "##": 2, "###": 3 };

/**
 * Markdown this renderer cannot represent. Checked rather than silently passed
 * through, because a legal surface must not show raw syntax to a reader.
 */
const unsupported: { pattern: RegExp; description: string }[] = [
  { pattern: /^\s*(#{4,})\s/, description: "heading deeper than level 3" },
  { pattern: /^\s*>/, description: "block quote" },
  { pattern: /^\s*\d+\.\s/, description: "ordered list" },
  { pattern: /^\s*(`{3,}|~{3,})/, description: "fenced code block" },
  { pattern: /^\s*\|/, description: "table" },
  { pattern: /^\s+[-*+]\s/, description: "nested list" },
  { pattern: /<[a-zA-Z/]/, description: "inline HTML" },
  { pattern: /`/, description: "inline code" },
  { pattern: /!?\[[^\]]*\]\([^)]*\)/, description: "link or image" },
  { pattern: /(^|[^*])\*(?!\*)[^*]/, description: "single-asterisk emphasis" },
  { pattern: /_/, description: "underscore emphasis" },
];

/** Throws if the document uses Markdown this renderer would mangle. */
export function assertRenderable(markdown: string, label: string) {
  const lines = markdown.split("\n");
  for (const [index, line] of lines.entries()) {
    for (const { pattern, description } of unsupported) {
      if (pattern.test(line)) {
        throw new Error(`${label}:${index + 1} uses an unsupported Markdown construct (${description})`);
      }
    }
  }
}

/** Splits `**strong**` runs and CommonMark hard breaks out of one block's text. */
function inlines(lines: string[]): Inline[] {
  const nodes: Inline[] = [];
  lines.forEach((line, index) => {
    // Two or more trailing spaces are a hard break; otherwise lines of the same
    // block join with a space, as CommonMark specifies.
    const hardBreak = /\s{2,}$/.test(line);
    const text = index === lines.length - 1 ? line.trimEnd() : `${line.trimEnd()}${hardBreak ? "" : " "}`;
    for (const [position, run] of text.split("**").entries()) {
      if (run) nodes.push(position % 2 === 1 ? { text: run, strong: true } : { text: run });
    }
    if (hardBreak && index < lines.length - 1) nodes.push({ break: true });
  });
  return nodes;
}

export function parsePrivacyDocument(markdown: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", inlines: inlines(paragraph) });
    if (items.length) blocks.push({ kind: "list", items: items.map((item) => inlines([item])) });
    paragraph = [];
    items = [];
  };

  for (const raw of markdown.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim()) {
      flush();
      continue;
    }
    if (/^-{3,}$/.test(line.trim())) {
      flush();
      blocks.push({ kind: "rule" });
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ kind: "heading", level: headings[heading[1]], inlines: inlines([heading[2]]) });
      continue;
    }
    const bullet = /^-\s+(.*)$/.exec(line);
    if (bullet) {
      if (paragraph.length) {
        blocks.push({ kind: "paragraph", inlines: inlines(paragraph) });
        paragraph = [];
      }
      items.push(bullet[1]);
      continue;
    }
    if (items.length) flush();
    paragraph.push(line);
  }
  flush();
  return blocks;
}

/**
 * Reads and parses an authoritative privacy document.
 *
 * The files are traced into the deployment bundle through
 * `outputFileTracingIncludes` in next.config.ts, because a runtime read of a
 * repository path is otherwise not guaranteed to exist on the host.
 */
export async function getPrivacyDocument(id: PrivacyDocumentId): Promise<Block[]> {
  const { file } = privacyDocuments[id];
  const markdown = await readFile(path.join(process.cwd(), "docs", file), "utf8");
  assertRenderable(markdown, `docs/${file}`);
  return parsePrivacyDocument(markdown);
}
