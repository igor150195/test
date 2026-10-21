---
name: knowledge-capture
description: Extract candidate reusable knowledge after a project has documented acceptance and QA evidence. Do not use before acceptance, during implementation, or to modify active knowledge, design-system contracts, skills, or registry files.
---

# Knowledge capture

Use this skill only after project acceptance. It extracts small, evidence-backed
candidates without promoting project code into the active knowledge base.

## Inputs

Require `projects/<slug>/docs/acceptance.md`,
`projects/<slug>/artifacts/qa/latest/results.json`, the token map, a gap report
when present, `styles/custom.scss` when present, and a relevant Git diff when
history is available.

`acceptance.md` is created and edited only by the project owner. Its minimal
format is:

```md
---
accepted_by: <person-or-role>
accepted_on: YYYY-MM-DD
commit: <40-character Git SHA>
---

# Acceptance

Accepted scope and remaining explicitly accepted limitations.
```

Without this file, state is `blocked`: do not write candidates.

## Required outputs

Write only candidates and evidence beneath:

```text
design-system/docs/generation/knowledge/inbox/
```

and the project report:

```text
projects/<slug>/docs/knowledge-capture.md
```

Each candidate is `status: candidate`. Never set `verified` or `approved`.
Copy text evidence into `inbox/evidence/<id>/`: `results.json`, relevant token
map, gap report, acceptance record or a small source excerpt. Do not copy PNG
or other gitignored QA artifacts. Candidate frontmatter references these copied
paths, never an absolute path or a project artifact path.

## State and stop conditions

- `evidence-ready`: acceptance, QA result and token map exist.
- `screened`: project-specific material and duplicates are reviewed.
- `captured`: candidate files, evidence snapshots and report exist.
- `no-candidate`: the report explains why no reusable candidate is safe.
- `blocked`: acceptance or required evidence is absent.

Verify the acceptance commit with `git cat-file -e <sha>^{commit}`. Compare
project changes after that SHA with the current worktree. If they differ, mark
evidence drift in `knowledge-capture.md`; do not claim that the acceptance
covers the current files. When dialogue is unavailable, stop at `blocked` or
`no-candidate`; do not infer acceptance or promote a candidate.

## Reading index

1. **Gate:** manifest, acceptance, `artifacts/qa/latest/results.json`, token
   map and any gap report.
2. **Classify:** [learning architecture](../../../docs/generator/learning-architecture.md)
   sections 2, 5 and 6 and the
   [knowledge README](../../../design-system/docs/generation/knowledge/README.md).
3. **De-duplicate:** use `kb:search`, then inspect only returned entries.
4. **Validate:** read [inbox rules](../../../design-system/docs/generation/knowledge/inbox/README.md).

## Workflow

1. Confirm acceptance, evidence paths and acceptance-SHA state. Result:
   `knowledge-capture.md` identifies exact source paths, drift or a blocker.
2. Exclude project-specific material: project-slug classes, literal hex outside
   tokens, external hosts, fixed project copy or a project-specific image crop.
   Result: exclusions and reasons are explicit.
3. Consider only a minimal composition with repeatable evidence, a recurrent
   error with a verified fix, or demand for a Design System extension documented
   by an `EXTEND` gap. Result: every candidate has purpose and limits.
4. Search active knowledge and, when comparing pending proposals, inbox:

   ```sh
   npm run kb:search -- --tag <tag>
   npm run kb:search -- --include-inbox --tag <tag>
   ```

   On a match in active knowledge or inbox, supplement that entry's
   `evidence.projects` instead of creating a duplicate. Result: no duplicate
   candidate is created.
5. Copy non-project-specific text evidence, write the smallest reproducible
   candidate to inbox and validate it:

   ```sh
   npm run kb:validate -- --inbox
   ```

   Result: a valid inbox-only candidate absent from active registry, index and
   normal `kb:search`.
6. Write `knowledge-capture.md`. Result: a reviewer can promote, merge, reject
   or defer each candidate.

## Authority boundaries

- Do not create or edit `acceptance.md`.
- Do not edit active `patterns/`, `registry.yml`, `index.json`, shared design
  system files, skills or project source code.
- Do not automatically promote a candidate.
- Do not relocate or alter `styles/custom.scss`.
- Do not treat one project's owner preference or unapproved `EXTEND` workaround
  as reusable API.
