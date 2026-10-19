---
name: site-from-reference
description: Create a new website project from a supplied website URL or screenshot using the existing design system. Use when the task is to recreate or adapt a visual reference into a new project.
---

# Site from Reference

## Goal

Create a new, isolated project from a reference only after the existing design-system API has been shown to cover every substantial need. A project must not compensate for a missing system capability with invented visual values, components or local APIs.

## Use this skill when

- The user supplies a website URL, screenshot, or set of screenshots and asks to create a new site from it.
- The work starts a new page/project based on a visual reference.

Do not use it for a small change to an existing page or for a design-system-only refactor; use the relevant project workflow instead.

## Workflow

1. Inspect the root `AGENTS.md`, current project layout, `../../../design-system/docs/generator-guide.md`, [Design System First](../../../design-system/docs/generation/design-system-first.md), [generator knowledge base](../../../design-system/docs/generation/knowledge/README.md), relevant component/block contracts, token documentation, icon registry and confirmed-neutral mixins. Read implementations and contracts, not names alone.
2. Analyze the reference before implementing. Use `../../../design-system/docs/generation/reference-analysis-template.md` as a checklist and create `projects/<slug>/docs/reference-analysis.md`. Record which observations are measured, which are inferred, and which cannot be verified. Map header zones separately (utility, primary navigation, contextual navigation, search and actions); do not move a navigation level merely because the same links exist elsewhere.
3. Search `../../../design-system/docs/generation/knowledge/registry.yml` by category and tags. Open every candidate match, inspect its real implementation, examples, viewport coverage and limitations. A matching name or tag never proves applicability.
4. Create `projects/<slug>/docs/token-map.md`. For every substantial color, typography role, spacing/layout need, container, component, icon, image treatment, interaction and adaptive composition, map an existing public API and assign `REUSE`, `COMPOSE`, `EXTEND` or `BLOCKED` exactly as defined in [Design System First](../../../design-system/docs/generation/design-system-first.md). Record both the checked system files/contracts and relevant knowledge IDs with the result of applicability review. Prefer applicable `verified` and `approved` entries; a `candidate` is evidence for investigation, not code to copy.
5. If a substantial need is `EXTEND` or `BLOCKED`, stop before creating project HTML, CSS, SCSS or JavaScript for the affected section. Create `projects/<slug>/docs/design-system-gap-report.md` using the documented format and request explicit approval. Do not use local overrides, arbitrary values, copied components, decorative substitutes or placeholders to make the gap appear solved. Continue only with explicit approval for an intentionally partial `REUSE`/`COMPOSE` scope.
6. Only when the map contains no unapproved gaps, create the empty `projects/<slug>` directory and initialise its style contract with `node scripts/project-styles.mjs init <slug>`. Preserve an existing `styles/custom.scss` byte-for-byte on repeat runs. `build` writes only its own marked output, or an empty/comment-only placeholder; it refuses any other existing CSS unless an explicitly approved `--force` is supplied. For a legacy project whose `css/custom.css` is already generated project CSS, use an explicitly named output such as `css/custom-overrides.css`, link it last, and do not migrate the existing file without approval.
7. Create the project scaffold and page blueprint. Use the existing `home.html` or `shop.html` as an API/structure example, not as the visual style to copy blindly. For every planned section, mark it as observed, inferred, or project-specific. Do not present unobservable portions of a reference as an exact reconstruction. Implement shared header/footer and reusable sections, then page-specific composition.
8. Use real, relevant images/assets when available and permitted. Track asset source, intended ratio, crop/focal point, visual role and fallback in the project. Do not replace a content-bearing reference image, illustration or component with abstract artwork, arbitrary SVGs or lorem text unless the user expressly accepts that limited scope.
9. Implement coarse composition first: container, page gutters, section order, hero proportions, grid, text widths, and image crops. For a comparable hero, record the text anchor, image crop, number of title lines and visible controls before tuning CSS. Then tune typography, spacing, colors, and decorative details only through the approved `REUSE`/`COMPOSE` contracts. Reuse existing `.ds-*` contracts and icon registry.
10. Build the project, run the documented Sass/token checks, start it in a local browser, and capture desktop/mobile screenshots. Use the `visual-qa` skill (or `../../../design-system/docs/generation/visual-qa-checklist.md`) to compare the rendered result with the reference. At minimum inspect 390, 768, 1024 and 1440px unless the scope defines different target viewports; document what is shown, hidden, scrollable, reordered or opened by an action at each breakpoint.
11. Fix the most important visual mismatches, re-render, and recheck. Do not stop after the first implementation. Aim for at least one full correction pass; repeat while significant issues remain and the tools/reference allow it.
12. Produce `docs/page-blueprint.md` and `docs/qa-report.md`. Before delivery, compare these documents and `token-map.md` with the final DOM: section order, number of repeated items, forms, CTAs, public classes and icon tokens must agree. List what was reused, which project overrides were created and why, the commands/tests run, screenshot artifact paths (or the inability to persist them), remaining gaps, and any limits caused by incomplete reference access.
13. After confirmed visual QA, extract only minimal repeatable findings into a new knowledge entry with `candidate` status. Include implementation/example links, tokens/components, viewport and QA evidence. Do not promote it to `verified` without reproducible checks or to `approved` without user approval; do not save a whole project stylesheet as a pattern.

## Boundaries

- Project-local layout rules may compose existing contracts and tokens; they cannot introduce a parallel token scale, self-made component API, or arbitrary visual values in place of an absent design-system capability.
- Project-specific overrides belong to the project, not to shared source tokens. They are not an exception to the gap-report requirement.
- `styles/custom.scss` is reserved for owner-maintained changes and is loaded after generated project styles. Never put primary generated implementation there, overwrite it, clear its comments, move its declarations or copy it into the design system automatically. If generated styles conflict with it, report the conflict and preserve the file.
- Before introducing a new global token or changing a public mixin/component contract, document the gap and compatibility impact, obtain approval, then extend and validate the design system before using it.
- Never claim that a build, browser render, or screenshot comparison succeeded unless it was actually run and inspected.
- If the reference URL cannot be inspected in the available environment, work from supplied screenshots and state the limitation in the report.
- Do not confuse functional completeness with visual fidelity: both are required, and both must be reported separately.
- When an approved `REUSE`/`COMPOSE` map needs a supported project theme, place its selector after `tokens.css`. The current neutral blocks use both the legacy `--site_width` and the neutral alias `--ds-container-max`; because the latter aliases the former by default, use the documented `--site_width` contract for a common page width and do not set both unless deliberately separating their values.

## Completion criteria

A project is complete only when its preflight map has no unapproved `EXTEND`/`BLOCKED` entries, the requested scope exists, it runs, technical checks pass or their failures are documented, desktop/mobile renders have been inspected when browser access is available, major mismatches were corrected, the project documents agree with the delivered DOM, and the final report accurately describes any remaining limitations.
