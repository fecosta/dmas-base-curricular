import { describe, expect, it } from "vitest";
import { libraryHref, paramValue } from "@/lib/curriculum/library-href";

describe("library URL construction", () => {
  it("preserves every applied filter when only the view changes", () => {
    const query = { q: "política", entity: "module", axis: "axis-1", country: "Perú", theme: "Clima", view: "grilla" };
    const href = libraryHref(query, { view: "programa" });
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("q")).toBe("política");
    expect(params.get("entity")).toBe("module");
    expect(params.get("axis")).toBe("axis-1");
    expect(params.get("country")).toBe("Perú");
    expect(params.get("theme")).toBe("Clima");
    expect(params.get("view")).toBe("programa");
  });

  it("preserves the view and the remaining filters when only the axis changes", () => {
    const query = { q: "datos", country: "Chile", view: "programa" };
    const params = new URLSearchParams(libraryHref(query, { axis: "axis-2" }).split("?")[1]);
    expect(params.get("axis")).toBe("axis-2");
    expect(params.get("view")).toBe("programa");
    expect(params.get("q")).toBe("datos");
    expect(params.get("country")).toBe("Chile");
  });

  it("clears a parameter when the override is empty", () => {
    const params = new URLSearchParams(libraryHref({ axis: "axis-1", q: "x" }, { axis: "" }).split("?")[1]);
    expect(params.has("axis")).toBe(false);
    expect(params.get("q")).toBe("x");
  });

  it("omits empty parameters and falls back to the bare path", () => {
    expect(libraryHref({})).toBe("/app/library");
    expect(libraryHref({ q: "", axis: undefined })).toBe("/app/library");
  });

  it("ignores unknown parameters rather than propagating them", () => {
    expect(libraryHref({ role: "Admin", q: "x" })).toBe("/app/library?q=x");
  });

  it("reads only single-valued parameters", () => {
    expect(paramValue({ q: "uno" }, "q")).toBe("uno");
    expect(paramValue({ q: ["uno", "dos"] }, "q")).toBe("");
    expect(paramValue({}, "q")).toBe("");
  });
});
