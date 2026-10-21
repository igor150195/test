---
id: DSC-counter
kind: component
maturity: stable
platform: neutral
purpose: quantities and counts
classes: [.ds-counter, .ds-counter--sm, .ds-counter--md, .ds-counter--lg]
structural_classes: []
variants: [sm, md, lg]
requires:
  components: []
public_tokens: []
optional_tokens: []
a11y: [status-text]
viewports_verified: []
examples: [design-system/blocks/header/index.md]
---

# Counter

`.ds-counter` — нейтральный display-only счётчик для небольшого числа: новых
уведомлений, количества товаров или статуса. Он не является input, не содержит
кнопок изменения количества и не зависит от legacy `counter`/`amount` mixins
или `.product-amount__*` классов.

## HTML-контракт

Для декоративного числа рядом с уже названным элементом скройте счётчик от
скринридера:

```html
<a href="/cart/">
    Корзина
    <span class="ds-counter ds-counter--sm" aria-hidden="true">3</span>
</a>
```

Если число должно быть самостоятельной информацией, добавьте доступное имя:

```html
<span class="ds-counter" role="status" aria-label="В корзине 3 товара">3</span>
```

## Размеры

| Модификатор | Токены |
|---|---|
| `.ds-counter--sm` | `--sm_counter_*` |
| `.ds-counter--md` или без модификатора | `--md_counter_*` |
| `.ds-counter--lg` | `--lg_counter_*` |

Компонент использует `tabular-nums`, поэтому смена числа меньше влияет на
ширину. Форматирование `99+`, `1k` и правила локализации определяет проект.
