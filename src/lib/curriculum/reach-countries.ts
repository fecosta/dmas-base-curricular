/**
 * Approved material reach values (SPEC-013 §5.1): canonical Spanish names, exact
 * and case- and accent-sensitive. Must match the list in
 * `private.enforce_material_reach_country`; the database is the enforcement.
 */
export const REACH_COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador",
  "El Salvador", "Guatemala", "Haití", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay",
  "Perú", "República Dominicana", "Uruguay", "Venezuela",
] as const;

/** True for a stored value that is non-blank and not on the approved list (a legacy value). */
export function isLegacyReach(value: string) {
  return value.trim() !== "" && !(REACH_COUNTRIES as readonly string[]).includes(value);
}
