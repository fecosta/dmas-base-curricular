import { describe, expect, it } from "vitest";
import { contributionPayload, ContributionValidationError } from "@/lib/contributions/validation";
import { safeAttachmentFilename } from "@/lib/contributions/attachments";

function form(values: Record<string, string | string[]>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : [value]) result.append(key, item);
  }
  return result;
}

describe("contribution form validation", () => {
  it("builds only the bounded Module payload and ignores forged authority fields", () => {
    const payload = contributionPayload("module", form({
      axis_id: "a1000000-0000-4000-8000-000000000001", title: " Módulo ", description: " Descripción ",
      learning_outcomes: "Uno\nDos", created_by: "attacker", contributor_organization_id: "attacker",
      status: "Published", published_at: "2026-01-01", current_published_revision_id: "attacker",
    }));
    expect(payload).toEqual(expect.objectContaining({ title: "Módulo", description: "Descripción", learning_outcomes: ["Uno", "Dos"] }));
    expect(payload).not.toHaveProperty("created_by");
    expect(payload).not.toHaveProperty("contributor_organization_id");
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("published_at");
    expect(payload).not.toHaveProperty("current_published_revision_id");
  });

  it("requires the minimum typed fields in Spanish", () => {
    expect(() => contributionPayload("material", form({ title: "Sin tipo" }))).toThrowError(
      new ContributionValidationError("Completa los campos obligatorios."),
    );
  });

  it("rejects non-HTTPS links", () => {
    expect(() => contributionPayload("institution", form({
      name: "Centro", institution_type: "ONG", website_url: "http://example.test",
    }))).toThrow("Los enlaces deben ser direcciones HTTPS válidas.");
  });

  it("normalizes duplicate relationship identifiers", () => {
    const id = "30000000-0000-4000-8000-000000000001";
    const payload = contributionPayload("teaching_note", form({ module_id: id, title: "Nota", material_ids: [id, id] }));
    expect(payload).toMatchObject({ module_id: id, material_ids: [id] });
  });

  it("accepts safe Unicode attachment names and rejects disposition/path controls", () => {
    expect(safeAttachmentFilename("  guía pública.pdf  ")).toBe("guía pública.pdf");
    for (const filename of ["salto\r\n.pdf", 'comilla".pdf', "ruta\\archivo.pdf", "ruta/archivo.pdf", "control\u0007.pdf"]) {
      expect(safeAttachmentFilename(filename)).toBeNull();
    }
  });
});
