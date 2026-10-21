---
name: site-from-brief
description: Create a new static website project from a written brief using the existing design system. Use when the request has no URL, screenshot, or other visual reference; do not use for reference-led sites, small edits, or design-system-only work.
---

# Site from brief

Use this skill only for a new project whose visual direction is defined by a
written brief rather than a visual reference. For a URL, screenshot or another
reference, use `site-from-reference`.

## Inputs

Require a brief with niche or product type, target audience, required pages and
user-visible functions, content tone and brand direction, and known constraints
for assets, platform or delivery. Record an absent input as an assumption in
`projects/<slug>/docs/brief.md`. This is expert judgement, not a replacement
for owner confirmation when the choice changes scope.

## Required outputs

Create `brief.md`, `page-blueprint.md`, `token-map.md`, `project.json` with
`mode: "brief"` and `compliance: "strict"`, and `assets.json` under
`projects/<slug>/`. Create `design-system-gap-report.md` for any `EXTEND` or
`BLOCKED` section. Every top-level page section needs a fenced `ds-section`
JSON block in `token-map.md` matching
`../../../schemas/ds-section.schema.json`.

Use [Design System First](../../../design-system/docs/generation/design-system-first.md)
as the authority for statuses and stop conditions.

## State and stop conditions

Record the current state and blockers in `brief.md`; do not add undocumented
fields to `project.json`.

- `mapped`: every top-level section of every page has a `ds-section` entry.
- `awaiting-approval`: a substantial `EXTEND` or `BLOCKED` has a gap report.
- `implemented`: approved `REUSE` or `COMPOSE` scope is implemented.
- `verified`: documented technical checks have run.
- `accepted`: expert review against the brief is recorded separately.

When dialogue is unavailable, stop at `awaiting-approval` after creating the
gap report. Do not implement the affected section or invent a local visual API.

## Reading index

1. **Map:** `AGENTS.md`, Design System First, the project/assets/ds-section
   schemas and the [knowledge README](../../../design-system/docs/generation/knowledge/README.md).
2. **Select:** search knowledge and the catalog; read only returned entries and
   selected component/block contracts.
3. **Implement:** read selected contracts and the
   [project template](../../../design-system/templates/project/README.md).
4. **Verify:** read [build instructions](../../../design-system/docs/build.md)
   and the visual-QA checklist.

## Workflow

1. Turn the brief into `brief.md`: pages, functions, content requirements,
   assumptions and acceptance criteria. Result: reviewable scope; assumptions
   are expert judgement.
2. Create `page-blueprint.md` before HTML/CSS. Result: each page has section
   order, hierarchy and responsive intent.
3. Search knowledge:

   ```sh
   npm run kb:search -- --status verified,approved,candidate --page-type home
   ```

   Inspect returned implementations, viewport coverage and limitations.
   `candidate` is investigation material only, never ready-to-copy code.
   Result: each returned ID is accepted or rejected with a reason.
4. Before every component, block or section need, search the catalog:

   ```sh
   npm run catalog:search -- --purpose <need>
   ```

   Record a matching catalog entry ID in `ds_sources` of the related
   `ds-section`. A fitting entry means `REUSE` or `COMPOSE`; no fitting entry
   after class/purpose/kind/token/a11y searches means `EXTEND` or `BLOCKED`.
   Result: the token map is machine-checkable.
5. For each substantial `EXTEND` or `BLOCKED`, create a gap report and stop.
   Result: affected code is not created without approval.
6. Create the manifest and initialise owner styles:

   ```sh
   npm run project:styles -- init <slug>
   ```

   Result: `styles/custom.scss` is created only when absent and remains owner
   content thereafter.
7. Define the complete `theme` object in `project.json` from the brief's tone
   and brand direction. Generate marked CSS:

   ```sh
   npm run project:styles -- build <slug>
   ```

   Connect `css/theme.css` immediately after `blocks.css` and before project
   and owner styles. Record contrast warnings for `on_primary`/`primary` and
   `on_accent`/`accent`; do not hide them with unrelated overrides. Result: a
   strict project without `theme` fails `check:theme`.
8. Register assets before use. Until the owner supplies rights evidence, use
   only locally created neutral SVG/CSS placeholders with
   `rights: "placeholder"`; do not use third-party material or HTTP(S) assets.
   `rights: "unknown"` fails `check:assets` for a new project. Result: every
   resource is local, exists and is declared in `assets.json`.
9. Implement approved scope with documented contracts. Behaviour beyond native
   HTML, including disclosure widgets, forms and anchors, has no general DS
   interaction contract: classify it `EXTEND` or `BLOCKED` and do not write
   project JavaScript. If an element is only a mockup, mark it with a clear
   non-working attribute and visible demo label so it does not look functional.
   Result: implemented behaviour has an approved contract.
10. Mark invented facts such as named testimonials, prices, delivery/return
    terms and contacts as visible `demo` placeholders. Mark language fragments
    with the appropriate `lang` attribute. Result: content does not imply
    unverified real-world facts.
11. Run delivery checks:

    ```sh
    npm run build
    npm run check:sass
    npm run check:project -- <slug>
    npm run check:assets -- <slug>
    npm run site:build -- <slug>
    npm run check:site -- <slug>
    npm run qa -- <slug>
    npm run check:compliance -- <slug>
    npm run check:theme -- <slug>
    ```

    Result: technical outcomes are recorded. A passing build is not an expert
    design verdict.
12. Evaluate against the brief, not an absent visual reference. Keep expert
    review separate from technical results. Result: expert judgement is
    explicitly labelled.

## Authority boundaries

- Do not change shared tokens, components, blocks, mixins, icons, skills or
  `AGENTS.md` for one brief.
- Do not infer asset rights or use unknown-rights assets.
- Do not implement unapproved `EXTEND`/`BLOCKED` scope locally.
- Preserve `styles/custom.scss` byte-for-byte on repeat generation.
