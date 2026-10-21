---
id: DSC-rating
kind: component
maturity: stable
platform: neutral
purpose: ratings with stars and optional value
classes: [.ds-rating, .ds-rating__stars, .ds-rating__fill, .ds-rating__value, .ds-rating--sm, .ds-rating--md]
structural_classes: []
variants: [sm, md]
requires:
  components: [.ds-icon]
public_tokens: []
optional_tokens: []
a11y: [status-text]
viewports_verified: []
examples: [design-system/templates/home.html, design-system/templates/shop.html]
---

# Rating

Нейтральный read-only компонент рейтинга. Он не использует legacy mixin
`rating`, `.tpl-rating`, Shop2, Remodal, `gr-*` или `.js-selected`.

## HTML-контракт

Используйте `.ds-rating` как единый доступный объект. Визуальные звёзды
скрываются от скринридера, а значение передаётся через `aria-label`:

```html
<span class="ds-rating ds-rating--md" role="img" aria-label="Рейтинг: 4 из 5">
    <span class="ds-rating__stars" aria-hidden="true">
        <span class="ds-rating__fill" style="width: 80%"></span>
    </span>
</span>
```

`width` у `.ds-rating__fill` — доля заполнения от `0%` до `100%`. Для
пятибалльной шкалы значение `4` соответствует `80%`, `3.5` — `70%`. Компонент
не вычисляет это значение и не является интерактивным контролом.

## Числовое значение

Число можно вывести рядом со звёздами. Оно визуально дополняет рейтинг, а
доступное имя по-прежнему задаётся на корневом элементе:

```html
<span class="ds-rating" role="img" aria-label="Рейтинг: 4,2 из 5">
    <span class="ds-rating__stars" aria-hidden="true">
        <span class="ds-rating__fill" style="width: 84%"></span>
    </span>
    <span class="ds-rating__value" aria-hidden="true">4,2</span>
</span>
```

## Размеры и источники иконок

| Модификатор | Источник | Токены размера |
|---|---|---|
| `.ds-rating--sm` | `--icon_rating_star_sm` через `--sm_rating_icon` | `--sm_rating_*` |
| `.ds-rating--md` или без модификатора | `--icon_rating_star_md` через `--md_rating_icon` | `--md_rating_*` |

Перед `components.css` должен быть подключён token layer (`tokens.css` или
`core.css`): `icons.css` предоставляет URL-переменные для SVG-спрайта.

В текущем спрайте нет `icon_rating_star_lg`, поэтому `.ds-rating--lg` не
поддерживается. Компонент использует `mask-image` с повторением по оси X и
токены `--rating_disabled`/`--rating_active` для пустой и заполненной частей.

Для интерактивного выбора рейтинга нужен отдельный будущий компонент с
нативными radio-кнопками и клавиатурным управлением.
