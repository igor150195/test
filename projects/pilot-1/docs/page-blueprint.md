# Page blueprint: pilot-1

## Approved page scope

One static English home page. Its approved composition is intentionally partial:

1. `header.pilot-site-header` — DSB-header logo, search and user actions only.
2. `main > section.pilot-hero` — a static demo hero with a local placeholder;
   it is not a carousel.
3. `main > section.pilot-new-arrivals` — a single static product grid; it has
   no tabs, filtering, product detail pages or cart behaviour.
4. `footer.pilot-site-footer` — DSB-footer navigation and a non-submitting demo
   newsletter form.

The reference's utility/primary navigation, promo cards, lookbook, reviews,
blog and social feed are deferred in `design-system-gap-report.md` and do not
appear in this DOM.

## Content and behaviour

- All copy is English demo content; no names, prices, delivery conditions or
  other commercial claims are presented as real.
- Every image uses `images/demo-fashion.svg`, a local neutral placeholder with
  `rights: placeholder` in `assets.json`.
- Controls that have no supported static-site behaviour use `data-demo="true"`
  and nearby visible copy explains their demo/non-submitting nature.
- Layout uses the neutral Header, Product Card, Footer, Form, Button, Icon,
  Icon Button, Counter, Price, Rating and Flag contracts documented in the
  matching `ds-section` records.
