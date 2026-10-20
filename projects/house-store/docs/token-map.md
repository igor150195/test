# Token map — house-store

Ретроспективная карта создана по `index.html`, `css/custom.css` и
документированным контрактам дизайн-системы. Проект работает в режиме
`brief`: исходный референс в репозитории не зафиксирован. Ниже отмечены только
соответствия, которые подтверждаются фактическими классами и файлами.

```ds-section
{
    "id": "site-header",
    "status": "REUSE",
    "html_selector": ".house-header",
    "local_selectors": [".house-header"],
    "local_files": ["css/custom.css"],
    "ds_sources": ["design-system/blocks/header/index.md"],
    "knowledge_ids": []
}
```

Шапка использует `.ds-header`, `.ds-input`, `.ds-icon-button` и `.ds-icon`;
локальный класс задаёт композицию конкретного проекта.

```ds-section
{
    "id": "catalog-products",
    "status": "COMPOSE",
    "html_selector": ".house-catalog",
    "local_selectors": [".house-catalog", ".house-products__grid", ".house-filter"],
    "local_files": ["css/custom.css"],
    "ds_sources": [
        "design-system/blocks/product-card/index.md",
        "design-system/components/form/index.md",
        "design-system/components/price/index.md",
        "design-system/components/rating/index.md",
        "design-system/components/badge/index.md"
    ],
    "knowledge_ids": ["KBP-0002"]
}
```

Каталог собирает существующие карточки товара, формы, цену, рейтинг и флаги;
проектный CSS отвечает за layout каталога и фильтра.

```ds-section
{
    "id": "site-footer",
    "status": "REUSE",
    "html_selector": ".house-footer",
    "local_selectors": [".house-footer"],
    "local_files": ["css/custom.css"],
    "ds_sources": ["design-system/blocks/footer/index.md"],
    "knowledge_ids": []
}
```

Остальные секции (`house-hero`, `house-statement`, `house-edits`,
`house-principles`, `house-lookbook`, `house-testimonials`, `house-faq`,
`house-cta`) не получают ретроспективного статуса: существующие документы не
подтверждают их исходную потребность или применимость как системного API.
`check:compliance` сообщает о них как о секциях без записи; это не является
доказательством соответствия.
