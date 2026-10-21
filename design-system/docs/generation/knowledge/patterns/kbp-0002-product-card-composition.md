---
id: KBP-0002
title: Product-card composition using neutral commerce contracts
kind: composition
status: candidate
scope: industry
platform: neutral
industry: [fashion]
page_types: [home, catalog]
tags: [commerce, product-card, price, rating, badge, responsive]
requires:
  components: [.ds-product-card, .ds-price, .ds-rating, .ds-badge, .ds-flag, .ds-button, .ds-icon-button]
  tokens: [--ds-container-max, --ds-grid-gap, --ds-content-gap]
  optional_tokens: []
variants: [catalog-grid]
data_needed: [product-image, title, price, rating, action]
viewports_checked: [1440x900, 390x844]
evidence:
  implementation: design-system/blocks/product-card/index.md
  technical_check: projects/fashion-store/docs/qa-report.md
  visual_check: projects/fashion-store/docs/qa-report.md
  projects: [fashion-store]
  limitations: [one project, two viewports, expert score 70 of 100]
review_after: 2027-01-16
supersedes: []
applies_when: [товарная карточка с ценой рейтингом флагом и действием]
not_when: [editorial-карточка, карьерная вакансия, media-плитка]
---

## Назначение

Собрать карточку товара из публичного блока Product Card и нейтральных
компонентов цены, рейтинга, флага и действия без Shop2-разметки.

## Подтверждение

`fashion-store` прошёл документированные сборку и Sass-check; QA зафиксировал
10/10 загруженных изображений, отсутствие console errors и mobile overflow,
а также проверил одноколоночный каталог на 390px. Поэтому решение отмечено
`candidate`: свидетельство относится только к одному проекту, двум viewport и
честной оценке 70/100. Повышение до `verified` требует нового подтверждённого
проекта и проверки по актуальному lifecycle.

## Ограничения и условия отказа

Не использовать для editorial-карточек, карьерных вакансий или media-плиток:
похожая прямоугольная форма не делает их товарной карточкой. Не переносить
локальные overrides `fashion-store` в другой проект; сначала проверить
соответствие референса публичному API блока.
