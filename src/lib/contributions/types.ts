import type { Database } from "@/lib/supabase/database.types";

export type ContributionType = Database["public"]["Enums"]["curriculum_content_type"];
export type ContributionStatus = "Draft" | "Published";

/** Derived from revision rows. Archival is deliberately absent: it is not a revision state. */
export type ManagementState = "draft" | "published" | "published_with_draft";

/**
 * What the Admin management surface can display. `archived` is identity-level
 * governance state (SPEC-005 §4.1), so it lives on this presentation type rather
 * than in `ManagementState` or in `curriculum_revision_status`.
 */
export type ManagementViewState = ManagementState | "archived";

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

export type LifecycleAction = Database["public"]["Enums"]["curriculum_lifecycle_action"];

/** One archived stable identity, resolved through its authoritative Published revision. */
export type ArchivedContentSummary = {
  type: ContributionType;
  contentId: string;
  currentPublishedRevisionId: string | null;
  currentPublishedRevisionNumber: number | null;
  title: string | null;
  archivedAt: string;
  archivedBy: string | null;
};

/**
 * The three-part descending keyset from `list_archived_governed_content`.
 * All three components travel together — the RPC rejects a partial cursor, and
 * dropping `contentType` would reintroduce the tie that made pagination skip rows.
 */
export type ArchivedCursor = {
  archivedAt: string;
  contentId: string;
  contentType: ContributionType;
};

export type LifecycleEvent = {
  eventId: number;
  type: ContributionType;
  contentId: string;
  revisionId: string | null;
  actorUserId: string;
  actorOrganizationId: string;
  actorOrganizationName: string | null;
  action: LifecycleAction;
  previousStatus: string | null;
  resultingStatus: string | null;
  occurredAt: string;
};

/**
 * Archival never rewrites the Published revision, so an archived identity whose
 * revision metadata cannot be resolved is an anomaly worth surfacing rather than
 * hiding: it still has to be restorable.
 */
export function archivedContentTitle(entry: ArchivedContentSummary) {
  return entry.title ?? "Sin título disponible";
}

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
