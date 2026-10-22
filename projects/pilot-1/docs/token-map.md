# Карта соответствия Design System First: pilot-1

Это предреализационная карта. Селекторы ниже — планируемые anchors будущего
DOM, а не созданные классы. `local_files` пусты, поскольку фаза 1 не создаёт
HTML/CSS/SCSS. Каждый `EXTEND`/`BLOCKED` имеет `decision: "pending"` и
останавливает затронутую реализацию.

## Header и utility navigation

```ds-section
{
    "id": "site-header",
    "status": "EXTEND",
    "html_selector": ".pilot-site-header",
    "local_selectors": [".pilot-site-header", ".pilot-skip-link"],
    "local_files": ["css/project.css"],
    "ds_sources": [
        "design-system/blocks/header/index.md",
        "design-system/components/icon-button/index.md",
        "design-system/components/counter/index.md",
        "design-system/components/form/index.md"
    ],
    "knowledge_ids": [],
    "decision": "approved-partial"
}
```

`DSB-header` покрывает логотип, поиск и actions, но не документирует promo
strip, primary navigation layout или responsive mobile drawer.

## Hero carousel

```ds-section
{
    "id": "hero-carousel",
    "status": "BLOCKED",
    "html_selector": ".pilot-hero",
    "local_selectors": [".pilot-hero"],
    "local_files": ["css/project.css"],
    "ds_sources": ["design-system/components/button/index.md"],
    "knowledge_ids": [],
    "decision": "approved-partial"
}
```

Нет нейтрального carousel/hero контракта и разрешённых image assets. Кнопка CTA
переиспользуема, но не решает carousel, композицию и content-bearing imagery.

## Promo categories

```ds-section
{
    "id": "promo-categories",
    "status": "EXTEND",
    "html_selector": ".pilot-promo-categories",
    "local_selectors": [".pilot-promo-categories"],
    "local_files": [],
    "ds_sources": ["design-system/components/button/index.md"],
    "knowledge_ids": [],
    "decision": "approved-partial"
}
```

Каталог не содержит image-led promotional category card; поиски по `carousel`,
`lookbook`, `blog` и смежным назначениям результатов не дали.

## New Arrivals: product tabs

```ds-section
{
    "id": "new-arrivals-tabs",
    "status": "EXTEND",
    "html_selector": ".pilot-new-arrivals-tabs",
    "local_selectors": [".pilot-new-arrivals-tabs"],
    "local_files": ["css/project.css"],
    "ds_sources": [],
    "knowledge_ids": [],
    "decision": "pending"
}
```

В каталоге отсутствует tabs contract. Поведение табов нельзя имитировать
локальным JS или декоративными ссылками.

## New Arrivals: product grid

```ds-section
{
    "id": "new-arrivals-grid",
    "status": "COMPOSE",
    "html_selector": ".pilot-new-arrivals",
    "local_selectors": [".pilot-new-arrivals", ".pilot-new-arrivals-grid"],
    "local_files": ["css/project.css"],
    "ds_sources": [
        "design-system/blocks/product-card/index.md",
        "design-system/components/price/index.md",
        "design-system/components/badge/index.md",
        "design-system/components/rating/index.md",
        "design-system/components/button/index.md"
    ],
    "knowledge_ids": ["KBP-0002"]
}
```

`DSB-product-card` покрывает статичную сетку, price, flags, rating и CTA.
`KBP-0002` — candidate: рассмотрен как исследовательский материал, а не код
для копирования; его QA-ограничения не делают его готовым паттерном.

## Shop this look

```ds-section
{
    "id": "shop-this-look",
    "status": "BLOCKED",
    "html_selector": ".pilot-lookbook",
    "local_selectors": [".pilot-lookbook"],
    "local_files": [],
    "ds_sources": ["design-system/blocks/product-card/index.md"],
    "knowledge_ids": [],
    "decision": "pending"
}
```

Товарные карточки доступны, но image-led lookbook композиция и исходные
изображения не покрыты публичным контрактом.

## Customer reviews

```ds-section
{
    "id": "customer-reviews",
    "status": "EXTEND",
    "html_selector": ".pilot-reviews",
    "local_selectors": [".pilot-reviews"],
    "local_files": [],
    "ds_sources": ["design-system/components/rating/index.md"],
    "knowledge_ids": [],
    "decision": "pending"
}
```

Нет testimonial/card/carousel контракта. Рейтинг применим только как часть
будущего утверждённого решения.

## Blog cards

```ds-section
{
    "id": "blog-preview",
    "status": "EXTEND",
    "html_selector": ".pilot-blog-preview",
    "local_selectors": [".pilot-blog-preview"],
    "local_files": [],
    "ds_sources": ["design-system/components/button/index.md"],
    "knowledge_ids": [],
    "decision": "pending"
}
```

В каталоге нет editorial/blog card. `DSC-button` применим лишь к ссылке CTA.

## Instagram / social feed

```ds-section
{
    "id": "instagram-feed",
    "status": "BLOCKED",
    "html_selector": ".pilot-instagram-feed",
    "local_selectors": [".pilot-instagram-feed"],
    "local_files": [],
    "ds_sources": ["design-system/components/icon-button/index.md"],
    "knowledge_ids": [],
    "decision": "pending"
}
```

Не подтверждены разрешённые social images и нет feed/gallery contract.

## Footer / newsletter

```ds-section
{
    "id": "site-footer",
    "status": "COMPOSE",
    "html_selector": ".pilot-site-footer",
    "local_selectors": [".pilot-site-footer"],
    "local_files": [],
    "ds_sources": [
        "design-system/blocks/footer/index.md",
        "design-system/components/form/index.md",
        "design-system/components/button/index.md",
        "design-system/components/icon-button/index.md"
    ],
    "knowledge_ids": []
}
```

`DSB-footer` покрывает колонки и social actions. Newsletter можно собрать из
нативной формы, `DSC-form` и `DSC-button`, но без реального endpoint он должен
быть явно помечен как demo/non-submitting.

## Итог поиска

- KB: `KBP-0001` найден для visual QA; `KBP-0002` найден для product-card,
  оба имеют статус candidate и не считаются готовыми решениями.
- `--include-inbox` поиска по ecommerce записей не вернул.
- Catalog: найдены Header, Product Card, Footer, Button, Icon Button, Icon,
  Counter, Form, Price, Badge и Rating; не найдены carousel, tabs, lookbook,
  testimonial, blog и newsletter-specific contracts.
