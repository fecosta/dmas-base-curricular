import "server-only";

import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import type { SuggestionRow } from "./suggestions";

export type ModuleSummary = {
  id: string;
  revision_id: string;
  axis_id: string;
  axis_name: string;
  title: string;
  theme: string | null;
  description: string;
  learning_outcomes: string[];
  suggested_duration: string | null;
};

export type SearchResult = {
  entity_type: "module" | "material" | "institution";
  id: string;
  title: string;
  description: string | null;
  classification: string;
  country_or_scope: string | null;
  theme: string | null;
  rank: number;
};

export type ProgramTopic = { id: string; title: string; description: string | null; position: number | null };
export type Instructor = {
  id: string; name: string; roleOrTitle: string | null; institution: string | null;
  profile: string | null; linkedinUrl: string | null; themes: string[]; country: string | null;
};
export type PublishedAttachment = {
  id: string; originalFilename: string; mimeType: string; sizeBytes: number;
};
export type TeachingNote = {
  id: string; title: string; text: string | null; sourceUrl: string | null; programTopicId: string | null;
  materials: { id: string; title: string }[]; attachments: PublishedAttachment[];
};
export type Material = {
  id: string; title: string; materialType: string; description: string | null; sourceOrInstitution: string | null;
  sourceUrl: string | null; countryOrScope: string | null; theme: string | null;
};
export type Institution = {
  id: string; name: string; institutionType: string; countryOrScope: string | null;
  description: string | null; websiteUrl: string | null; themes: string[];
};
export type ModuleDetail = {
  id: string; revisionId: string; title: string; description: string; theme: string | null;
  learningOutcomes: string[]; suggestedDuration: string | null; axis: { id: string; name: string };
  programTopics: ProgramTopic[]; instructors: Instructor[]; teachingNotes: TeachingNote[];
  materials: Material[]; institutions: Institution[];
};
export type ReferenceDetail = {
  entityType: "material" | "institution"; id: string; title: string; description: string | null;
  classification: string; countryOrScope: string | null; themes: string[];
  sourceOrInstitution?: string | null; sourceUrl?: string | null; websiteUrl?: string | null;
  attachments?: PublishedAttachment[];
};

export type LibraryFilters = {
  query?: string;
  entity?: "module" | "reference" | "material" | "institution";
  axis?: string;
  country?: string;
  theme?: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 160) : undefined;
}

export async function getLibrary(filters: LibraryFilters) {
  await requireAccess();
  const supabase = await createClient();
  const args = {
    search_query: clean(filters.query),
    entity_filter: filters.entity,
    axis_filter: uuidPattern.test(filters.axis ?? "") ? filters.axis : undefined,
    country_filter: clean(filters.country),
    theme_filter: clean(filters.theme),
  };
  const [axes, results, available] = await Promise.all([
    supabase.from("axes").select("id,name,display_order").order("display_order"),
    supabase.rpc("search_curriculum", args),
    supabase.rpc("search_curriculum", {}),
  ]);
  if (axes.error || results.error || available.error) throw new Error("Curriculum read unavailable");
  const all = available.data as SearchResult[];
  return {
    axes: axes.data,
    results: results.data as SearchResult[],
    countries: [...new Set(all.map((item) => item.country_or_scope).filter((value): value is string => !!value))].sort(),
    themes: [...new Set(all.flatMap((item) => item.theme?.split(",").map((value) => value.trim()) ?? []).filter(Boolean))].sort(),
  };
}

/**
 * Reader-visible rows behind the Library search suggestions.
 *
 * Runs the same `search_curriculum` RPC the Library itself runs, with only the
 * query applied. That function is security-invoker and its RLS restricts it to
 * current published, non-archived content, so a suggestion can never surface
 * anything the reader could not already find by submitting the same search.
 * No new RPC, no new search semantics, and no columns beyond the ones the
 * results list already shows.
 */
export async function getSearchSuggestions(query: string): Promise<SuggestionRow[]> {
  const search = clean(query);
  if (!search) return [];
  await requireAccess();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_curriculum", { search_query: search });
  if (error) throw new Error("Curriculum read unavailable");
  return (data as SearchResult[]).map((row) => ({
    entity_type: row.entity_type,
    id: row.id,
    title: row.title,
    classification: row.classification,
    country_or_scope: row.country_or_scope,
    theme: row.theme,
  }));
}

export async function getPublishedModules(filters: Pick<LibraryFilters, "query" | "axis" | "theme"> = {}) {
  await requireAccess();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_published_modules", {
    search_query: clean(filters.query),
    axis_filter: uuidPattern.test(filters.axis ?? "") ? filters.axis : undefined,
    theme_filter: clean(filters.theme),
  });
  if (error) throw new Error("Curriculum read unavailable");
  return data as ModuleSummary[];
}

export type ProgramOutline = { moduleId: string; topics: { id: string; title: string }[] };

/**
 * Program Topic titles for the given modules, used by the library's Programa view
 * so a reader can see curriculum structure without opening every module.
 *
 * Reads `program_topic_revisions` directly: the table grants select to
 * `authenticated` and its RLS policy already restricts rows to the current
 * published revision of a visible topic, so this resolves exactly the same
 * reader boundary as the module RPCs without adding one.
 */
export async function getProgramOutlines(moduleIds: string[]): Promise<ProgramOutline[]> {
  const ids = [...new Set(moduleIds)].filter((id) => uuidPattern.test(id));
  if (ids.length === 0) return [];
  await requireAccess();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_topic_revisions")
    .select("program_topic_id,module_id,title,position")
    .eq("status", "Published")
    .in("module_id", ids)
    .order("position", { ascending: true, nullsFirst: false })
    .order("title");
  if (error) throw new Error("Curriculum read unavailable");
  const byModule = new Map<string, ProgramOutline>(ids.map((id) => [id, { moduleId: id, topics: [] }]));
  for (const row of data ?? []) {
    byModule.get(row.module_id)?.topics.push({ id: row.program_topic_id, title: row.title });
  }
  return [...byModule.values()];
}

export async function getModule(id: string) {
  if (!uuidPattern.test(id)) notFound();
  await requireAccess();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_published_module", { target_id: id });
  if (error) throw new Error("Curriculum read unavailable");
  if (!data) notFound();
  return data as ModuleDetail;
}

export async function getReference(type: string, id: string) {
  if (!uuidPattern.test(id) || !["material", "institution"].includes(type)) notFound();
  await requireAccess();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_published_reference", { reference_type: type, target_id: id });
  if (error) throw new Error("Curriculum read unavailable");
  if (!data) notFound();
  return data as ReferenceDetail;
}
