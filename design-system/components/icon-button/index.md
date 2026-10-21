---
id: DSC-icon-button
kind: component
maturity: stable
platform: neutral
purpose: icon-only actions
classes: [.ds-icon-button, .ds-icon-button--sm, .ds-icon-button--md, .ds-icon-button--lg]
structural_classes: []
variants: [sm, md, lg]
requires:
  components: [.ds-icon]
public_tokens: []
optional_tokens: [--focus_ring_color]
a11y: [accessible-name, native-button, native-disabled, aria-disabled-visual-state, focus-visible]
viewports_verified: []
examples: [design-system/templates/home.html]
---

# Icon Button

Нейтральная кнопка с одной иконкой. Публичный класс — `.ds-icon-button`.
Компонент использует `.ds-icon`, но не зависит от Shop2, Remodal, `gr-*`,
`.js-selected` или legacy button/icon mixins.

## HTML-контракт

Используйте нативный `button` с заданным `type`, доступным именем `aria-label`
и декоративной дочерней иконкой:

```html
<button
    class="ds-icon-button ds-icon-button--md"
    type="button"
    aria-label="Закрыть"
>
    <span
        class="ds-icon"
        style="--ds-icon: var(--icon_cross_md)"
        aria-hidden="true"
    ></span>
</button>
```

`aria-label` обязателен, когда кнопка содержит только иконку: имя SVG mask не
передаётся скринридеру. У вложенной `.ds-icon` всегда используйте
`aria-hidden="true"`, чтобы доступное имя не дублировалось.

Источник иконки задаётся через `--ds-icon`; доступные значения объявлены в
`design-system/tokens/icons.css`. До `components.css` должен быть подключён
token layer (`tokens.css` или `core.css`).

## Размеры

| Модификатор | Токены кнопки | Размер вложенной иконки |
|---|---|---|
| `.ds-icon-button--sm` | `--sm_icon_btn_w`, `--sm_icon_btn_h` | `--sm_icon_w`, `--sm_icon_h` |
| `.ds-icon-button--md` | `--md_icon_btn_w`, `--md_icon_btn_h` | `--md_icon_w`, `--md_icon_h` |
| `.ds-icon-button--lg` | `--lg_icon_btn_w`, `--lg_icon_btn_h` | `--lg_icon_w`, `--lg_icon_h` |

Без модификатора применяется `md`. Не добавляйте несколько size-модификаторов
на один элемент.

## Состояния и доступность

Компонент поддерживает `:focus-visible`, hover, active и disabled. Для
нормальной кнопки используйте нативный `disabled`:

```html
<button
    class="ds-icon-button ds-icon-button--sm"
    type="button"
    aria-label="Удалить"
    disabled
>
    <span
        class="ds-icon"
        style="--ds-icon: var(--icon_delete_sm)"
        aria-hidden="true"
    ></span>
</button>
```

Атрибут `aria-disabled="true"` поддерживает только визуальное состояние.
Если он используется на нестандартном интерактивном элементе, прикладной код
должен самостоятельно запретить действие.

В первый контракт не входят текстовые подписи, loading-state, toggle-state и
legacy-варианты оформления.
