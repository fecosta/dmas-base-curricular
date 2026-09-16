# Trusted curriculum import

`scripts/import-curriculum.mjs` loads operator-approved published curriculum data through an administrative Supabase credential. It is not application or browser code.

The importer requires stable UUIDs for identities and revisions. One restricted PostgreSQL RPC transaction inserts identities before typed revisions and relationships, then resolves each identity's `current_published_revision_id`. Re-running the same file is a no-op. If an existing stable ID has different data, a relationship is invalid, or an identity points to another revision, the complete transaction rolls back instead of leaving a partial import or mutating a published revision.

Only `Published` revisions with `published_at` are accepted in SPEC-002. Draft/review creation and publication transitions belong to later specifications.

Confirm the exact target explicitly:

```sh
SUPABASE_URL=http://127.0.0.1:55321 \
SUPABASE_SECRET_KEY=<local-or-cloud-operator-secret> \
CURRICULUM_IMPORT_TARGET=http://127.0.0.1:55321 \
npm run db:import-curriculum -- resources/curriculum/approved-axes.json
```

For real curriculum population, extend a separately reviewed copy of the version-1 JSON structure. Keep all arrays present. Identity objects include `current_published_revision_id`; revision records use the matching typed revision table. Relationship records target a module or teaching-note revision and the stable identity of the associated object.

The committed file contains only the two approved authoritative axes. Fictional module/reference fixtures remain under database and E2E tests.

## Demo curriculum dataset

`demo-curriculum.json` is a reviewed version-1 import file holding the curriculum content normalized from the approved UX/UI reference in `resources/ux-ui/`. It is demo content for populating a working library, not an authoritative product contract: `docs/` remains authoritative for product semantics.

Regenerate it with:

```sh
node scripts/build-curriculum-dataset.mjs
```

The generator reads the reference artifact, so the output is reproducible and byte-identical across runs. Re-running it must never change existing identifiers.

### Stable identifiers

Every identity and revision ID is an RFC 4122 version-5 UUID derived from a fixed namespace plus a stable name such as `module:E1.01`, `program_topic:E1.01:3`, or `institution:J-PAL`. The namespace constant lives in the generator and must not change: changing it would orphan every already-imported row. `published_at` is a fixed instant for the same reason — a moving timestamp would make re-import fail the importer's unchanged-row comparison.

The two approved axes are reused from `approved-axes.json` rather than redefined.

### Prototype vocabulary translated to the current model

The reference calls a module's program items `ementa`. Those become `program_topics`, which is the current product term. The reference's parallel `NOTAS` array becomes one Teaching Note per Program Topic, preserving the source order; each note's pipe-separated bullets are formatted as a bulleted Spanish text block.

### Instructors

Only individuals the source both names and profiles become Instructor identities. The reference also carries curator suggestions — `(a sugerir)`, `Especialista en …`, `Investigador/a …`, `Directora/or …` and similar `perfil buscado` entries. Those describe a profile being sought, not an identifiable person, and are deliberately not imported.

A module-to-instructor row records that the reference associates that person with the module. It is not a claim that the person has agreed to teach, and the imported profile text preserves that weaker meaning. No LinkedIn URL is imported: the source field holds a search label, not an address. No country is imported, because the source states institutional affiliation rather than the person's country.

### Institution normalization

Source strings are merged only when they denote the same entity:

- an acronym and its expansion (`American University — CMI` into `American University — Campaign Management Institute`);
- a named project or programme of a parent already present in the data (`Harvard Kennedy School — Reimagining the Economy` into `Harvard Kennedy School`; `Leadership Institute — Advanced School of Politics` and `— Campaign Leadership College` into `Leadership Institute`; `National Democratic Institute — Red Innovación` into `National Democratic Institute`);
- a topical annotation rather than a distinct unit (`J-PAL (evidencia sobre movilización)`, `J-PAL — métodos cuantitativos`, `J-PAL — Sector de Educación` and `J-PAL — Labor Markets` into `J-PAL`);
- a name that carries its own scope (`World Resources Institute (WRI) — Brasil / México / Colombia` into `World Resources Institute (WRI)`, with the scope moved to `country_or_scope`).

Two cases are deliberately **not** merged:

- `J-PAL (MIT) — oficina LAC en la PUC-Chile` stays separate from `J-PAL`. It is a located regional office hosted by a different university, and collapsing it would force a contradictory `country_or_scope`.
- `MIT — Department of Economics` stays separate from `J-PAL`. An academic department and a research lab are different units that happen to share a parent university.

A single source string with no duplicate parent is kept verbatim rather than being split into an invented parent record, which is why entries such as `University of Richmond — Political Campaign Management` remain as written.

One module-level string, `J-PAL — Labor Markets / OIT`, names two organizations and is split into both.

Institution types use the reference's own small vocabulary: `Universidad`, `Escuela partidaria`, `Multilateral`, `ONG / Think tank`.

### Material normalization

Material types use the reference's vocabulary: `Estudio / investigación`, `Informe institucional`, `Manual / guía`, `Curso / programa`, `Base de datos`, `Presentación`, `Artículo / publicación`.

No two source entries were identical, so nothing was deduplicated. One pair is related but not equivalent and is preserved separately: `Experiencia MineduLab` (IPA / Perú) and `Alianzas gobierno-evidencia (ej.: MineduLab, Perú)` (IPA). The first names the programme, the second names a broader topic that cites it as an example. Treating them as one material would assert an equivalence the source does not state.

Materials carry only what the source supplies: title, `source_or_institution`, and the owning module's theme. No URL, description, country, author, or publication metadata is invented.

### Relationships and governance state

`module_instructors`, `module_materials` and `module_institutions` are populated from the reference. `teaching_note_materials` is empty: the reference associates studies with a module, never with a specific note, so no such edge can be derived without inventing one.

Every revision is `Published`, `revision_number` 1, with its identity's `current_published_revision_id` resolved. The dataset deliberately contains no Draft or successor revisions, no archived records, no lifecycle events, and no `created_by` provenance — the schema leaves provenance nullable, and inventing actors for imported demo content would falsify authorship. Those states belong to real product workflows or dedicated test fixtures.
