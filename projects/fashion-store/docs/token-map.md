# Карта токенов и API

## Повторно используемые общие токены

| Задача | Токены |
| --- | --- |
| Контейнер и отступы | `--ds-container-max`, `--ds-page-gutter`, `--ds-section-space`, `--ds-grid-gap`, `--ds-content-gap`, `--ds-space-*` |
| Базовые цвета и разделители | `--bg_main`, `--on_bg_main`, `--on_bg_main_6`, `--bd_bg_main_2` |
| Базовая типографика | `--font1`, `--font2`, `--font_content`, `--font_accent`, `--h_1_desktop`, `--h_2_mobile`, `--fz_sm` |
| Состояния и фокус | `--primary`, `--primary_surface`, `--on_primary`, `--focus_ring_color` |
| Карточки | `--bg_main_surface`, `--shadow_sm`, `--shadow_md`, `--base_radius` |

## Локальная тема

`css/custom.css` задаёт наследуемые значения только на `.fashion-store`:
тёплый коричневый primary, персиковый accent, тёмный footer и более узкий
контейнер. Это не меняет `:root` и не влияет на иные проекты.

## Используемые компоненты и блоки

- Blocks: `.ds-header`, `.ds-footer`, `.ds-product-card` и его `__`-элементы.
- Components: `.ds-button`, `.ds-icon-button`, `.ds-icon`, `.ds-rating`,
  `.ds-price`, `.ds-flag`.
- Icons: `--icon_search_sm`, `--icon_user_sm`, `--icon_bag_cart_sm`,
  `--icon_favorite_add_sm`, `--icon_arrow_right_sm`.

Новые глобальные токены, иконки, миксины и компоненты не добавлялись.

## Ретроспективные статусы секций

Статусы ниже следуют только из `reference-analysis.md`, `page-blueprint.md` и
фактических классов проекта. Остальные секции отмечены как не определённые.

```ds-section
{
    "id": "site-header",
    "status": "REUSE",
    "html_selector": ".fashion-header",
    "local_selectors": [".fashion-header"],
    "local_files": ["css/custom.css"],
    "ds_sources": ["design-system/blocks/header/index.md"],
    "knowledge_ids": []
}
```

```ds-section
{
    "id": "product-new-arrivals",
    "status": "COMPOSE",
    "html_selector": ".fashion-products",
    "local_selectors": [".fashion-products"],
    "local_files": ["css/custom.css"],
    "ds_sources": [
        "design-system/blocks/product-card/index.md",
        "design-system/components/price/index.md",
        "design-system/components/rating/index.md",
        "design-system/components/badge/index.md"
    ],
    "knowledge_ids": ["KBP-0002"]
}
```

```ds-section
{
    "id": "site-footer",
    "status": "REUSE",
    "html_selector": ".fashion-footer",
    "local_selectors": [".fashion-footer"],
    "local_files": ["css/custom.css"],
    "ds_sources": ["design-system/blocks/footer/index.md"],
    "knowledge_ids": []
}
```

Hero, полоса брендов, категория, редакционный блок и точная адаптивная
композиция не определены ретроспективно: имеющиеся документы не доказывают
для них `REUSE` или `COMPOSE` без дополнительного анализа.

