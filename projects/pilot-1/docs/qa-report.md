# QA report: pilot-1

## Scope and iterations

- Route checked: `/` (`index.html`) only.
- Chromium: `156.0.8078.4`; the QA runner opened the portable `dist` build.
- Visual correction iterations: **1** after the initial browser run.
- Reference comparison: structural comparison only. The reference was observed
  in a desktop browser, but its images and brand material were not permitted;
  this report does not claim pixel equivalence.

## Capture matrix

Every listed item was generated and reviewed. The sequential capture lists are
stored beside each first-screen/full-page pair.

| Viewport | First screen | Full page | Segments | Review |
| --- | --- | --- | ---: | --- |
| 1920×1080 | `artifacts/qa/latest/home/desktop-full-hd/first-screen.png` | `artifacts/qa/latest/home/desktop-full-hd/full-page.png` | 3 | reviewed |
| 1440×900 | `artifacts/qa/latest/home/desktop/first-screen.png` | `artifacts/qa/latest/home/desktop/full-page.png` | 3 | reviewed |
| 768×1024 | `artifacts/qa/latest/home/tablet/first-screen.png` | `artifacts/qa/latest/home/tablet/full-page.png` | 4 | reviewed |
| 390×844 | `artifacts/qa/latest/home/mobile/first-screen.png` | `artifacts/qa/latest/home/mobile/full-page.png` | 6 | reviewed |

## Programmatic result

`artifacts/qa/latest/results.json` reports `technical.status: "pass"` and
`portable: true`.

- Passed: console and network errors, broken images, overflow, external hosts,
  token/class contracts, image alt/dimensions, language, description, skip
  link, input labels and accessible button names.
- Warning: the generated DS bundle references three known legacy undefined
  icon tokens; none is introduced by this project.
- Axe has no violations after the correction. It reports four `incomplete`
  contrast checks for the one-character `.ds-counter`, where text content is
  too short for the tool to decide; this is not counted as a pass.
- `check:site` reports the existing known DS `empty_color.svg` 404. It is a
  shared known-resource debt, not a pilot resource or a masked failure.

## Correction pass

The first run found a permanently visible skip link, a white newsletter title
on a light surface, a low-contrast old demo price and ARIA labels on neutral
`div` flag containers. The pass:

1. hides the skip link until keyboard focus;
2. applies the existing `--on_bg_main` foreground token to the light
   newsletter surface;
3. removes the unnecessary old/sale demo price instead of overriding the
   shared Price contract; and
4. removes unsupported `aria-label` attributes from the flag containers and
   declares the eager hero image loading.

The second capture has no Axe violations, no horizontal overflow and shows a
one-column mobile grid, a two-column tablet grid and a four-card desktop row.

## Theme and custom layer

Theme values chosen from the reference's neutral editorial character are
`primary #202020`, `accent #C62828`, `bg_main #FFFFFF` and
`bg_main_surface #F7F7F7`. The generated theme emitted no contrast warnings:
`on_primary #FFFFFF`/`primary` is approximately 16.3:1 and
`on_accent #FFFFFF`/`accent` is approximately 5.6:1.

`styles/custom.scss` exists as the owner layer, contains only the generated
starter comment and was not changed or moved. Project composition is in
`styles/project.scss` / generated `css/project.css`.

## Remaining limits

- The hero and product images are intentionally neutral placeholders, so the
  result is not a visual replica of the reference's editorial photography.
- Deferred utility navigation, carousel, tabs, promo cards, lookbook, reviews,
  blog and social feed remain documented in `design-system-gap-report.md`.
- Demo actions and newsletter submission are visibly marked non-functional.
