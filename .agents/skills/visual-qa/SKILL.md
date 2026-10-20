---
name: visual-qa
description: Render a website in a browser, audit responsive layout and visual mismatches, and make targeted corrections. Use after implementing or restyling a page when a local render can be opened.
---

# Visual QA

## Purpose

Verify the rendered page rather than judging source code alone. This skill checks technical failures and visual fidelity separately.

## Workflow

1. Run `npm run check:project -- <slug>`, `npm run check:assets -- <slug>`,
   `npm run site:build -- <slug>`, `npm run qa -- <slug>` and
   `npm run check:compliance -- <slug>`. QA must inspect portable
   `projects/<slug>/dist/`; a prerequisite failure is not permission to inspect
   sources instead. Record exact commands and results. If the repository
   provides `npm run visual:qa`, run it separately for its baseline regression
   comparison; it currently covers only `fashion-store` and does not replace
   the universal QA runner.
2. Open the local site using the available browser automation. Prefer reproducible Playwright/Chromium captures if configured in the repository.
3. Capture at least desktop (default 1440×900) and mobile (default 390×844), plus a full-page capture or matched scroll regions for long pages. Before calling paths “artifacts”, verify the browser tool can persist the captures. If it cannot, record that captures were viewed live and do not invent file paths.
4. Check for console errors, failed resource requests, broken images/fonts/icons, missing CSS tokens, and horizontal overflow at target widths. At mobile widths, also check clipped horizontal strips, wrapped navigation labels, visible focus/controls, and actions that point to hidden or unavailable targets.
5. Audit compliance with [Design System First](../../../design-system/docs/generation/design-system-first.md) before visual corrections. Compare final HTML/CSS with `token-map.md`, relevant knowledge-base entries and `design-system-gap-report.md` when present. Flag: unknown or undocumented tokens; arbitrary colors, dimensions, radii, shadows or type values used instead of an available contract; copied/duplicated components; unapproved global variables; large stacks of local overrides that emulate an absent API; and simplified substitutes for a reference element. A successful build does not pass this audit. If a substantial violation implies `EXTEND` or `BLOCKED`, stop implementation fixes and require the gap report/approval flow.
6. If reference captures exist, compare the same viewport and same page region. Measure and record the most important bounds: header levels, hero image/crop, hero text anchor, title line count, columns and major section starts. Compare only regions actually visible in the reference; label the rest as an interpretation. Otherwise use the site brief and internal consistency checklist; do not claim exact reference matching without a comparable reference.
7. First report the programmatic checks from `results.json`. Only then fill the
   separate expert review and score with
   `../../../design-system/docs/generation/visual-qa-checklist.md`. Rank issues
   by impact, not by ease of fixing.
8. Fix the top 3–5 issues only when they are covered by approved `REUSE`/`COMPOSE` contracts. Prioritize composition, section proportions, image crop, text widths, grid and spacing before small decorations.
9. Rebuild and capture new screenshots. Confirm that fixes improved the result and did not introduce regressions at mobile widths. Include 768 and 1024px when the page has responsive navigation, grids or filters, unless a different target matrix is documented.
10. Repeat while major issues remain, but stop and report a blocker when missing assets, inaccessible reference content, unavailable browser tooling or an unapproved system gap prevents honest verification.
11. Verify the project style order: generated project CSS precedes the owner-maintained compiled `custom.scss` output; the custom output exists after the documented build; and `styles/custom.scss` was neither rewritten nor moved. Report a potential selector conflict rather than automatically relocating the owner’s declarations.
12. Write `docs/qa-report.md` with technical statuses and expert review/score,
   failed/pass checks, design-system compliance findings, knowledge entries
   checked, before/after screenshot paths or explicit persistence limitations,
   fixes applied, commands, comparable reference regions, custom-style findings
   and unresolved risks.

## Required full-page capture matrix

When the request calls for full-site verification, discover every internal route from the router, configuration, sitemap and internal links. Do not treat same-page anchors as separate routes, and do not open external links or perform irreversible actions.

For every discovered internal route, create and review captures at all of these viewport sizes:

| Target | Viewport |
| --- | --- |
| Full HD desktop | 1920×1080 |
| Desktop | 1440×900 |
| Tablet | 768×1024 |
| Mobile | 390×844 |

For each route and viewport, persist all three artifact types:

1. **First screen:** the initial viewport at the target dimensions.
2. **Full-page:** a vertical capture from the page top through the footer. The viewport height sets the browser viewport only; it does not limit the full-page image height.
3. **Sequential segments:** viewport-sized screenshots from top to bottom with approximately 20–25% overlap between neighboring images. Capture every section; do not substitute only a first, middle and last screen.

Before capture, scroll from top to bottom to activate lazy loading, wait for available fonts, images and dynamic content, and record resources that fail to load. Review both the full-page image for overall composition and every segment at viewport scale for detail. Check the header, hero, all intermediate content, CTA/forms, footer, responsive reflow, crops, typography, overflow, fixed overlays, empty or duplicated sections and missing content. Treat the mobile lower page with the same coverage as the first mobile screen.

The report must give a row for every route and viewport showing whether the first screen, full-page image and complete segment sequence were generated and reviewed. List the artifact paths and explicitly mark every unavailable or unperformed check. Do not claim complete visual coverage unless all page sections through the footer were checked at every required viewport.

## Acceptance

- No hard technical failure remains: unsuccessful build, an external production
  resource, or a pending `EXTEND`/`BLOCKED` implemented locally when it has a
  filled `html_selector`. Preservation of `styles/custom.scss` is checked
  manually; it must not have been lost, moved or rewritten.
- No critical blocker from `../../../design-system/docs/generation/visual-qa-checklist.md` remains.
- No unresolved substantial violation of Design System First remains; approved exceptions are linked to their gap report and decision.
- The expert score alone is at least 85/100; any shortfall must have a reason
  and prioritized next steps.
- When Chromium is available, the complete capture matrix was generated and
  reviewed; an incomplete or unreviewed matrix is a hard failure.
- Visual QA claims are factual. If browser tooling is unavailable, explicitly mark browser validation as not performed rather than simulating or guessing a result.
