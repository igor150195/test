# QA report: pilot-1

## Scope and iterations

- Route checked: `/` (`index.html`) only.
- Chromium: `156.0.8078.4`; the QA runner opened the portable `dist` build.
- Visual correction iterations: **2** after browser runs: the original
  accessibility pass and one local composition pass.
- Reference comparison: structural comparison only. The reference was observed
  in a desktop browser, but its images and brand material were not permitted;
  this report does not claim pixel equivalence.

## Capture matrix

Every listed item was generated and reviewed at viewport scale after the final
tablet-grid correction. Segment paths are enumerated below rather than inferred
from the directory layout.

| Viewport | First screen | Full page | Segments | Review |
| --- | --- | --- | ---: | --- |
| 1920×1080 | `artifacts/qa/latest/home/desktop-full-hd/first-screen.png` | `artifacts/qa/latest/home/desktop-full-hd/full-page.png` | `segments/0000-0.png`, `0001-832.png`, `0002-844.png` — reviewed |
| 1440×900 | `artifacts/qa/latest/home/desktop/first-screen.png` | `artifacts/qa/latest/home/desktop/full-page.png` | `segments/0000-0.png`, `0001-693.png`, `0002-1024.png` — reviewed |
| 768×1024 | `artifacts/qa/latest/home/tablet/first-screen.png` | `artifacts/qa/latest/home/tablet/full-page.png` | `segments/0000-0.png`, `0001-788.png`, `0002-1576.png`, `0003-1986.png` — reviewed |
| 390×844 | `artifacts/qa/latest/home/mobile/first-screen.png` | `artifacts/qa/latest/home/mobile/full-page.png` | `segments/0000-0.png`, `0001-650.png`, `0002-1300.png`, `0003-1950.png`, `0004-2600.png`, `0005-3122.png` — reviewed |

## Programmatic result

`artifacts/qa/latest/results.json` reports `technical.status: "pass"` and
`portable: true`.

- Passed: console and network errors, broken images, overflow, external hosts,
  token/class contracts, image alt/dimensions, language, description, skip
  link, input labels and accessible button names.
- Warning: the generated DS bundle references three known legacy undefined
  icon tokens; none is introduced by this project.
- Axe has no violations or incomplete findings after the local correction.
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

The second capture has no Axe violations or horizontal overflow. It shows a
one-column mobile grid, two tablet columns with the final demo card spanning
the row, and a five-card desktop row.

## Local composition pass and preliminary agent review

The second local pass changed only pilot-owned files: `theme.footer_bg` is
`#202020`; Hero media uses a 4:5 aspect ratio instead of inherited 100%
minimum height; the product grid receives a fifth demo card and a tablet
last-row span; the SVG placeholder has one neutral figure with its `DEMO`
label inside; and the static Counter is anchored inside its 32px cart button.

The machine result remains `technical.status: "pass"`; the separate
`expert.status` is `agent-reviewed` with no numerical score.

| Viewport | Reviewed captures | Preliminary result |
| --- | --- | --- |
| 1920×1080 | first screen, full page, 3 segments | Hero is bounded to 832px media height; all five desktop tracks are occupied; dark footer has legible inverse links. |
| 1440×900 | first screen, full page, 3 segments | Cart counter remains within its 32×32 button; Hero copy has greater visual weight than the media panel. |
| 768×1024 | first screen, full page, 4 segments | Hero media is 4:5 and the fifth card spans the final two-column row without a blank neighbour. |
| 390×844 | first screen, full page, 6 segments | Hero media is 358×447.5px instead of 358×1000px; one-column cards and stacked footer remain without overflow. |

Remaining visible limits are intentional: all editorial/product imagery is a
neutral placeholder, no reference-specific font is licensed, and deferred
sections remain absent by approved scope.

## Theme and custom layer

Theme values chosen from the reference's neutral editorial character are
`primary #202020`, `accent #C62828`, `bg_main #FFFFFF`, `footer_bg #202020` and
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
