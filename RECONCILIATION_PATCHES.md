# Reconciliation patches for existing authoritative documents

These patches complement the full replacement files in this bundle.

## `docs/DECISIONS.md`

In D-030, after the current Admin capability list, add:

```text
Admin Draft authority is role-wide rather than creator-owned.

Any currently eligible Admin may access and edit any active Admin-managed Draft, regardless of which Admin originally created the content or revision. `created_by` and creation-time organization remain immutable provenance; they do not create exclusive mutation authority.

Revoking Admin authority removes Draft-management authority on the next authoritative request, including for Drafts originally created by that user.
```

Also replace:

`Admin = governed-content writer/publisher`

with:

`Admin = role-wide governed-content writer/publisher`

The remainder of D-030 remains unchanged.

---

## `docs/GOVERNANCE.md`

In `## 3. Roles`, under `### Admin`, ensure the capabilities include:

```text
An Admin may:

- create governed content;
- access any active Admin Draft;
- edit any active Admin Draft regardless of original creator;
- manage permitted Draft relationships;
- manage permitted private attachments;
- publish valid Drafts;
- create later Draft revisions from published content;
- publish later revisions;
- archive/restore published content where separately implemented;
- access lifecycle/history information required for administration.

Admin Draft authority is based on the current live Admin role, not creator ownership.

`created_by` and creation-time organization remain provenance and do not grant exclusive editing authority to the Admin who originally created the Draft.
```

In `## 4. New-content workflow`, add after the workflow steps:

```text
Any currently eligible Admin may continue editing an active Admin Draft.

The Draft creator does not have exclusive mutation authority.
```

In `## 5. Published-content revision workflow`, add:

```text
Any currently eligible Admin may create or continue editing the active successor Draft.

Original revision creator identity remains provenance only.
```

In `## 15. Security boundary`, add:

```text
Active Admin Draft management is role-wide across currently eligible Admins. Authorization must not require `created_by = current user` for Admin-managed Drafts.
```

---

## `docs/SECURITY.md`

In `## 6. Authorization roles`, under `### Admin`, ensure it says:

```text
An eligible Admin may:

- access current published content;
- access any active Admin Draft;
- create governed curriculum content;
- edit any active Admin Draft regardless of original creator;
- manage permitted Draft relationships;
- manage permitted private attachments;
- create later Draft revisions from published content;
- publish valid Drafts;
- access governance/history information required for administration;
- archive and restore published content where separately implemented.

`created_by` and creation-time organization are provenance, not exclusive authorization boundaries between Admins.
```

Add to `## 7. Server and data-layer enforcement`:

```text
Admin Draft authorization must derive from the caller's current live Admin role.

An implementation must not require the current Admin to equal the Draft's `created_by` value in order to manage an active Admin Draft.

Role revocation must remove Draft-management authority on the next authoritative request, including for Drafts originally created by that user.
```

In `## 24. SPEC-004 target Admin-management security boundary`, add:

```text
### Admin-wide Draft management

Active Admin Drafts are not personal/owner-exclusive records.

Any currently eligible Admin may read and mutate any active Admin Draft through the bounded Admin-management operations.

Original creator and organization values remain immutable provenance.

The implementation must replace or supersede SPEC-003 owner-only authorization wherever that owner boundary would prevent role-wide Admin management.
```
