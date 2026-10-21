# Текущий API CSS-токенов

## Источники и область действия

- `tokens/new_colors.css`: 184 уникальных объявления в `:root`.
- `tokens/fonts.css`: 2 глобальные переменные font stack в `:root`.
- `tokens/icons.css`: 138 URL-переменных в `:root`, по одной на каждый текущий SVG `view` ID.
- `tokens/new_sizes.css`: 1315 объявлений в `:root`, 1312 уникальных имён.
- `tokens/spacing.css`: нейтральная spacing/layout-шкала для новых `.ds-*` компонентов и блоков.

Исходные токены объявляются глобально в `:root`. Проект может переопределять
публичные нейтральные alias-токены в собственном корневом селекторе после
`tokens.css`; порядок исходного token layer задан в `scss/tokens.scss`.

## Группы `new_colors.css`

### Primary

`--primary`, прозрачности `--primary_1`…`--primary_9`, `--primary_surface`; контрастные значения `--on_primary` и `--on_primary_1`…`--on_primary_9`; семантические aliases `--icon_primary*`.

### Accent

`--accent`, `--accent_1`…`--accent_9`, `--accent_surface`; `--on_accent*`; `--icon_accent*`.

### Main surface

`--bg_main`, `--bg_main_surface`; `--on_bg_main*`; `--icon_bg_main*`; `--bd_bg_main*`; дополнительная шкала `--on_bg_main_accent*`.

### Semantic colors

- ссылки: `--link_color`, `--link_bd`;
- disabled: `--disable`, `--on_disable`;
- attention: `--attention*`, `--on_attention`;
- sale: `--sale*`, `--on_sale`;
- success: `--success*`, `--on_success`;
- error: `--error*`, `--on_error`.

`--sale` is a semantic fill token: it is used by sale flags and badges with
`--on_sale` text. Price discount text uses the separate public
`--price_sale_text_color` through `--price_sale_color`. Its default `#AD431F`
has contrast 5.12:1 on `#F2F0E9`, 5.83:1 on `#FFFFFF`, and 5.45:1 on
`#F7F7F7`. It is not suitable unchanged on the default dark surface `#151037`
(3.10:1) or House dark surface `#20211F` (2.77:1); projects that place price
discounts there must override `--price_sale_text_color` after `tokens.css`.

### Neutral, effects and service values

- `--black`, `--white` и их alpha-варианты, включая `_05` и `_02`;
- `--shadow_xl`, `--shadow_lg`, `--shadow_md`, `--shadow_sm`;
- `--tooltip`, `--on_tooltip`;
- `--product_overlay`;
- `--no_image_bg` — встроенный data URI и фоновый цвет `--disable`.

## Группы `new_sizes.css`

Файл содержит foundation- и component-level токены вместе.

- настройки сайта: `--site_width`, `--transition`;
- секционные отступы: `--section_pd_{desktop|laptop|tablet|mobile}`;
- радиусы: `--base_radius`, `--box_radius`, `--btn_radius`, `--checkbox_radius`, `--form_radius`, `--iconbtn_radius`, `--medium_radius`, `--small_radius`, `--wrap_radius`, `--round_radius`;
- таблицы: `--tablePadding`, `--tableBorder`, `--tableThBackground`, `--tableThColor`;
- шрифты и веса: `--font_accent`, `--font_content`, `--fw_*`, `--fw1_*`, `--fw2_*`;
- font sizes: `--fz_*`, `--heading_fz_*`;
- responsive typography: `--h_{0..6}_{desktop|laptop|tablet|mobile}`, `--p_{xl|lg|md|sm}_{desktop|laptop|tablet|mobile}`;
- базовые размеры иконок: `--{sm|md|lg}_icon_{w|h}`;
- component families: counter, popup, cards, forms, inputs, textarea, select, tags, multiselect, checkbox, radio, switcher, buttons, icon buttons, pagination, product metadata, prices, rating, amount, options, gifts, flags, bonus flag и color select.

Размерные component-токены в основном используют схему:

```text
--{size}_{component}_{property}
--gr_{variant}_{component}_{property}{state}
```

Наблюдаемые размеры: `xs`, `sm`, `md`, `lg`, `xl`. Наблюдаемые суффиксы состояния: `_h`, `_a`, `_s`, `_f`, `_ch`, `_ch_f`, `_d`. Их семантика прямо не документирована; по месту использования подтверждаются как минимум hover, active, selected, focus, checked и disabled.

## Нейтральная spacing/layout-шкала `spacing.css`

Для новых нейтральных `.ds-*` компонентов и блоков доступны примитивы
`--ds-space-0`, `--ds-space-1`, `--ds-space-2`, `--ds-space-3`,
`--ds-space-4`, `--ds-space-5`, `--ds-space-6`, `--ds-space-8`,
`--ds-space-10`, `--ds-space-12`, `--ds-space-16`, `--ds-space-20` и
`--ds-space-24`. Они образуют шаги `0`, `4`, `8`, `12`, `16`, `20`, `24`,
`32`, `40`, `48`, `64`, `80` и `96px`.

Чтобы не дублировать имеющиеся значения, `--ds-space-4`, `--ds-space-6` и
`--ds-space-10` являются alias соответственно для `--section_pd_mobile`,
`--section_pd_tablet` и `--section_pd_desktop`.

Семантические alias для page composition:

- `--ds-container-max` → `--site_width`;
- `--ds-page-gutter` — 40px desktop, 24px tablet, 16px mobile;
- `--ds-grid-gap` — 24px desktop и 16px mobile;
- `--ds-content-gap` — 16px desktop и 12px mobile;
- `--ds-section-space` → соответствующий `--section_pd_*` на текущем breakpoint.

Переопределяйте эти значения в селекторе корня конкретного проекта, подключённом
после `tokens.css`. Component-specific токены (`--md_btn_gap`, `--md_checkbox_gap`
и аналогичные) остаются только внутри соответствующих компонентов.

## Важные зависимости

- `--font_accent: var(--font2)` и `--font_content: var(--font1)`.
- Шортхенды `--h_*`, `--p_*`, `--*_popup_title`, `--*_counter_text`, `--*_toggle_title` зависят от font family и weight токенов.
- Почти все визуальные component-токены `new_sizes.css` зависят от `new_colors.css`.
- `select`, `color_select`, `rating` и `checkbox` зависят от icon URL custom properties.
- Миксины формируют имена динамически из `$size` и `$type`; переданное значение обязано соответствовать существующей семье токенов, иначе результирующий `var()` останется неопределённым.

## Обязательные внешние значения

В текущем репозитории не объявлены, но используются:

| Переменная | Потребитель |
|---|---|
| `--icon_rating_star_lg` | рейтинг `lg`; соответствующего ID в спрайте нет |
| `--icon_site_checkbox_small` | checkbox `sm` и `md` |
| `--icon_site_checkbox` | checkbox `lg` |

`fonts.css` задаёт `--font1` и `--font2` системными fallback-стеками. `icons.css` задаёт URL-переменные для всех фактических ID текущего SVG-спрайта, в том числе `--icon_arrow_bot_*`, `--icon_rating_star_{sm,md}` и `--icon_cross_{md,lg}`. Источник checkbox-иконок не обнаружен.

## Отсутствующие ресурсы

- `--option_color_item_empty: url(../empty_color.svg)` ссылается на файл, которого нет в репозитории.
- `icon_rating_star_lg` отсутствует в текущем SVG-спрайте.
- `icon_site_checkbox` и `icon_site_checkbox_small` отсутствуют в текущем SVG-спрайте.

Относительный URL `../empty_color.svg` разрешается относительно итогового CSS, поэтому фактический runtime-путь без сборки дополнительно не подтверждён.

## Дубли и неоднозначности

| Имя | Объявления | Наблюдение |
|---|---|---|
| `--sm_option_color_item_gap` | строки 1613 и 1617, оба `8px` | точный дубль |
| `--lg_option_color_item_gap` | строки 1632 и 1636, оба `12px` | точный дубль |
| `--toggle_title_icon_h` | `32px`, затем `var(--icon_arrow_bot_md)` | второе объявление перезаписывает высоту значением URL-переменной |

Другие неоднозначные имена:

- `--aritcle_color` содержит опечатку, тогда как mixin и размерные токены используют `article`;
- одновременно используются snake_case (`--site_width`) и camelCase (`--tablePadding`);
- `--md_icon_*` и `--lg_icon_*` оба равны `30px`, хотя suffix обозначает разные уровни;
- `--transition: all .2s` задаёт переход для всех изменяемых свойств;
- `--gr_*` смешивает визуальные токены с предположительно платформенным namespace.

## Проблемы, требующие исправления после этапа документации

Этот раздел фиксирует дефекты, но не изменяет API.

- Разрешить отсутствующие rating/checkbox icons и `empty_color.svg`.
- Исправить конфликт `--toggle_title_icon_h` без неявной смены публичного контракта.
- Рассмотреть точные дубли и `--aritcle_color` через стратегию обратной совместимости.
- Для обычного текста скидки используйте `--price_sale_text_color`, а не
  `--sale`: `--sale` остаётся токеном заливки. На тёмных поверхностях проект
  обязан переопределить text token и проверить контраст конкретной пары.
- Зафиксировать, какие размеры и варианты каждого component family считаются поддерживаемыми публично.

## Неподтверждённые вопросы

- Где должны объявляться font-face и значения `--font1`/`--font2`.
- Генерировались ли icon URL custom properties внешним инструментом.
- Являются ли `gr-*` токены частью внешней платформы или внутренним legacy namespace.
- Какие токены реально переопределяются отдельными сайтами.
