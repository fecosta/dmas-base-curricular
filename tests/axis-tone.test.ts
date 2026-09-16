import { describe, expect, it } from "vitest";
import { axisTone, axisToneResolver } from "@/lib/ui/axis-tone";

describe("axis colour coding", () => {
  it("assigns tones by axis position", () => {
    expect(axisTone(0)).toBe("primary");
    expect(axisTone(1)).toBe("success");
  });

  it("cycles rather than failing once the known tones run out", () => {
    expect(axisTone(4)).toBe(axisTone(0));
    expect(axisTone(5)).toBe(axisTone(1));
  });

  it("falls back to neutral for invalid positions", () => {
    expect(axisTone(-1)).toBe("neutral");
    expect(axisTone(1.5)).toBe("neutral");
  });

  it("resolves tones from the ordered axis list", () => {
    const tone = axisToneResolver([{ name: "Estrategia y Campaña" }, { name: "Políticas Públicas" }]);
    expect(tone("Estrategia y Campaña")).toBe("primary");
    expect(tone("Políticas Públicas")).toBe("success");
  });

  it("returns neutral for an unknown or missing axis", () => {
    const tone = axisToneResolver([{ name: "Estrategia y Campaña" }]);
    expect(tone("Desconocido")).toBe("neutral");
    expect(tone(null)).toBe("neutral");
    expect(tone(undefined)).toBe("neutral");
  });
});
