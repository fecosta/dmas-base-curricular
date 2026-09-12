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
