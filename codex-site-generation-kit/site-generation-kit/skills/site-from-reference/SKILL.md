---
name: site-from-reference
description: Create a new website project from a supplied website URL or screenshot using the existing design system. Use when the task is to recreate or adapt a visual reference into a new project.
---

# Site from Reference

## Goal

Create a new, isolated project that uses the existing design-system API wherever practical and is checked in a real browser before being called complete.

## Use this skill when

- The user supplies a website URL, screenshot, or set of screenshots and asks to create a new site from it.
- The work starts a new page/project based on a visual reference.

Do not use it for a small change to an existing page or for a design-system-only refactor; use the relevant project workflow instead.

## Workflow

1. Inspect the root `AGENTS.md`, current project layout, `design-system/docs/generator-guide.md`, relevant component/block contracts, and token documentation. Read only the files relevant to the requested site.
2. Analyze the reference before implementing. Use `docs/reference-analysis-template.md` as a checklist and create `projects/<slug>/docs/reference-analysis.md`. Record which observations are measured, which are inferred, and which cannot be verified.
3. Create `projects/<slug>/docs/token-map.md`. Map reference colors, typography, spacing, containers, buttons, icons, and reusable sections to existing public tokens/components. Do not invent a new global token merely because an implementation value is inconvenient.
4. Prefer, in order: existing design-system token/component/block; project-level theme override; local component-level variable; justified new shared token only when it is reusable and not site-specific. Do not change shared legacy files just to fit one project.
5. Create the project scaffold and page blueprint. Use the existing `home.html` or `shop.html` as an API/structure example, not as the visual style to copy blindly. Implement shared header/footer and reusable sections, then page-specific composition.
6. Use real, relevant images/assets when available and permitted. Track asset source and intended crop in the project. Do not leave abstract placeholder artwork, arbitrary SVGs, or lorem text in the final result unless the reference itself calls for them or the user approves placeholders.
7. Implement coarse composition first: container, page gutters, section order, hero proportions, grid, text widths, and image crops. Then tune typography, spacing, colors, and decorative details. Reuse existing `.ds-*` contracts and icon registry.
8. Build the project, run the documented Sass/token checks, start it in a local browser, and capture desktop/mobile screenshots. Use the `visual-qa` skill (or `docs/visual-qa-checklist.md`) to compare the rendered result with the reference.
9. Fix the most important visual mismatches, re-render, and recheck. Do not stop after the first implementation. Aim for at least one full correction pass; repeat while significant issues remain and the tools/reference allow it.
10. Produce `docs/page-blueprint.md` and `docs/qa-report.md`. List what was reused, which project overrides were created and why, the commands/tests run, screenshot artifact paths, remaining gaps, and any limits caused by incomplete reference access.

## Boundaries

- Project-specific overrides belong to the project, not to shared source tokens.
- Before introducing a new global token or changing a public mixin/component contract, document the gap and compatibility impact.
- Never claim that a build, browser render, or screenshot comparison succeeded unless it was actually run and inspected.
- If the reference URL cannot be inspected in the available environment, work from supplied screenshots and state the limitation in the report.
- Do not confuse functional completeness with visual fidelity: both are required, and both must be reported separately.

## Completion criteria

A project is complete only when the requested scope exists, it runs, technical checks pass or their failures are documented, desktop/mobile renders have been inspected when browser access is available, major mismatches were corrected, and the final report accurately describes any remaining limitations.
