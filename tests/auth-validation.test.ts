import { describe, expect, it } from "vitest";
import { isEmailCode, normalizeEmail } from "@/lib/auth/validation";

describe("institutional email input", () => {
  it("normalizes case and surrounding whitespace without guessing a domain", () => {
    expect(normalizeEmail("  Member@Partner.ORG ")).toBe("member@partner.org");
    expect(normalizeEmail("member@sub.partner.org")).toBe("member@sub.partner.org");
  });
  it.each([null, 12, "", "a@b@partner.org", "a @partner.org", "a@partner.org/path", "a@partner.org.", "a@-partner.org", "a@localhost", `${"a".repeat(250)}@partner.org`])("rejects invalid input: %s", (input) => {
    expect(normalizeEmail(input)).toBeNull();
  });
  it.each(["123456", "12345678"])("accepts configured Supabase code lengths: %s", (input) => {
    expect(isEmailCode(input)).toBe(true);
  });
  it.each([null, 123456, "12345", "123456789", "abcdef", "123456\n"])("rejects invalid codes: %s", (input) => {
    expect(isEmailCode(input)).toBe(false);
  });
});
