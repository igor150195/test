# Pilot 1 — diagnostic and expert-view report

## Scope and evidence

This is a diagnostic of the implemented `pilot-1` project, not a claim of
reference-level fidelity. It uses the portable QA capture set in
`projects/pilot-1/artifacts/qa/latest/`, the rendered `dist` page, and the
source contracts that produced it. Chromium `156.0.8078.4` was used to read
the computed values quoted below at 1440×900; dimensions were also checked at
1920×1080, 768×1024 and 390×844.

The original site supplied the visual direction, but its images, brand and
text were not permitted for this pilot. The reference is therefore not used as
a pixel-comparison target.

## Root-cause register

| # | Observed defect | Classification | Root cause and exact evidence | Local-only repair estimate |
| --- | --- | --- | --- | --- |
| 1 | Cart count is dark on red and sits outside the cart button | **DS defect** (colour), **contract gap** (badge anchoring) | `design-system/tokens/new_sizes.css:181-184` maps `--counter_color` to `--on_bg_main_accent`, instead of an on-accent token. `design-system/components/counter/_counter.scss:4-17` consumes it. In this project it computes to `color: rgb(95,95,95)` (`#5F5F5F`) on `background: rgb(198,40,40)` (`#C62828`), contrast **1.14:1**. `.ds-counter` is `position: static`, 20×20px, while the containing `.ds-icon-button` is only 32×32px; Header documents a counter “beside” a button but supplies no attached-badge layout contract. The result is at x=1384 inside a button spanning x=1368–1400, so its right edge extends 4px past the button. | Colour can be locally overridden in ~1 selector, but that forks a public component. Anchoring needs ~4–6 declarations on a project wrapper/button; a reusable solution needs a DS counter-in-icon-button contract. |
| 2 | Footer reads as a flat #5F5F5F field; links are muted and newsletter looks like a pale/white inset panel | **DS defect** plus **theme-contract gap** | `design-system/blocks/footer/_footer.scss:3-6` uses `--on_bg_main_accent` as a background; the theme defines that text-accent token as `#5F5F5F` in `projects/pilot-1/css/theme.css`. The footer itself computes to white text on `rgb(95,95,95)`. Links/copyright use `--on_primary_8` (`rgba(255,255,255,.8)`) in lines 36-38 and 57-60, compositing to approximately `#DFDFDF`, **4.79:1** against the footer. The newsletter is deliberately local: `projects/pilot-1/styles/project.scss:108-117` sets `background: --bg_main_surface` (`#F7F7F7`) and only its title to `--on_bg_main` (`#202020`). Its surrounding inherited footer foreground remains white unless an element overrides it; white on `#F7F7F7` is only **1.07:1**. | A local footer palette override plus explicit newsletter descendant foregrounds is ~6–10 declarations, but semantic inverse/footer surface tokens would be the reusable fix. |
| 3 | Hero is mechanically 50/50 and has an excessively tall image, most severe on mobile | **Local CSS error** | `projects/pilot-1/styles/project.scss:46-52` fixes two equal grid columns. Lines 75-83 give both media and image `min-height: 100%`; on mobile only the column count changes (lines 129-132), not that height rule. Computed image/media sizes: **668×1000** at 1920 and 1440, **348×1000** at 768, and **358×1000** at 390. Thus the mobile image is 2.79× its natural 4:5 height (358×447.5) and expands the Hero to 1305px. | ~4–8 declarations: reset the inherited min-height at the mobile breakpoint and use an explicit approved image aspect ratio/crop. A reference-faithful editorial hero still requires approved imagery and a Hero contract. |
| 4 | New Arrivals shows four cards in a five-track row, leaving an empty final column | **Scenario/content mismatch** exposed by a DS grid policy | `design-system/blocks/product-card/_product-card.scss:95-100` uses `repeat(auto-fill, minmax(min(100%, 240px), 1fr))`. The 1440/1920 rendered grid is 1360px with five computed tracks of 252.8px but only four `<article class="ds-product-card">` items in `projects/pilot-1/index.html:63-105`. `auto-fill` correctly preserves the unused fifth track; no project rule changes the grid. | Add a fifth approved placeholder card (markup only) or locally opt into `auto-fit` in 1 declaration. The latter changes the established DS grid behaviour and is not appropriate without a documented variant. |
| 5 | Placeholder image contains nested grey rectangles and the “DEMO IMAGE” caption appears below the geometric figure | **Scenario limitation (placeholder)** | The sole permitted asset is `projects/pilot-1/images/demo-fashion.svg`. Its outer `#e8e8e8` rect, inner `#d1d1d1` rect, circle/path, and `<text y="950">` deliberately form those layers. Product-card media adds its own `--bg_main_surface` background and `object-fit: contain` in `design-system/blocks/product-card/_product-card.scss:19-38`, so the asset’s entire 4:5 canvas and bottom label remain visible. | Re-draw this local placeholder in ~5 SVG edits or replace it with an approved own/licensed image. Neither establishes visual equivalence with the reference photography. |
| 6 | Typography is generic system UI rather than editorial brand typography | **Theme-contract gap** and **scenario limitation** | `design-system/tokens/fonts.css:1-4` provides only `--font1` = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` and `--font2` = `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. `new_sizes.css:39-40` aliases them to `--font_content` and `--font_accent`. The project theme schema has no font fields and this pilot has no licensed font asset. Computed `font-family` on Hero, footer and cards is the system stack. | With a licensed local font, ~8–12 local CSS lines plus one or two `@font-face` declarations and asset manifest records. Without permitted font files, a local substitute would be misleading rather than a correction. |

### Computed style detail

The following facts were read from the rendered portable site at 1440×900:

| Subject | Computed values |
| --- | --- |
| `.ds-counter` | colour `rgb(95, 95, 95)`; background `rgb(198, 40, 40)`; static position; 20×20px; no border or shadow |
| Cart `.ds-icon-button` | 32×32px; x=1368; the counter begins at x=1384, hence reaches x=1404 |
| `.ds-footer` | foreground `rgb(255,255,255)`; background `rgb(95,95,95)` |
| `.ds-footer__link` | colour `rgba(255,255,255,.8)`; transparent background |
| `.pilot-newsletter` | background `rgb(247,247,247)`; title override `rgb(32,32,32)`; input uses the same `#F7F7F7` surface |
| `.pilot-hero` | 1440×1080; equal `668px 668px` grid columns; copy and image both 668×1000px |
| `.ds-product-card__grid` | five `252.8px` tracks in 1360px; four rendered cards |

## Expert screenshot review

The matrix exists and was reviewed in full: first screen, full page and all
segments for each listed viewport. The expert field remains `not-reviewed` in
machine-readable QA; no numerical expert score is assigned here.

| Viewport | Screenshot evidence | Observed composition |
| --- | --- | --- |
| 1920×1080 | `projects/pilot-1/artifacts/qa/latest/home/desktop-full-hd/{first-screen,full-page}.png` and 3 segments | The maximum-width 1440px canvas leaves broad side margins, appropriate to the neutral layout. The Hero remains 1000px tall inside its padded section, dominating the page; five grid tracks are visible but only four are populated. Footer and pale newsletter panel consume a visually disconnected final band. |
| 1440×900 | `projects/pilot-1/artifacts/qa/latest/home/desktop/{first-screen,full-page}.png` and 3 segments | Header is extremely compressed relative to the Hero. The cart badge protrusion is visible. Hero is a strict 50/50 split rather than an editorial crop. The absent fifth card is conspicuous at the right edge; product imagery looks repetitive because every card uses the identical SVG. |
| 768×1024 | `projects/pilot-1/artifacts/qa/latest/home/tablet/{first-screen,full-page}.png` and 4 segments | The grid correctly moves to two columns, but the two equal Hero panels remain 1000px high. The title wraps to three lines and the right placeholder becomes a tall geometric slab. Footer columns and newsletter remain legible but hierarchy is weakened by the light panel. |
| 390×844 | `projects/pilot-1/artifacts/qa/latest/home/mobile/{first-screen,full-page}.png` and 6 segments | Header reflows search below actions without horizontal overflow. Grid correctly becomes one column. However, Hero image is 358×1000px after a 257px text block, making the first content region much too tall; repeated placeholder figures fill most of the scrolling experience. Footer controls stack safely, but the cart counter still overhangs its small button. |

### Five highest-impact visual defects

1. **Mobile Hero height** — local `min-height: 100%` carries a 1000px image
   into a 390px layout.
2. **Image fidelity and repetition** — a deliberately generic placeholder
   replaces all editorial and product imagery; this is an accepted asset
   limitation, not a browser failure.
3. **Incomplete product row** — four items feed a five-track `auto-fill` grid.
4. **Counter contrast/placement** — shared Counter tokens produce 1.14:1
   contrast and Header offers no attachment contract.
5. **Footer surface hierarchy** — a text-accent token is repurposed as the
   Footer background, while the newsletter becomes an unrelated pale panel.

## What worked without manual patches

- Portable static delivery, subdirectory-safe asset rewriting, local SVG
  inclusion, generated theme and project CSS all worked.
- `DSB-header`, `DSB-product-card`, `DSB-footer`, Button, Form, Price,
  Rating, Flag, Icon and Counter produced a valid static composition.
- The responsive header, one-column mobile product grid, no-overflow matrix,
  alt text, labels, document language and button names passed the technical
  QA checks.

## Where the pipeline stopped the implementation

The approved gap report correctly stopped unapproved work: utility/main
navigation and drawer; Hero carousel; tabs; promo/lookbook; reviews/blog; and
social feed. These remain deferred in
`projects/pilot-1/docs/design-system-gap-report.md`, rather than being
simulated with project JavaScript.

## Local decisions and why they were permitted

- `.pilot-hero`, `.pilot-new-arrivals`, `.pilot-newsletter` and the skip link
  in `styles/project.scss` compose approved DS contracts and public layout
  tokens. The static Hero is explicitly `approved-partial`.
- `images/demo-fashion.svg` is a recorded local `placeholder`; it contains no
  reference material and is intentionally marked as demo.
- `styles/custom.scss` remains owner-owned and unchanged. Primary project
  composition lives in generated `styles/project.scss`/`css/project.css`.

## Missing capabilities, ordered by recurrence in this pilot

1. **Image-led editorial contracts and licensed assets** — Hero, promo,
   lookbook, blog and social sections were all blocked by this pair.
2. **Behaviour contracts** — carousel, tabs, drawer, cart/search interactions.
3. **Theme semantic surfaces** — inverse/footer surface, muted inverse text,
   counter-on-accent foreground, and an attached action badge.
4. **Editorial typography contract** — project theme cannot describe a
   licensed brand font without escaping the current schema.
5. **Grid occupancy option** — Product Card documents no `auto-fit` variant
   for intentionally incomplete last rows.

## Unclear or conflicting skill rules

- `site-from-reference`, step 5 says: “**Do not use … decorative substitutes
  or placeholders to make the gap appear solved**.” The approved pilot scope
  allowed a static neutral placeholder Hero. The gap report records it as
  `approved-partial`, but the skill should explicitly distinguish an approved
  content placeholder from an unapproved substitute that claims to solve a
  visual gap.
- Step 8 says “**Use real, relevant images/assets when available and
  permitted**”; here no relevant permitted asset was available. This is
  correctly disclosed but gives no measurable quality floor for a
  placeholder-only reference-led pilot.

## False or non-actionable signals

- QA reports four Axe `color-contrast` **incomplete** results for the
  one-character `.ds-counter`; Axe cannot determine whether the character is
  text. The rendered contrast calculation nevertheless exposes a real 1.14:1
  issue, so treating these as a pass would be wrong.
- `undefined-icons` warns for three documented legacy DS icon-token debts;
  the pilot does not invoke their variants.
- `check:site` warns about the known shared `empty_color.svg` 404; this is not
  requested by, nor bundled as a pilot resource.
- `check:assets` emits an existing known-debt warning for `pilot-1` metadata;
  the only declared asset has `rights: "placeholder"` and a local path, so it
  is not evidence of an external-resource violation.

## Iterations and approximate effort

- **One** correction iteration followed the initial browser QA.
- First pass fixed skip-link visibility, newsletter-title foreground, an old
  demo price, unsupported ARIA on flag containers and Hero image loading.
- Approximate, non-measured effort: reference/map and approval context 40%;
  scaffold/theme/assets 20%; implementation 20%; QA and correction 20%.
  These are retrospective estimates, not telemetry.

## Recommended next actions (not implemented)

1. Decide whether Counter foreground and an attached badge variant are a
   shared DS change; do not patch only this project by default.
2. Define footer/inverse surface tokens in the theme contract before using the
   neutral Footer for brand-sensitive sites.
3. Correct the local Hero sizing and resolve grid occupancy through either a
   fifth approved card or a documented grid variant.
4. Obtain allowed images and a font licence before attempting a visual-quality
   claim against the reference.
