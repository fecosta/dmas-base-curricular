// Regenerates resources/curriculum/demo-curriculum.json from the approved UX/UI
// reference in resources/ux-ui/. The reference is the source material for this
// demo curriculum; repository documentation remains authoritative for product
// semantics. Output is deterministic: re-running produces a byte-identical file.
//
//   node scripts/build-curriculum-dataset.mjs
//
// This is operator tooling. It is not application or browser code.

import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import vm from "node:vm";

const REFERENCE = "resources/ux-ui/Base Curricular - Explorador (offline).html";
const OUTPUT = "resources/curriculum/demo-curriculum.json";

// Fixed namespace for RFC 4122 v5 identifiers. Never change it: every stable ID
// in the committed dataset derives from this namespace plus a stable name.
const NAMESPACE = "6f2a1c64-1f8e-4a5f-9d3b-2c7e5a0b4d11";
// Fixed publication instant so re-generation stays byte-identical and the
// importer's timestamp comparison keeps treating a re-import as unchanged.
const PUBLISHED_AT = "2026-09-16T00:00:00.000Z";

const AXES = {
  1: "a1000000-0000-4000-8000-000000000001",
  2: "a1000000-0000-4000-8000-000000000002",
};

/** RFC 4122 version 5 (SHA-1) UUID. Deterministic for a given namespace + name. */
function uuidv5(name, namespace = NAMESPACE) {
  const ns = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(Buffer.concat([ns, Buffer.from(name, "utf8")])).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Reads the prototype data block out of the bundled reference artifact. */
async function readSource() {
  const html = await readFile(resolve(REFERENCE), "utf8");
  const template = JSON.parse(html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);
  const script = [...template.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes("const MODULES"));
  const lines = script.split("\n");
  const data = lines.slice(0, lines.findIndex((l) => l.startsWith("const STORE"))).join("\n");
  const context = vm.createContext({});
  vm.runInContext(`${data}\n;globalThis.out = { MODULES, DETAIL, NOTAS, DOC_EXTRA };`, context);
  return context.out;
}

// --- Institution normalization -------------------------------------------------
// Source strings are merged only when they denote the same entity: an acronym
// expansion, a project/programme of a parent already present in the data, or a
// topical annotation. A single source string with no duplicate parent is kept
// verbatim rather than being split into an invented parent record.
const INSTITUTION_ALIASES = {
  "ALEPH — Escuela de campañas digitales": "ALEPH — Escuela de Política / Campañas",
  "American University — CMI": "American University — Campaign Management Institute",
  "Harvard Kennedy School — Reimagining the Economy": "Harvard Kennedy School",
  "J-PAL (evidencia sobre movilización)": "J-PAL",
  "J-PAL — métodos cuantitativos": "J-PAL",
  "J-PAL — Sector de Educación": "J-PAL",
  "J-PAL — Labor Markets": "J-PAL",
  "Leadership Institute — Advanced School of Politics": "Leadership Institute",
  "Leadership Institute — Campaign Leadership College": "Leadership Institute",
  "National Democratic Institute — Red Innovación": "National Democratic Institute",
  "World Resources Institute (WRI) — Brasil / México / Colombia": "World Resources Institute (WRI)",
};

// One module-level string names two separate organizations.
const INSTITUTION_SPLITS = { "J-PAL — Labor Markets / OIT": ["J-PAL", "OIT"] };

const INSTITUTION_TYPES = {
  "ALEPH — Escuela de Política / Campañas": "Escuela partidaria",
  "American University — Campaign Management Institute": "Universidad",
  "Brown University — Climate and Development Lab": "Universidad",
  "CIDE": "Universidad",
  "CIPPEC": "ONG / Think tank",
  "FGV EAESP": "Universidad",
  "George Washington University — GSPM": "Universidad",
  "Harvard Kennedy School": "Universidad",
  "ICP — Instituto de Capacitación Política": "Escuela partidaria",
  "IIED": "ONG / Think tank",
  "IISD": "ONG / Think tank",
  "Innovations for Poverty Action (IPA)": "ONG / Think tank",
  "International IDEA": "Multilateral",
  "International Republican Institute (IRI)": "ONG / Think tank",
  "J-PAL": "Universidad",
  "J-PAL (MIT) — oficina LAC en la PUC-Chile": "Universidad",
  "Leadership Institute": "Escuela partidaria",
  "MIT — Department of Economics": "Universidad",
  "National Democratic Institute": "ONG / Think tank",
  "OIT": "Multilateral",
  "Tecnológico de Monterrey — EGTP": "Universidad",
  "UCL — Institute for Innovation and Public Purpose": "Universidad",
  "Universidad Torcuato Di Tella": "Universidad",
  "Universidad de los Andes — Escuela de Gobierno": "Universidad",
  "University at Albany — Rockefeller College": "Universidad",
  "University of Richmond — Political Campaign Management": "Universidad",
  "World Resources Institute (WRI)": "ONG / Think tank",
};

// Only where the source string itself carries the scope.
const INSTITUTION_SCOPES = {
  "World Resources Institute (WRI)": "Brasil / México / Colombia",
  "J-PAL (MIT) — oficina LAC en la PUC-Chile": "Chile",
};

function institutionNames(raw) {
  if (INSTITUTION_SPLITS[raw]) return INSTITUTION_SPLITS[raw];
  return [INSTITUTION_ALIASES[raw] ?? raw];
}

// --- Material type normalization -----------------------------------------------
// Small controlled vocabulary carried over from the prototype's own list.
function materialType(title) {
  const t = title.toLowerCase();
  if (/^curso |^programa |especializaci|microcredencial/.test(t)) return "Curso / programa";
  if (/^bases de datos|^repositorio|^datos y plataformas|knowledge hub/.test(t)) return "Base de datos";
  if (/^manuales|^guías|^marco |^marcos |^estándares|^materiales/.test(t)) return "Manual / guía";
  if (/^documentos de trabajo/.test(t)) return "Artículo / publicación";
  return "Estudio / investigación";
}

/** Formats the prototype's pipe-separated note bullets as readable Spanish text. */
function formatNote(raw) {
  return raw.split("|").map((part) => `• ${part.trim()}`).join("\n");
}

const { MODULES, DETAIL, NOTAS, DOC_EXTRA } = await readSource();
const codes = MODULES.map((m) => m.id);

const identities = { modules: [], program_topics: [], instructors: [], teaching_notes: [], materials: [], institutions: [] };
const revisions = { module_revisions: [], program_topic_revisions: [], instructor_revisions: [], teaching_note_revisions: [], material_revisions: [], institution_revisions: [] };
const relationships = { module_instructors: [], module_materials: [], module_institutions: [], teaching_note_materials: [] };

const published = { revision_number: 1, status: "Published", published_at: PUBLISHED_AT };

// Modules ----------------------------------------------------------------------
const moduleIds = new Map();
const moduleRevisionIds = new Map();
for (const m of MODULES) {
  const id = uuidv5(`module:${m.id}`);
  const revisionId = uuidv5(`module_revision:${m.id}:1`);
  moduleIds.set(m.id, id);
  moduleRevisionIds.set(m.id, revisionId);
  identities.modules.push({ id, current_published_revision_id: revisionId });
  revisions.module_revisions.push({
    id: revisionId, module_id: id, ...published,
    axis_id: AXES[m.eje],
    title: m.title,
    theme: m.tema,
    description: m.desc,
    learning_outcomes: DETAIL[m.id].resultados,
    level: m.nivel,
    delivery_format: m.formato,
    suggested_duration: m.carga,
  });
}

// Program topics ----------------------------------------------------------------
const topicIds = new Map();
for (const code of codes) {
  DETAIL[code].ementa.forEach((title, index) => {
    const key = `${code}:${index + 1}`;
    const id = uuidv5(`program_topic:${key}`);
    const revisionId = uuidv5(`program_topic_revision:${key}:1`);
    topicIds.set(key, id);
    identities.program_topics.push({ id, current_published_revision_id: revisionId });
    revisions.program_topic_revisions.push({
      id: revisionId, program_topic_id: id, ...published,
      module_id: moduleIds.get(code),
      title,
      position: index + 1,
    });
  });
}

// Teaching notes -----------------------------------------------------------------
for (const code of codes) {
  NOTAS[code].forEach((raw, index) => {
    const key = `${code}:${index + 1}`;
    const id = uuidv5(`teaching_note:${key}`);
    const revisionId = uuidv5(`teaching_note_revision:${key}:1`);
    identities.teaching_notes.push({ id, current_published_revision_id: revisionId });
    revisions.teaching_note_revisions.push({
      id: revisionId, teaching_note_id: id, ...published,
      module_id: moduleIds.get(code),
      program_topic_id: topicIds.get(key),
      title: DETAIL[code].ementa[index],
      text: formatNote(raw),
    });
  });
}

// Instructors --------------------------------------------------------------------
// Only individuals the source names and profiles. Curator suggestions such as
// "(a sugerir)", "Especialista en ...", "Investigador/a ..." are not people.
const instructorModules = new Map();
for (const code of codes) {
  const names = new Set();
  for (const [name, , kind] of DETAIL[code].docentes) if (kind === "confirmado") names.add(name);
  for (const name of MODULES.find((m) => m.id === code).docente.split(";").map((s) => s.trim())) {
    if (DOC_EXTRA[name]) names.add(name);
  }
  for (const name of names) {
    if (!instructorModules.has(name)) instructorModules.set(name, []);
    instructorModules.get(name).push(code);
  }
}
const instructorIds = new Map();
for (const name of [...instructorModules.keys()].sort()) {
  const profile = DOC_EXTRA[name];
  const id = uuidv5(`instructor:${name}`);
  const revisionId = uuidv5(`instructor_revision:${name}:1`);
  instructorIds.set(name, id);
  identities.instructors.push({ id, current_published_revision_id: revisionId });
  const affiliation = profile.rol.includes(" · ") ? profile.rol.split(" · ")[1] : null;
  revisions.instructor_revisions.push({
    id: revisionId, instructor_id: id, ...published,
    name,
    role_or_title: profile.rol,
    institution: affiliation,
    profile: profile.perfil,
    thematic_axis_or_themes: [...new Set(instructorModules.get(name).map((c) => MODULES.find((m) => m.id === c).tema))].sort(),
  });
}

// Institutions --------------------------------------------------------------------
const institutionModules = new Map();
for (const code of codes) {
  const sourceModule = MODULES.find((m) => m.id === code);
  const names = new Set();
  for (const raw of DETAIL[code].centros) for (const n of institutionNames(raw)) names.add(n);
  for (const n of institutionNames(sourceModule.inst)) names.add(n);
  for (const n of names) {
    if (!institutionModules.has(n)) institutionModules.set(n, []);
    institutionModules.get(n).push(code);
  }
}
const institutionIds = new Map();
for (const name of [...institutionModules.keys()].sort()) {
  const id = uuidv5(`institution:${name}`);
  const revisionId = uuidv5(`institution_revision:${name}:1`);
  institutionIds.set(name, id);
  identities.institutions.push({ id, current_published_revision_id: revisionId });
  // Scope only when the source states it: either in the canonical name itself or
  // consistently through the module rows that host this institution.
  const hosted = [...new Set(MODULES.filter((m) => institutionNames(m.inst).includes(name)).map((m) => m.pais))];
  const scope = INSTITUTION_SCOPES[name] ?? (hosted.length === 1 ? hosted[0] : null);
  const revision = {
    id: revisionId, institution_id: id, ...published,
    name,
    institution_type: INSTITUTION_TYPES[name],
    themes: [...new Set(institutionModules.get(name).map((c) => MODULES.find((m) => m.id === c).tema))].sort(),
  };
  if (scope) revision.country_or_scope = scope;
  revisions.institution_revisions.push(revision);
}

// Materials -----------------------------------------------------------------------
const materialModules = new Map();
for (const code of codes) {
  for (const [title, source] of DETAIL[code].estudios) {
    const key = `${title}|||${source}`;
    if (!materialModules.has(key)) materialModules.set(key, { title, source, codes: [] });
    materialModules.get(key).codes.push(code);
  }
}
const materialIds = new Map();
for (const key of [...materialModules.keys()].sort()) {
  const { title, source, codes: owners } = materialModules.get(key);
  const id = uuidv5(`material:${key}`);
  const revisionId = uuidv5(`material_revision:${key}:1`);
  materialIds.set(key, id);
  identities.materials.push({ id, current_published_revision_id: revisionId });
  const themes = [...new Set(owners.map((c) => MODULES.find((m) => m.id === c).tema))];
  const revision = {
    id: revisionId, material_id: id, ...published,
    title,
    material_type: materialType(title),
    source_or_institution: source,
  };
  if (themes.length === 1) revision.theme = themes[0];
  revisions.material_revisions.push(revision);
}

// Relationships --------------------------------------------------------------------
for (const [name, owners] of [...instructorModules.entries()].sort()) {
  for (const code of owners.sort()) {
    relationships.module_instructors.push({ module_revision_id: moduleRevisionIds.get(code), instructor_id: instructorIds.get(name) });
  }
}
for (const [name, owners] of [...institutionModules.entries()].sort()) {
  for (const code of [...new Set(owners)].sort()) {
    relationships.module_institutions.push({ module_revision_id: moduleRevisionIds.get(code), institution_id: institutionIds.get(name) });
  }
}
for (const key of [...materialModules.keys()].sort()) {
  for (const code of [...new Set(materialModules.get(key).codes)].sort()) {
    relationships.module_materials.push({ module_revision_id: moduleRevisionIds.get(code), material_id: materialIds.get(key) });
  }
}
// The prototype does not associate a specific note with a specific study, so no
// teaching_note_materials edge can be derived without inventing one.

const payload = { version: 1, axes: JSON.parse(await readFile(resolve("resources/curriculum/approved-axes.json"), "utf8")).axes, identities, revisions, relationships };
await writeFile(resolve(OUTPUT), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Escrito ${OUTPUT}`);
for (const [group, tables] of Object.entries({ identities, revisions, relationships })) {
  for (const [table, rows] of Object.entries(tables)) console.log(`  ${group}.${table}: ${rows.length}`);
}
