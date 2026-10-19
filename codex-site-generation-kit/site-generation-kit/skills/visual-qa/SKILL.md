---
name: visual-qa
description: Render a website in a browser, audit responsive layout and visual mismatches, and make targeted corrections. Use after implementing or restyling a page when a local render can be opened.
---

# Visual QA

## Purpose

Verify the rendered page rather than judging source code alone. This skill checks technical failures and visual fidelity separately.

## Workflow

1. Determine how the project is started and build it. Record exact commands and results.
2. Open the local site using the available browser automation. Prefer reproducible Playwright/Chromium captures if configured in the repository.
3. Capture at least desktop (default 1440×900) and mobile (default 390×844), plus a full-page capture or matched scroll regions for long pages.
4. Check for console errors, failed resource requests, broken images/fonts/icons, missing CSS tokens, and horizontal overflow at target widths.
5. If reference captures exist, compare the same viewport and same page region. Otherwise use the site brief and internal consistency checklist; do not claim exact reference matching without a comparable reference.
6. Score the current render with `docs/visual-qa-checklist.md`. Rank issues by impact, not by ease of fixing.
7. Fix the top 3–5 issues. Prioritize composition, section proportions, image crop, text widths, grid and spacing before small decorations.
8. Rebuild and capture new screenshots. Confirm that fixes improved the result and did not introduce regressions at mobile widths.
9. Repeat while major issues remain, but stop and report a blocker when missing assets, inaccessible reference content, or unavailable browser tooling prevents honest verification.
10. Write `docs/qa-report.md` with score, failed/pass checks, before/after screenshot paths, fixes applied, commands, and unresolved risks.

## Acceptance

- No critical blocker from `docs/visual-qa-checklist.md` remains.
- A provisional target score is at least 85/100; any shortfall must have a reason and prioritized next steps.
- Desktop and mobile captures were actually generated and reviewed when tooling is available.
- Visual QA claims are factual. If browser tooling is unavailable, explicitly mark browser validation as not performed rather than simulating or guessing a result.
