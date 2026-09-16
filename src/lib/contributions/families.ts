import type { ContributionType } from "./types";

/**
 * Presentation-only grouping of the existing governed content types into the
 * semantic families used by the create-content landing page and by Admin
 * management. It adds no entity type, route, workflow or authority.
 */
export type ContributionFamily = {
  id: "curriculum" | "people" | "references";
  label: string;
  description: string;
  types: ContributionType[];
};

export const contributionFamilies: ContributionFamily[] = [
  {
    id: "curriculum",
    label: "Contenido curricular",
    description: "La estructura del currículo: módulos, sus temas de programa y las notas docentes asociadas.",
    types: ["module", "program_topic", "teaching_note"],
  },
  {
    id: "people",
    label: "Personas",
    description: "Perfiles vinculados al conocimiento curricular de la red.",
    types: ["instructor"],
  },
  {
    id: "references",
    label: "Referencias",
    description: "Materiales, estudios e instituciones de referencia que acompañan al currículo.",
    types: ["material", "institution"],
  },
];

/** Plural labels used where a family lists collections rather than a single object. */
const plurals: Record<ContributionType, string> = {
  module: "Módulos",
  program_topic: "Temas de programa",
  instructor: "Docentes",
  teaching_note: "Notas docentes",
  material: "Materiales",
  institution: "Instituciones",
};

export function contributionTypePlural(type: ContributionType) {
  return plurals[type];
}

export function familyOf(type: ContributionType) {
  return contributionFamilies.find((family) => family.types.includes(type))!;
}
