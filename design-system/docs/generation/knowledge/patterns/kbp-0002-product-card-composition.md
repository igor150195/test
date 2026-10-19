---
id: KBP-0002
title: Product-card composition using neutral commerce contracts
category: component-composition
tags: [commerce, product-card, price, rating, badge, responsive]
status: verified
implementation: design-system/blocks/product-card/index.md
examples:
  - projects/fashion-store/index.html
  - design-system/templates/shop.html
tokens: [--ds-container-max, --ds-grid-gap, --ds-content-gap]
components: [.ds-product-card, .ds-price, .ds-rating, .ds-badge, .ds-flag, .ds-button, .ds-icon-button]
viewports: [1440x900, 390x844]
technical_check: projects/fashion-store/docs/qa-report.md
visual_check: projects/fashion-store/docs/qa-report.md
---

## Назначение

Собрать карточку товара из публичного блока Product Card и нейтральных
компонентов цены, рейтинга, флага и действия без Shop2-разметки.

## Подтверждение

`fashion-store` прошёл документированные сборку и Sass-check; QA зафиксировал
10/10 загруженных изображений, отсутствие console errors и mobile overflow,
а также проверил одноколоночный каталог на 390px. Поэтому решение отмечено
`verified`, но не `approved`: его повторное применение зависит от того, нужна
ли именно товарная карточка и подходят ли её HTML-контракт и viewport.

## Ограничения и условия отказа

Не использовать для editorial-карточек, карьерных вакансий или media-плиток:
похожая прямоугольная форма не делает их товарной карточкой. Не переносить
локальные overrides `fashion-store` в другой проект; сначала проверить
соответствие референса публичному API блока.
