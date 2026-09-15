import type { Database } from "@/lib/supabase/database.types";

export type ContributionType = Database["public"]["Enums"]["curriculum_content_type"];
export type ContributionStatus = "Draft" | "Published";
export type ManagementState = "draft" | "published" | "published_with_draft";

export const contributionTypes: { type: ContributionType; label: string; description: string }[] = [
  { type: "module", label: "Módulo", description: "Una unidad principal del currículo." },
  { type: "program_topic", label: "Tema de programa", description: "Un tema dentro del programa de un módulo." },
  { type: "instructor", label: "Docente o especialista", description: "Un perfil vinculado al conocimiento curricular." },
  { type: "teaching_note", label: "Nota docente", description: "Orientaciones o contexto para un módulo." },
  { type: "material", label: "Material o estudio", description: "Una publicación, guía, curso, base de datos u otro recurso." },
  { type: "institution", label: "Institución o centro", description: "Una organización relevante para la red." },
];

export function isContributionType(value: string): value is ContributionType {
  return contributionTypes.some((item) => item.type === value);
}

export function contributionTypeLabel(type: ContributionType) {
  return contributionTypes.find((item) => item.type === type)!.label;
}

export type ContributionSummary = {
  contentId: string;
  type: ContributionType;
  title: string;
  state: ManagementState;
  currentPublishedRevisionId: string | null;
  currentPublishedRevisionNumber: number | null;
  draftRevisionId: string | null;
  draftRevisionNumber: number | null;
  activityAt: string;
};

export type ContributionOption = {
  id: string;
  label: string;
  state: ManagementState;
  moduleId?: string;
};

export type ContributionOptions = {
  axes: { id: string; name: string }[];
  modules: ContributionOption[];
  programTopics: ContributionOption[];
  instructors: ContributionOption[];
  materials: ContributionOption[];
  institutions: ContributionOption[];
};

export type Attachment = {
  id: string;
  mime_type: string;
  object_name: string;
  original_filename: string;
  size_bytes: number;
  state: Database["public"]["Enums"]["curriculum_attachment_state"];
};

export type ContributionDetail = {
  contentId: string;
  revisionId: string;
  type: ContributionType;
  status: ContributionStatus;
  revisionNumber: number;
  createdAt: string;
  publishedAt: string | null;
  currentPublishedRevisionId: string | null;
  successorDraftRevisionId: string | null;
  fields: Record<string, string | number | string[] | null>;
  relationships: Record<string, string[]>;
  attachments: Attachment[];
};
