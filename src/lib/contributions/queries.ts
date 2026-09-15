import "server-only";

import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import type {
  Attachment,
  ContributionDetail,
  ContributionOption,
  ContributionOptions,
  ContributionSummary,
  ContributionType,
  ManagementState,
} from "./types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const managedStatuses = ["Draft", "Published"] as const;

type IdentityRow = { id: string; current_published_revision_id: string | null };
type SummaryRevision = {
  id: string;
  contentId: string;
  title: string;
  status: string;
  revisionNumber: number;
  createdAt: string;
  publishedAt: string | null;
};

export function mapManagementSummaries(
  type: ContributionType,
  identities: IdentityRow[],
  revisions: SummaryRevision[],
): ContributionSummary[] {
  return identities.flatMap((identity) => {
    const current = revisions.find((revision) => revision.id === identity.current_published_revision_id && revision.status === "Published");
    const draft = revisions.find((revision) => revision.contentId === identity.id && revision.status === "Draft");
    if (!current && !draft) return [];
    const state: ManagementState = current && draft ? "published_with_draft" : draft ? "draft" : "published";
    return [{
      type,
      contentId: identity.id,
      title: draft?.title ?? current!.title,
      state,
      currentPublishedRevisionId: current?.id ?? null,
      currentPublishedRevisionNumber: current?.revisionNumber ?? null,
      draftRevisionId: draft?.id ?? null,
      draftRevisionNumber: draft?.revisionNumber ?? null,
      activityAt: draft?.createdAt ?? current?.publishedAt ?? current!.createdAt,
    }];
  });
}

export async function listManagedContent(): Promise<ContributionSummary[]> {
  await requireAccess("Admin");
  const supabase = await createClient();
  const results = await Promise.all([
    supabase.from("modules").select("id,current_published_revision_id"),
    supabase.from("module_revisions").select("id,module_id,status,title,revision_number,created_at,published_at").in("status", managedStatuses),
    supabase.from("program_topics").select("id,current_published_revision_id"),
    supabase.from("program_topic_revisions").select("id,program_topic_id,status,title,revision_number,created_at,published_at").in("status", managedStatuses),
    supabase.from("instructors").select("id,current_published_revision_id"),
    supabase.from("instructor_revisions").select("id,instructor_id,status,name,revision_number,created_at,published_at").in("status", managedStatuses),
    supabase.from("teaching_notes").select("id,current_published_revision_id"),
    supabase.from("teaching_note_revisions").select("id,teaching_note_id,status,title,revision_number,created_at,published_at").in("status", managedStatuses),
    supabase.from("materials").select("id,current_published_revision_id"),
    supabase.from("material_revisions").select("id,material_id,status,title,revision_number,created_at,published_at").in("status", managedStatuses),
    supabase.from("institutions").select("id,current_published_revision_id"),
    supabase.from("institution_revisions").select("id,institution_id,status,name,revision_number,created_at,published_at").in("status", managedStatuses),
  ]);
  if (results.some((result) => result.error)) throw new Error("Admin content read unavailable");

  const revisions = (rows: Record<string, unknown>[], contentKey: string, titleKey: "title" | "name"): SummaryRevision[] => rows.map((row) => ({
    id: String(row.id),
    contentId: String(row[contentKey]),
    title: String(row[titleKey]),
    status: String(row.status),
    revisionNumber: Number(row.revision_number),
    createdAt: String(row.created_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
  }));
  const summaries = [
    ...mapManagementSummaries("module", results[0].data ?? [], revisions(results[1].data ?? [], "module_id", "title")),
    ...mapManagementSummaries("program_topic", results[2].data ?? [], revisions(results[3].data ?? [], "program_topic_id", "title")),
    ...mapManagementSummaries("instructor", results[4].data ?? [], revisions(results[5].data ?? [], "instructor_id", "name")),
    ...mapManagementSummaries("teaching_note", results[6].data ?? [], revisions(results[7].data ?? [], "teaching_note_id", "title")),
    ...mapManagementSummaries("material", results[8].data ?? [], revisions(results[9].data ?? [], "material_id", "title")),
    ...mapManagementSummaries("institution", results[10].data ?? [], revisions(results[11].data ?? [], "institution_id", "name")),
  ];
  return summaries.sort((a, b) => b.activityAt.localeCompare(a.activityAt));
}

export async function getContribution(type: ContributionType, revisionId: string): Promise<ContributionDetail> {
  if (!uuidPattern.test(revisionId)) notFound();
  await requireAccess("Admin");
  const supabase = await createClient();
  let result;
  switch (type) {
    case "module": result = await supabase.from("module_revisions").select("*").eq("id", revisionId).in("status", managedStatuses).maybeSingle(); break;
    case "program_topic": result = await supabase.from("program_topic_revisions").select("*").eq("id", revisionId).in("status", managedStatuses).maybeSingle(); break;
    case "instructor": result = await supabase.from("instructor_revisions").select("*").eq("id", revisionId).in("status", managedStatuses).maybeSingle(); break;
    case "teaching_note": result = await supabase.from("teaching_note_revisions").select("*").eq("id", revisionId).in("status", managedStatuses).maybeSingle(); break;
    case "material": result = await supabase.from("material_revisions").select("*").eq("id", revisionId).in("status", managedStatuses).maybeSingle(); break;
    case "institution": result = await supabase.from("institution_revisions").select("*").eq("id", revisionId).in("status", managedStatuses).maybeSingle(); break;
  }
  if (result.error) throw new Error("Admin content read unavailable");
  if (!result.data) notFound();
  const row = result.data as Record<string, unknown>;
  const contentKey = `${type}_id`;
  const contentId = String(row[contentKey]);

  let identityResult;
  switch (type) {
    case "module": identityResult = await supabase.from("modules").select("current_published_revision_id").eq("id", contentId).single(); break;
    case "program_topic": identityResult = await supabase.from("program_topics").select("current_published_revision_id").eq("id", contentId).single(); break;
    case "instructor": identityResult = await supabase.from("instructors").select("current_published_revision_id").eq("id", contentId).single(); break;
    case "teaching_note": identityResult = await supabase.from("teaching_notes").select("current_published_revision_id").eq("id", contentId).single(); break;
    case "material": identityResult = await supabase.from("materials").select("current_published_revision_id").eq("id", contentId).single(); break;
    case "institution": identityResult = await supabase.from("institutions").select("current_published_revision_id").eq("id", contentId).single(); break;
  }
  if (identityResult.error || !identityResult.data) throw new Error("Admin content read unavailable");
  const currentPublishedRevisionId = identityResult.data.current_published_revision_id;
  if (row.status === "Published" && currentPublishedRevisionId !== revisionId) notFound();
  const successorDraftRevisionId = row.status === "Published" ? await findActiveDraftRevision(type, contentId) : null;

  const relationships: Record<string, string[]> = {};
  if (type === "module") {
    const [instructors, materials, institutions] = await Promise.all([
      supabase.from("module_instructors").select("instructor_id").eq("module_revision_id", revisionId),
      supabase.from("module_materials").select("material_id").eq("module_revision_id", revisionId),
      supabase.from("module_institutions").select("institution_id").eq("module_revision_id", revisionId),
    ]);
    if (instructors.error || materials.error || institutions.error) throw new Error("Admin content read unavailable");
    relationships.instructor_ids = instructors.data.map((item) => item.instructor_id);
    relationships.material_ids = materials.data.map((item) => item.material_id);
    relationships.institution_ids = institutions.data.map((item) => item.institution_id);
  }
  if (type === "teaching_note") {
    const materials = await supabase.from("teaching_note_materials").select("material_id").eq("teaching_note_revision_id", revisionId);
    if (materials.error) throw new Error("Admin content read unavailable");
    relationships.material_ids = materials.data.map((item) => item.material_id);
  }
  let attachments: Attachment[] = [];
  if (type === "teaching_note" || type === "material") {
    const column = type === "teaching_note" ? "teaching_note_revision_id" : "material_revision_id";
    const attachmentResult = await supabase.from("curriculum_attachments").select("id,mime_type,object_name,original_filename,size_bytes,state").eq(column, revisionId).order("created_at");
    if (attachmentResult.error) throw new Error("Admin content read unavailable");
    attachments = attachmentResult.data;
  }
  const excluded = new Set(["id", contentKey, "status", "created_at", "created_by", "contributor_organization_id", "submitted_at", "published_at", "revision_number"]);
  const fields = Object.fromEntries(Object.entries(row).filter(([key]) => !excluded.has(key))) as ContributionDetail["fields"];
  return {
    type,
    revisionId,
    contentId,
    status: row.status as ContributionDetail["status"],
    revisionNumber: Number(row.revision_number),
    createdAt: String(row.created_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
    currentPublishedRevisionId,
    successorDraftRevisionId,
    fields,
    relationships,
    attachments,
  };
}

export async function findActiveDraftRevision(type: ContributionType, contentId: string): Promise<string | null> {
  if (!uuidPattern.test(contentId)) return null;
  await requireAccess("Admin");
  const supabase = await createClient();
  let result;
  switch (type) {
    case "module": result = await supabase.from("module_revisions").select("id").eq("module_id", contentId).eq("status", "Draft").maybeSingle(); break;
    case "program_topic": result = await supabase.from("program_topic_revisions").select("id").eq("program_topic_id", contentId).eq("status", "Draft").maybeSingle(); break;
    case "instructor": result = await supabase.from("instructor_revisions").select("id").eq("instructor_id", contentId).eq("status", "Draft").maybeSingle(); break;
    case "teaching_note": result = await supabase.from("teaching_note_revisions").select("id").eq("teaching_note_id", contentId).eq("status", "Draft").maybeSingle(); break;
    case "material": result = await supabase.from("material_revisions").select("id").eq("material_id", contentId).eq("status", "Draft").maybeSingle(); break;
    case "institution": result = await supabase.from("institution_revisions").select("id").eq("institution_id", contentId).eq("status", "Draft").maybeSingle(); break;
  }
  if (result.error) throw new Error("Admin content read unavailable");
  return result.data?.id ?? null;
}

export async function getContributionOptions(): Promise<ContributionOptions> {
  await requireAccess("Admin");
  const supabase = await createClient();
  const results = await Promise.all([
    supabase.from("axes").select("id,name").order("display_order"),
    supabase.from("module_revisions").select("module_id,title,status").in("status", managedStatuses).order("title"),
    supabase.from("program_topic_revisions").select("program_topic_id,module_id,title,status").in("status", managedStatuses).order("title"),
    supabase.from("instructor_revisions").select("instructor_id,name,status").in("status", managedStatuses).order("name"),
    supabase.from("material_revisions").select("material_id,title,status").in("status", managedStatuses).order("title"),
    supabase.from("institution_revisions").select("institution_id,name,status").in("status", managedStatuses).order("name"),
  ]);
  if (results.some((result) => result.error)) throw new Error("Admin content options unavailable");

  const options = (rows: { id: string; label: string; status: string; moduleId?: string }[]): ContributionOption[] => {
    const grouped = new Map<string, ContributionOption>();
    for (const row of rows) {
      const existing = grouped.get(row.id);
      if (!existing) grouped.set(row.id, { id: row.id, label: row.label, state: row.status === "Draft" ? "draft" : "published", moduleId: row.moduleId });
      else if (existing.state !== (row.status === "Draft" ? "draft" : "published")) {
        grouped.set(row.id, {
          id: row.id,
          label: row.status === "Draft" ? row.label : existing.label,
          state: "published_with_draft",
          moduleId: row.status === "Draft" ? row.moduleId : existing.moduleId,
        });
      }
    }
    return [...grouped.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
  };
  return {
    axes: results[0].data ?? [],
    modules: options((results[1].data ?? []).map((row) => ({ id: row.module_id, label: row.title, status: row.status }))),
    programTopics: options((results[2].data ?? []).map((row) => ({ id: row.program_topic_id, label: row.title, status: row.status, moduleId: row.module_id }))),
    instructors: options((results[3].data ?? []).map((row) => ({ id: row.instructor_id, label: row.name, status: row.status }))),
    materials: options((results[4].data ?? []).map((row) => ({ id: row.material_id, label: row.title, status: row.status }))),
    institutions: options((results[5].data ?? []).map((row) => ({ id: row.institution_id, label: row.name, status: row.status }))),
  };
}
