import "server-only";

import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import type { Attachment, ContributionDetail, ContributionOption, ContributionOptions, ContributionStatus, ContributionSummary, ContributionType } from "./types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const pendingStatuses = ["Draft", "Submitted"] as const;

export async function listOwnContributions(): Promise<ContributionSummary[]> {
  await requireAccess();
  const supabase = await createClient();
  const results = await Promise.all([
    supabase.from("module_revisions").select("id,module_id,status,title,created_at,submitted_at").in("status", pendingStatuses).order("created_at", { ascending: false }),
    supabase.from("program_topic_revisions").select("id,program_topic_id,status,title,created_at,submitted_at").in("status", pendingStatuses).order("created_at", { ascending: false }),
    supabase.from("instructor_revisions").select("id,instructor_id,status,name,created_at,submitted_at").in("status", pendingStatuses).order("created_at", { ascending: false }),
    supabase.from("teaching_note_revisions").select("id,teaching_note_id,status,title,created_at,submitted_at").in("status", pendingStatuses).order("created_at", { ascending: false }),
    supabase.from("material_revisions").select("id,material_id,status,title,created_at,submitted_at").in("status", pendingStatuses).order("created_at", { ascending: false }),
    supabase.from("institution_revisions").select("id,institution_id,status,name,created_at,submitted_at").in("status", pendingStatuses).order("created_at", { ascending: false }),
  ]);
  if (results.some((result) => result.error)) throw new Error("Contribution read unavailable");
  const modules = results[0].data ?? [];
  const topics = results[1].data ?? [];
  const instructors = results[2].data ?? [];
  const notes = results[3].data ?? [];
  const materials = results[4].data ?? [];
  const institutions = results[5].data ?? [];
  return [
    ...modules.map((row) => summary("module", row.module_id, row.id, row.title, row.status, row.created_at, row.submitted_at)),
    ...topics.map((row) => summary("program_topic", row.program_topic_id, row.id, row.title, row.status, row.created_at, row.submitted_at)),
    ...instructors.map((row) => summary("instructor", row.instructor_id, row.id, row.name, row.status, row.created_at, row.submitted_at)),
    ...notes.map((row) => summary("teaching_note", row.teaching_note_id, row.id, row.title, row.status, row.created_at, row.submitted_at)),
    ...materials.map((row) => summary("material", row.material_id, row.id, row.title, row.status, row.created_at, row.submitted_at)),
    ...institutions.map((row) => summary("institution", row.institution_id, row.id, row.name, row.status, row.created_at, row.submitted_at)),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function summary(type: ContributionType, contentId: string, revisionId: string, title: string, status: string, createdAt: string, submittedAt: string | null): ContributionSummary {
  return { type, contentId, revisionId, title, status: status as ContributionStatus, createdAt, submittedAt };
}

export async function getContribution(type: ContributionType, revisionId: string): Promise<ContributionDetail> {
  if (!uuidPattern.test(revisionId)) notFound();
  await requireAccess();
  const supabase = await createClient();
  let result;
  switch (type) {
    case "module": result = await supabase.from("module_revisions").select("*").eq("id", revisionId).in("status", pendingStatuses).maybeSingle(); break;
    case "program_topic": result = await supabase.from("program_topic_revisions").select("*").eq("id", revisionId).in("status", pendingStatuses).maybeSingle(); break;
    case "instructor": result = await supabase.from("instructor_revisions").select("*").eq("id", revisionId).in("status", pendingStatuses).maybeSingle(); break;
    case "teaching_note": result = await supabase.from("teaching_note_revisions").select("*").eq("id", revisionId).in("status", pendingStatuses).maybeSingle(); break;
    case "material": result = await supabase.from("material_revisions").select("*").eq("id", revisionId).in("status", pendingStatuses).maybeSingle(); break;
    case "institution": result = await supabase.from("institution_revisions").select("*").eq("id", revisionId).in("status", pendingStatuses).maybeSingle(); break;
  }
  if (result.error) throw new Error("Contribution read unavailable");
  if (!result.data) notFound();
  const row = result.data as Record<string, unknown>;
  const contentKey = `${type}_id`;
  const relationships: Record<string, string[]> = {};
  if (type === "module") {
    const [instructors, materials, institutions] = await Promise.all([
      supabase.from("module_instructors").select("instructor_id").eq("module_revision_id", revisionId),
      supabase.from("module_materials").select("material_id").eq("module_revision_id", revisionId),
      supabase.from("module_institutions").select("institution_id").eq("module_revision_id", revisionId),
    ]);
    if (instructors.error || materials.error || institutions.error) throw new Error("Contribution read unavailable");
    relationships.instructor_ids = instructors.data.map((item) => item.instructor_id);
    relationships.material_ids = materials.data.map((item) => item.material_id);
    relationships.institution_ids = institutions.data.map((item) => item.institution_id);
  }
  if (type === "teaching_note") {
    const materials = await supabase.from("teaching_note_materials").select("material_id").eq("teaching_note_revision_id", revisionId);
    if (materials.error) throw new Error("Contribution read unavailable");
    relationships.material_ids = materials.data.map((item) => item.material_id);
  }
  let attachments: Attachment[] = [];
  if (type === "teaching_note" || type === "material") {
    const column = type === "teaching_note" ? "teaching_note_revision_id" : "material_revision_id";
    const attachmentResult = await supabase.from("curriculum_attachments").select("id,mime_type,object_name,original_filename,size_bytes,state").eq(column, revisionId).order("created_at");
    if (attachmentResult.error) throw new Error("Contribution read unavailable");
    attachments = attachmentResult.data;
  }
  const excluded = new Set(["id", contentKey, "status", "created_at", "created_by", "contributor_organization_id", "submitted_at", "published_at", "revision_number"]);
  const fields = Object.fromEntries(Object.entries(row).filter(([key]) => !excluded.has(key))) as ContributionDetail["fields"];
  return {
    type, revisionId, contentId: String(row[contentKey]), status: row.status as ContributionStatus,
    createdAt: String(row.created_at), submittedAt: row.submitted_at as string | null, fields, relationships, attachments,
  };
}

export async function getContributionOptions(): Promise<ContributionOptions> {
  await requireAccess();
  const supabase = await createClient();
  const results = await Promise.all([
    supabase.from("axes").select("id,name").order("display_order"),
    supabase.from("module_revisions").select("module_id,title,status").in("status", ["Draft", "Submitted", "Published"]).order("title"),
    supabase.from("program_topic_revisions").select("program_topic_id,module_id,title,status").in("status", ["Draft", "Submitted", "Published"]).order("title"),
    supabase.from("instructor_revisions").select("instructor_id,name,status").in("status", ["Draft", "Submitted", "Published"]).order("name"),
    supabase.from("material_revisions").select("material_id,title,status").in("status", ["Draft", "Submitted", "Published"]).order("title"),
    supabase.from("institution_revisions").select("institution_id,name,status").in("status", ["Draft", "Submitted", "Published"]).order("name"),
  ]);
  if (results.some((result) => result.error)) throw new Error("Contribution options unavailable");
  const axes = results[0].data ?? [];
  const modules = results[1].data ?? [];
  const topics = results[2].data ?? [];
  const instructors = results[3].data ?? [];
  const materials = results[4].data ?? [];
  const institutions = results[5].data ?? [];
  const option = (id: string, label: string, status: string, moduleId?: string): ContributionOption => ({
    id, label, state: status === "Draft" ? "draft" : status === "Submitted" ? "submitted" : "published", moduleId,
  });
  return {
    axes,
    modules: modules.map((row) => option(row.module_id, row.title, row.status)),
    programTopics: topics.map((row) => option(row.program_topic_id, row.title, row.status, row.module_id)),
    instructors: instructors.map((row) => option(row.instructor_id, row.name, row.status)),
    materials: materials.map((row) => option(row.material_id, row.title, row.status)),
    institutions: institutions.map((row) => option(row.institution_id, row.name, row.status)),
  };
}
