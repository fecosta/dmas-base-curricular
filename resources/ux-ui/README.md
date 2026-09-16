# D+ Base Curricular — UX/UI References

## Purpose

This directory stores approved UX/UI reference artifacts used to guide the real application interface.

The artifacts record agreed visual direction and interaction intent so that interface work has a durable, reviewable source instead of relying on screenshots, conversation history, or an implementer's recollection.

They are design evidence. They are not product contracts.

## Current baseline

`Base Curricular - Explorador (offline).html`

This is the current visual and interaction baseline. It is the reference used to implement the application UX baseline introduced by commit `7c9a696cfd5e22cb035a5d97a2899783ed4e3a7b` ("feat: implement application UX baseline", 2026-09-16), which established the token layer, shared primitives, application shell, reader surfaces, Admin management presentation, and route states.

The file is a self-unpacking bundled export: the page content, styles, and fonts are embedded and are assembled by script when the file is opened in a browser. Open it directly in a browser to inspect it.

Note a naming difference worth resolving separately: the evidence lists in `docs/PRODUCT.md`, `docs/CONTENT_MODEL.md`, and `docs/SECURITY.md` cite the latest static prototype as `Base Curricular - Explorador (offline)(3).html`. The artifact tracked here is named `Base Curricular - Explorador (offline).html` and is the export that was approved as the baseline for the commit above. Whether the two filenames denote the same export has not been verified in this repository.

## Authority

UX/UI reference artifacts are authoritative for:

- visual direction;
- information hierarchy;
- component language;
- spacing;
- typography intent;
- interaction patterns;
- responsive intent.

They are **not** authoritative for:

- product behavior;
- authorization;
- governance;
- lifecycle semantics;
- data model;
- publication;
- archival;
- audit history;
- security.

When a reference conflicts with the repository's product contracts, the contracts win. Authority runs in this order:

```text
AGENTS.md
docs/
active specification
implemented security and data contracts
-------------------------------------- (above this line wins)
UX/UI reference artifacts
```

In practice this means a reference may show an affordance the product does not grant, imply metadata the content model does not hold, or demonstrate behavior that exists only as a prototype convenience. In each case, preserve the implemented product contract and adapt the visual pattern to it. Do not implement behavior merely because a reference displays it, and do not silently prefer a mockup over verified application behavior.

A reference is also not evidence that a capability is in scope. Scope comes from the active specification.

## Supersession

A new reference artifact must state its relationship to the existing baseline. It either:

- **supplements** the baseline, adding surfaces the baseline does not cover;
- **supersedes** the baseline, replacing it as the current visual and interaction reference; or
- **applies to a bounded surface**, changing only the surfaces it names and leaving the baseline authoritative elsewhere.

Record that relationship in this README when the artifact is added.

Do not treat the newest filename, timestamp, or export suffix as authoritative on its own. Export tooling produces names such as `(1)`, `(2)`, and `(3)` that do not reliably indicate approval, recency, or intent.

## Preservation

Do not edit a reference artifact in place to match later implementation changes. Its value is that it records what was approved at a point in time; editing it destroys the ability to tell design intent apart from implementation drift.

When a new approved reference supersedes an existing one, keep the superseded artifact and make the replacement relationship explicit here rather than overwriting or deleting the previous file.

Where implementation deliberately departs from an approved reference — because a product contract, accessibility requirement, or data-model constraint required it — record that departure in the implementing commit or specification, not by altering the artifact.
