# Icon

Нейтральный компонент иконки. Он использует CSS mask и не зависит от Shop2,
Remodal, `gr-*` или legacy icon mixin.

## Подключение

До `components.css` должен быть подключён token layer (`tokens.css` или
`core.css`), потому что `design-system/tokens/icons.css` объявляет источники
иконок. В нём используются фактические имена с подчёркиваниями, например
`--icon_search_md`, а не имена, придуманные в разметке.

## HTML-контракт

Передайте URL-переменную из `icons.css` через `--ds-icon`:

```html
<span
    class="ds-icon ds-icon--sm"
    style="--ds-icon: var(--icon_search_md)"
    aria-hidden="true"
></span>
```

`aria-hidden="true"` используйте для декоративной иконки рядом с текстом.
Если иконка самостоятельно передаёт смысл, задайте роль и доступное имя:

```html
<span
    class="ds-icon ds-icon--sm"
    style="--ds-icon: var(--icon_warning_sm)"
    role="img"
    aria-label="Предупреждение"
></span>
```

Значение `--ds-icon` должно быть одной из переменных из `icons.css`. Например,
`var(--icon_arrow_bot_sm)`, `var(--icon_cross_md)` или
`var(--icon_search_md)`. Не используйте ID спрайта напрямую в HTML: реестр
`icons.css` задаёт runtime URL к спрайту.

## Размеры

| Модификатор | Токены контейнера |
|---|---|
| `.ds-icon--sm` | `--sm_icon_w`, `--sm_icon_h` |
| `.ds-icon--md` | `--md_icon_w`, `--md_icon_h` |
| `.ds-icon--lg` | `--lg_icon_w`, `--lg_icon_h` |

Без модификатора применяется размер `md`. Размерный suffix в ID спрайта не
является гарантией физического размера исходной SVG-области, поэтому размер
контейнера всегда выбирается отдельным модификатором.

## Цвет

По умолчанию маска окрашивается через `background: currentColor`; цвет
наследуется от текста родителя. Чтобы задать локальный цвет, передайте
`--ds-icon-color`:

```html
<span
    class="ds-icon ds-icon--md"
    style="--ds-icon: var(--icon_info_sm); --ds-icon-color: var(--primary)"
    aria-hidden="true"
></span>
```

Компонент поддерживает `mask-image`, `mask-repeat: no-repeat`,
`mask-position: center` и размер маски `100% 100%` с WebKit-префиксами.
