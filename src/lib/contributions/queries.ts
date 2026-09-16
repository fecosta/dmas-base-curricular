import "server-only";

import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import type {
  ArchivedContentSummary,
  ArchivedCursor,
  Attachment,
  ContributionDetail,
  ContributionOption,
  ContributionOptions,
  ContributionSummary,
  ContributionType,
  LifecycleAction,
  LifecycleEvent,
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

export type ManagementFilters = {
  query?: string;
  type?: ContributionType;
  state?: ManagementState;
};

type ManagedTable = {
  type: ContributionType;
  identity: "modules" | "program_topics" | "instructors" | "teaching_notes" | "materials" | "institutions";
  revision: "module_revisions" | "program_topic_revisions" | "instructor_revisions" | "teaching_note_revisions" | "material_revisions" | "institution_revisions";
  foreignKey: string;
  titleColumn: "title" | "name";
};

const managedTables: ManagedTable[] = [
  { type: "module", identity: "modules", revision: "module_revisions", foreignKey: "module_id", titleColumn: "title" },
  { type: "program_topic", identity: "program_topics", revision: "program_topic_revisions", foreignKey: "program_topic_id", titleColumn: "title" },
  { type: "instructor", identity: "instructors", revision: "instructor_revisions", foreignKey: "instructor_id", titleColumn: "name" },
  { type: "teaching_note", identity: "teaching_notes", revision: "teaching_note_revisions", foreignKey: "teaching_note_id", titleColumn: "title" },
  { type: "material", identity: "materials", revision: "material_revisions", foreignKey: "material_id", titleColumn: "title" },
  { type: "institution", identity: "institutions", revision: "institution_revisions", foreignKey: "institution_id", titleColumn: "name" },
];

/**
 * Admin management listing.
 *
 * A content-type filter narrows which tables are queried at all, which is a real
 * server-side reduction. The text and state filters are applied after the fold —
 * still on the server, nothing extra is shipped to the browser — because both are
 * properties of the *derived* management summary. Filtering revision rows by title
 * in SQL would drop an identity's published revision whenever only its draft title
 * matched, silently reporting "draft" for content that is actually published with
 * an active successor.
 */
export async function listManagedContent(filters: ManagementFilters = {}): Promise<ContributionSummary[]> {
  await requireAccess("Admin");
  const supabase = await createClient();
  const tables = filters.type ? managedTables.filter((table) => table.type === filters.type) : managedTables;

  const loaded = await Promise.all(tables.map(async (table) => {
    const [identities, revisions] = await Promise.all([
      supabase.from(table.identity).select("id,current_published_revision_id"),
      supabase.from(table.revision)
        .select(`id,${table.foreignKey},status,${table.titleColumn},revision_number,created_at,published_at`)
        .in("status", managedStatuses),
    ]);
    if (identities.error || revisions.error) throw new Error("Admin content read unavailable");
    return { table, identities: identities.data ?? [], revisions: (revisions.data ?? []) as unknown as Record<string, unknown>[] };
  }));

  const toRevisions = (rows: Record<string, unknown>[], contentKey: string, titleKey: "title" | "name"): SummaryRevision[] => rows.map((row) => ({
    id: String(row.id),
    contentId: String(row[contentKey]),
    title: String(row[titleKey]),
    status: String(row.status),
    revisionNumber: Number(row.revision_number),
    createdAt: String(row.created_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
  }));

  const summaries = loaded.flatMap(({ table, identities, revisions }) =>
    mapManagementSummaries(table.type, identities as IdentityRow[], toRevisions(revisions, table.foreignKey, table.titleColumn)));

  const needle = filters.query?.trim().toLowerCase();
  return summaries
    .filter((summary) => (filters.state ? summary.state === filters.state : true))
    .filter((summary) => (needle ? summary.title.toLowerCase().includes(needle) : true))
    .sort((a, b) => b.activityAt.localeCompare(a.activityAt));
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

export const ARCHIVED_PAGE_SIZE = 20;
export const HISTORY_PAGE_SIZE = 25;

export type ArchivedContentPage = { entries: ArchivedContentSummary[]; nextCursor: ArchivedCursor | null };

/**
 * Archived governed content, read through the dedicated Admin-only RPC.
 *
 * Every direct table policy requires `archived_at is null`, so the active
 * management queries cannot see this content by construction — that is the reader
 * boundary working, not a gap to route around. The RPC is the only authorized path.
 *
 * One extra row is requested so the caller can tell "exactly a full page" from
 * "there is more" without a second round trip; the probe row is dropped before
 * mapping, and the cursor is taken from the last row actually returned.
 */
export async function listArchivedContent(options: {
  type?: ContributionType;
  cursor?: ArchivedCursor | null;
  pageSize?: number;
} = {}): Promise<ArchivedContentPage> {
  await requireAccess("Admin");
  const supabase = await createClient();
  // The RPC bounds page_size to 1..100 and rejects anything else; 99 keeps room for the probe row.
  const pageSize = Math.min(Math.max(options.pageSize ?? ARCHIVED_PAGE_SIZE, 1), 99);
  const cursor = options.cursor ?? null;
  const { data, error } = await supabase.rpc("list_archived_governed_content", {
    page_size: pageSize + 1,
    content_type_filter: options.type,
    // All three keyset components or none: a partial cursor is rejected by the RPC.
    before_archived_at: cursor?.archivedAt,
    before_content_id: cursor?.contentId,
    before_content_type: cursor?.contentType,
  });
  if (error) throw new Error("Archived content read unavailable");

  const rows = data ?? [];
  const entries: ArchivedContentSummary[] = rows.slice(0, pageSize).map((row) => ({
    type: row.content_type,
    contentId: row.content_id,
    currentPublishedRevisionId: row.current_published_revision_id,
    // Title and revision metadata are nullable by design: an archived identity whose
    // authoritative revision cannot be resolved must still reach the restore surface.
    currentPublishedRevisionNumber: row.revision_number,
    title: row.title,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by,
  }));
  const last = entries.at(-1);
  const nextCursor = rows.length > pageSize && last
    ? { archivedAt: last.archivedAt, contentId: last.contentId, contentType: last.type }
    : null;
  return { entries, nextCursor };
}

export type LifecycleHistoryPage = { events: LifecycleEvent[]; nextCursor: number | null };

/**
 * Governance history, read through the bounded Admin-only RPC.
 * `curriculum_lifecycle_events` has no `select` grant for `authenticated`, so this
 * is the only path — there is no direct table read to fall back to.
 */
export async function listLifecycleHistory(options: {
  type?: ContributionType;
  contentId?: string;
  action?: LifecycleAction;
  beforeEventId?: number | null;
  pageSize?: number;
} = {}): Promise<LifecycleHistoryPage> {
  await requireAccess("Admin");
  if (options.contentId && !uuidPattern.test(options.contentId)) return { events: [], nextCursor: null };
  const supabase = await createClient();
  const pageSize = Math.min(Math.max(options.pageSize ?? HISTORY_PAGE_SIZE, 1), 99);
  const { data, error } = await supabase.rpc("list_curriculum_lifecycle_history", {
    page_size: pageSize + 1,
    before_event_id: options.beforeEventId ?? undefined,
    content_type_filter: options.type,
    content_id_filter: options.contentId,
    action_filter: options.action,
  });
  if (error) throw new Error("Governance history read unavailable");

  const rows = data ?? [];
  const events: LifecycleEvent[] = rows.slice(0, pageSize).map((row) => ({
    eventId: row.event_id,
    type: row.content_type,
    contentId: row.content_id,
    revisionId: row.revision_id,
    actorUserId: row.actor_user_id,
    actorOrganizationId: row.actor_organization_id,
    actorOrganizationName: row.actor_organization_name,
    action: row.action,
    previousStatus: row.previous_status,
    resultingStatus: row.resulting_status,
    occurredAt: row.occurred_at,
  }));
  const last = events.at(-1);
  return { events, nextCursor: rows.length > pageSize && last ? last.eventId : null };
}

export function contentReferenceKey(type: ContributionType, contentId: string) {
  return `${type}:${contentId}`;
}

/**
 * Resolves readable titles for a small set of governed identities.
 *
 * Used for archive dependency blockers, which are by definition *active
 * current-published* identities — exactly what the existing Admin management
 * policies already allow this session to read. No boundary is widened and no
 * reader query is introduced; callers fall back to type + id when a title is
 * missing.
 */
export async function resolveContentTitles(
  references: { type: ContributionType; contentId: string }[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  if (references.length === 0) return resolved;
  await requireAccess("Admin");
  const supabase = await createClient();

  const byType = new Map<ContributionType, string[]>();
  for (const reference of references) {
    if (!uuidPattern.test(reference.contentId)) continue;
    if (!byType.has(reference.type)) byType.set(reference.type, []);
    const ids = byType.get(reference.type)!;
    if (!ids.includes(reference.contentId)) ids.push(reference.contentId);
  }

  await Promise.all([...byType].map(async ([type, ids]) => {
    const table = managedTables.find((candidate) => candidate.type === type)!;
    const identities = await supabase.from(table.identity).select("id,current_published_revision_id").in("id", ids);
    if (identities.error || !identities.data) return;
    const revisionIds = identities.data.map((row) => row.current_published_revision_id).filter((id): id is string => Boolean(id));
    if (revisionIds.length === 0) return;
    const revisions = await supabase.from(table.revision).select(`id,${table.titleColumn}`).in("id", revisionIds);
    if (revisions.error || !revisions.data) return;
    const titles = new Map((revisions.data as unknown as Record<string, unknown>[]).map((row) => [String(row.id), String(row[table.titleColumn])]));
    for (const identity of identities.data) {
      const title = identity.current_published_revision_id ? titles.get(identity.current_published_revision_id) : undefined;
      if (title) resolved.set(contentReferenceKey(type, identity.id), title);
    }
  }));

  return resolved;
}
