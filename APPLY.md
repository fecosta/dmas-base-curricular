# Apply notes

Base reviewed commit: `39e140c`

## Full replacement files

Replace the repository versions with:

- `AGENTS.md`
- `README.md`
- `docs/PRODUCT.md`
- `docs/CONTENT_MODEL.md`
- `docs/ARCHITECTURE.md`
- `resources/specs/README.md`

## Planned spec renames

```sh
git mv resources/specs/planned/004-review-approval-publication.md \
  resources/specs/planned/004-admin-content-management-publication.md

git mv resources/specs/planned/005-revisions-audit-history-archival.md \
  resources/specs/planned/005-audit-history-archival.md
```

Then replace their contents with the bundled versions.

## Small authoritative patches

Apply `RECONCILIATION_PATCHES.md` to:

- `docs/DECISIONS.md`
- `docs/GOVERNANCE.md`
- `docs/SECURITY.md`

These small edits record the additional confirmed rule:

> Any currently eligible Admin may create, access, and edit any active Admin-managed Draft regardless of original creator. `created_by` remains provenance, not exclusive ownership.

## Validation

```sh
git diff --check
git status
git diff -- \
  AGENTS.md \
  README.md \
  docs/PRODUCT.md \
  docs/CONTENT_MODEL.md \
  docs/ARCHITECTURE.md \
  docs/DECISIONS.md \
  docs/GOVERNANCE.md \
  docs/SECURITY.md \
  resources/specs/README.md \
  resources/specs/planned/
```

After this reconciliation is committed, re-check the repository and explicitly promote SPEC-004 from `planned/` to `active/` before implementation.
