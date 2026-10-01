import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertRenderable,
  parsePrivacyDocument,
  type Block,
} from "@/lib/privacy/documents";
import { privacyDocuments } from "@/lib/privacy/contract";

const read = (file: string) => readFileSync(new URL(`../docs/${file}`, import.meta.url), "utf8");

function text(block: Block): string {
  if (block.kind === "rule") return "";
  if (block.kind === "list") {
    return block.items.map((item) => item.map((node) => ("break" in node ? "\n" : node.text)).join("")).join("\n");
  }
  return block.inlines.map((node) => ("break" in node ? "\n" : node.text)).join("");
}

describe("privacy document parsing", () => {
  it("keeps headings at their document level", () => {
    const blocks = parsePrivacyDocument("# Aviso\n\n## Sección\n\n### Detalle\n");
    expect(blocks).toEqual([
      { kind: "heading", level: 1, inlines: [{ text: "Aviso" }] },
      { kind: "heading", level: 2, inlines: [{ text: "Sección" }] },
      { kind: "heading", level: 3, inlines: [{ text: "Detalle" }] },
    ]);
  });

  it("joins the lines of one paragraph and splits strong runs", () => {
    const blocks = parsePrivacyDocument("La **analítica** es\nopcional.\n");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("paragraph");
    expect(text(blocks[0])).toBe("La analítica es opcional.");
    // The emphasis is carried as structure, not as surviving asterisks.
    expect(blocks[0]).toMatchObject({
      inlines: expect.arrayContaining([{ text: "analítica", strong: true }]),
    });
  });

  it("treats two trailing spaces as a hard break rather than a paragraph join", () => {
    const blocks = parsePrivacyDocument("**Versión:** 1.1  \n**Actualizado:** hoy\n");
    expect(blocks[0]).toMatchObject({ kind: "paragraph" });
    expect(text(blocks[0])).toBe("Versión: 1.1\nActualizado: hoy");
  });

  it("collects consecutive bullets into one list", () => {
    const blocks = parsePrivacyDocument("Opciones:\n\n- aceptar\n- rechazar\n");
    expect(blocks).toEqual([
      { kind: "paragraph", inlines: [{ text: "Opciones:" }] },
      { kind: "list", items: [[{ text: "aceptar" }], [{ text: "rechazar" }]] },
    ]);
  });

  it("renders a thematic break as a rule", () => {
    expect(parsePrivacyDocument("uno\n\n---\n\ndos\n")).toEqual([
      { kind: "paragraph", inlines: [{ text: "uno" }] },
      { kind: "rule" },
      { kind: "paragraph", inlines: [{ text: "dos" }] },
    ]);
  });
});

/*
 * The renderer covers only the constructs these two documents use. If a
 * document later grows a table, link or code span, the surface must fail
 * loudly rather than show a reader raw Markdown in a legal notice.
 */
describe("unsupported Markdown is refused rather than mangled", () => {
  const cases: [string, string][] = [
    ["table", "| a | b |"],
    ["link", "Consulta [el aviso](https://example.test)."],
    ["inline code", "Usa `analytics_enabled`."],
    ["fenced block", "```text"],
    ["ordered list", "1. primero"],
    ["block quote", "> cita"],
    ["nested list", "  - anidado"],
    ["inline HTML", "<div>hola</div>"],
    ["deep heading", "#### Demasiado profundo"],
    ["single-asterisk emphasis", "texto *enfatizado* aquí"],
    ["underscore emphasis", "texto _enfatizado_ aquí"],
  ];

  for (const [description, markdown] of cases) {
    it(`refuses ${description}`, () => {
      expect(() => assertRenderable(markdown, "doc")).toThrow(/unsupported Markdown construct/);
    });
  }
});

/*
 * The product surfaces must stay consistent with the authoritative documents,
 * which is only true if the documents remain renderable.
 */
describe("the authoritative documents stay renderable", () => {
  for (const [id, { file, title }] of Object.entries(privacyDocuments)) {
    it(`renders docs/${file} without unsupported syntax`, () => {
      const markdown = read(file);
      expect(() => assertRenderable(markdown, `docs/${file}`)).not.toThrow();

      const blocks = parsePrivacyDocument(markdown);
      const topLevel = blocks.filter((block) => block.kind === "heading" && block.level === 1);
      // Exactly one document title, which becomes the page's single <h1>.
      expect(topLevel).toHaveLength(1);
      expect(text(topLevel[0])).toContain(title);
      // No Markdown syntax survives into the rendered text.
      for (const block of blocks) expect(text(block)).not.toContain("**");
      expect(id === "notice" || id === "terms").toBe(true);
    });
  }

  it("keeps the recorded privacy notice version aligned with the document", async () => {
    const { privacyNoticeVersion } = await import("@/lib/privacy/contract");
    const markdown = read(privacyDocuments.notice.file);
    // The decision is recorded against this version, so a document bump that
    // leaves the constant behind would misattribute every later consent.
    expect(markdown).toContain(`**Versión:** ${privacyNoticeVersion}`);
  });
});
