# Design-system gap report: pilot-1

Статус: частичное решение владельца зафиксировано 2026-10-22. Утверждённые
partial-секции реализуются только в границах ниже; отложенные секции не
попадают в HTML/CSS/SCSS/JS пилота.

## GAP-01 — Commerce header zones

- Референс: promo strip, utility links, currency/language, primary nav и
  mobile drawer рядом с logo/search/actions.
- Проверено: `design-system/blocks/header/index.md` (`DSB-header`), Icon
  Button, Counter, Form.
- Пробел: публичный header contract не задаёт utility/primary navigation
  zones и адаптивный drawer.
- Риск: локальный header API нарушит Design System First.
- Решение: `approved-partial` — только `DSB-header` (логотип, поиск, actions).
  Utility- и primary-navigation отложены и не реализуются.

## GAP-02 — Hero carousel и image assets

- Референс: три editorial-слайда с крупными fashion-фотографиями.
- Проверено: Button доступен, carousel/hero отсутствуют в catalog search.
- Пробел: нет carousel contract и нет подтверждённых `own/licensed` аналогов
  content-bearing фотографий.
- Риск: placeholder не позволит заявлять визуальное сходство; локальный slider
  или произвольный hero API запрещены.
- Решение: `approved-partial` — статичный `demo-hero` без carousel и JS,
  только локальный neutral SVG/CSS placeholder с `rights: placeholder`.

## GAP-03 — Promo category cards и lookbook

- Референс: три image-led category cards и отдельная lookbook-композиция.
- Проверено: Product Card не является promo/editorial card; catalog search
  `lookbook` пуст.
- Пробел: нет reusable promo/lookbook contract, нет разрешённых изображений.
- Решение: deferred — promo cards и lookbook не реализуются.

## GAP-04 — Product tabs

- Референс: New Arrival / Best Seller / On Sale tabs.
- Проверено: product-card/price/badge/rating подходят для статичной сетки;
  catalog search `tabs`/`carousel` пуст.
- Пробел: нет tabs behavior/accessible state contract.
- Решение: `approved-partial` — одна статичная New Arrivals grid на основе
  `DSB-product-card`; tabs и их поведение не реализуются.

## GAP-05 — Testimonials и blog cards

- Референс: carousel-like reviews и 4 editorial blog cards.
- Проверено: Rating есть; catalog search `testimonial` и `blog` пуст.
- Пробел: нет reusable testimonial/blog-card contracts; тексты референса —
  демонстрационные, но не являются фактами pilot проекта.
- Решение: deferred — testimonials и blog cards не реализуются.

## GAP-06 — Instagram feed

- Референс: visual social gallery and coupon prompt.
- Проверено: Icon Button есть, но gallery/feed отсутствует.
- Пробел: нет social-feed contract и разрешённых social images.
- Решение: deferred — Instagram/social feed не реализуется.

## Общие ограничения

- Реализация остаётся статическим HTML; cart, account, search popup, wishlist,
  slider, tabs и drawer не должны выглядеть работающими без подтверждённого
  поведения.
- Пользователь разрешил только placeholder assets. Любой placeholder будет
  локальным и должен иметь `rights: "placeholder"`; он не заменяет точную
  реплику изображений референса.
