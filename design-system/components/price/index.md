# Price

Нейтральный блок цены. Публичные классы `.ds-price`, `.ds-price__current`,
`.ds-price__old` и `.ds-price__discount` не зависят от Shop2, Remodal,
`gr-*`, legacy `.price-*` или `.shop2-product-discount-desc`.

## HTML-контракт

Текущая цена обязательна. Старая цена и скидка добавляются только когда они
соответствуют данным товара:

```html
<div class="ds-price ds-price--md">
    <data class="ds-price__current" value="1490">1&nbsp;490&nbsp;₽</data>
    <del class="ds-price__old">
        <data value="1990">1&nbsp;990&nbsp;₽</data>
    </del>
    <span class="ds-price__discount">−25%</span>
</div>
```

`data[value]` передаёт машиночитаемое числовое значение. Разделители,
валюта и локализация остаются обычным текстом внутри элемента и определяются
проектом. Для цены без скидки достаточно `.ds-price__current`.

`del` сообщает зачёркнутую семантику старой цены. Не используйте его для
произвольного устаревшего текста, не являющегося прежней ценой.

## Размеры

| Модификатор | Current / old tokens |
|---|---|
| `.ds-price--sm` | `--sm_current_price_*`, `--sm_old_price_*` |
| `.ds-price--md` или без модификатора | `--md_current_price_*`, `--md_old_price_*` |
| `.ds-price--lg` | `--lg_current_price_*`, `--lg_old_price_*` |
| `.ds-price--xl` | `--xl_current_price_*`, `--xl_old_price_*` |

Цвета берутся из `--price_color`, `--old_price_color`, `--old_price_line` и
`--price_sale_color`. Отдельные popup, on-request и platform-specific
сценарии не входят в первый контракт компонента.
