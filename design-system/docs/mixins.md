# Текущий API SCSS-миксинов

## Статус и правила чтения

В 17 файлах объявлено 39 миксинов. Все параметры, кроме вычисляемых параметров `grid_columns`, по умолчанию равны `null`. Источники не задают Sass-типы и не валидируют значения. Текущий проверочный порядок импорта и smoke-вызовы описаны в [build.md](build.md).

Обозначение `--#{$size}_…` ниже означает динамическое имя CSS-переменной. Например, при `$size: 'md'` получается `--md_…`. Допустимые значения параметров документируются только там, где они подтверждаются ветками SCSS или существующими токенами.

Статусы:

- **Core candidate** — нет подтверждённой привязки к внешней платформе; это ещё не гарантия универсальности.
- **Platform-bound** — код прямо генерирует известные legacy/platform selectors.
- **Unclassified** — миксин предполагает конкретную DOM-структуру, но её происхождение и универсальность не подтверждены.

## `_amount.scss`

### `amount($size: null)` — Unclassified

- Переменные: `--#{$size}_amount_{min_fz|min_lh|total_fz|total_lh|input_w|input_h|input_fz|input_lh|btn_w|btn_h|btn_r}`.
- Селекторы: `.product-amount__min`, `.product-amount__total`, `input`, `button` внутри селектора включения.
- DOM: ожидается контейнер с двумя именованными элементами, вложенными `input` и `button`; точная разметка не подтверждена.
- При `$size: null` ничего не генерирует.

## `_button.scss`

### `button($size: null, $icon: null, $type: null, $defaults: null)` — Platform-bound

- `$defaults` при truthy добавляет reset, inline-flex, overlay `&::before`, hover/active и `.js-selected`.
- `$size` использует `--#{$size}_btn_{fz|lh|mnh|pd|gap|r}`.
- `$type` использует `--gr_#{$type}_btn_{bg|color|bd|shadow|overlay|icon_bg}` плюс варианты `_h`, `_a`, `_s`.
- Дополнительно используется `--transition`.
- Селекторы: текущий селектор, `&::before`, `&:hover`, `&:active`, `&.js-selected`, `.gr-preloader-icon`, `.gr-mask-icon`.
- `$icon` объявлен, но в теле миксина не используется.
- Подтверждённые токенами `$type`: `primary`, `secondary`, `ghost`, `accent`, `white`; код не ограничивает другие строки.

## `_counter.scss`

### `counter($size: null, $defaults: null)` — Core candidate

- `$defaults` добавляет inline-flex и центрирование.
- `$size` использует `--#{$size}_counter_{text|p|h|mw|r}` и `--counter_{color|bd|bg|shadow}`.
- Вложенных селекторов нет.

## `_flags.scss`

### `flags($size: null)` — Core candidate

- Переменные: `--#{$size}_flags_{fz|lh|pd|r}`.
- Вложенных селекторов нет; семантические цвета флагов миксин не применяет.

## `_form_elements.scss`

### `field_title($size: null)` — Core candidate

- Переменные: `--#{$size}_field_title_{pd|m|fz|lh}`.
- Вложенных селекторов нет.

### `input($defaults: null, $size: null, $icon: null)` — Core candidate

- `$defaults`: снимает outline/appearance и скрывает WebKit spin buttons.
- `$size`: `--#{$size}_input_{h|fz|lh|r|pd}`.
- При truthy `$icon` вместо обычного padding используется `--#{$size}_input_icon_pd`.
- Селекторы: текущий элемент и `::-webkit-inner-spin-button`, `::-webkit-outer-spin-button`.
- Тип элемента и внешняя HTML-обёртка не задаются.

### `textarea($defaults: null, $size: null, $icon: null)` — Core candidate

- `$defaults`: тот же reset appearance/spin buttons, что у `input`.
- `$size`: `--#{$size}_textarea_{mh|pd|fz|lh|r}`.
- При truthy `$icon` используется `--#{$size}_textarea_icon_pd`.
- Миксин не ограничивает включение только элементом `textarea`.

### `switcher($size: null)` — Platform-bound

- Переменные: `--#{$size}_switcher_{gap|w|h|r|fz|lh|before_top|before_left|before_w|before_h|before_r|before_translate_x}`.
- Селекторы: `.gr-switcher__item`, `.gr-switcher__item--active`, `.gr-switcher__btn`, `&__btn`, `&__text`, `&::before`.
- DOM-контракт сочетает абсолютный `.gr-switcher__item` и BEM-суффиксы текущего селектора; точка включения критична и не подтверждена примером.
- В теле нет `@if $size`; при `null` будут сформированы переменные с пустым size prefix.

### `select($defaults: null, $size: null)` — Unclassified

- На `&::before`: `--#{$size}_select_icon_{right,w,h}` и `--#{$size}_select_icon` как mask image.
- На `select:not([multiple])`: `--#{$size}_select_{h|pd|fz|lh|r}`.
- `$defaults` сбрасывает appearance/outline, скрывает spin buttons и `::-ms-expand`.
- Ожидает включение на обёртке, которая имеет псевдоэлемент и вложенный одиночный `<select>`; базовое позиционирование псевдоэлемента миксин не задаёт.

### `multiselect($size: null)` — Platform-bound

- Переменные: `--#{$size}_multiselect_{mnh|pd|gap|r|popup_m|popup_r|popup_pd|popup_mxh|search_fz|search_lh|search_pd|search_w|search_h}`.
- Селекторы: `.gr-multiselect__container`, `__popup`, `__items`, `__search`.
- При `$size: null` ничего не генерирует.

### `opened_multiselect($size: null)` — Platform-bound

- Переменные: `--#{$size}_opened_multiselect_{m|mxh|items_p|items_m}`.
- Селекторы: `.gr-opened-multiselect__search-container`, `.gr-opened-multiselect__items`.

### `tag($size: null, $defaults: null)` — Platform-bound

- `$defaults`: positioning, inline-flex, overlay, hover и active.
- `$size`: `--#{$size}_tag_{fz|lh|pd|gap|mnh|r}`.
- Визуальные переменные: `--gr_tag_{bg|color|bd|shadow|overlay|icon_bg}` и варианты `_h`, `_a`.
- Селекторы: текущий, `&::before`, `&.active`, `&:hover`, `&:active`, `.gr-mask-icon`.
- Параметр `$defaults` одновременно включает reset и theme-значения.

### `checkbox($size: null)` — Unclassified

- Переменные: `--#{$size}_checkbox_{gap|w|h|m|fz|lh|mnh|before_l|after_l|r|icon_w|icon_h|icon}`.
- Селекторы: `ul > li > input[type="checkbox"]` и sibling `span` с `::before`/`::after`.
- Предполагаемая структура: контейнер включения → `ul` → `li` → checkbox и `span`; точный порядок, `label` и checked/focus states в этом миксине не заданы.
- В теле нет `@if $size`.

### `radio($size: null)` — Unclassified

- Переменные: `--#{$size}_radio_{gap|w|h|m|fz|lh|mh|mw|before_l|r|bd|shadow}` и state-варианты `_h`, `_f`, `_ch`, `_ch_f`.
- Селекторы: `ul > li > label:hover`, `input[type="radio"]`, `input:focus + span`, `input:checked + span`, `span::before`.
- Подтверждённая структура: `label` содержит `input[type="radio"]`, сразу после него расположен `span`.
- Используется `:focus`, не `:focus-visible`.
- В теле нет `@if $size`.

## `_gifts.scss`

### `gifts($size: null)` — Platform-bound

- Переменные: `--#{$size}_gifts_{gap|item_gap|item_pd|item_r|item_title_fz|item_title_lh|popup_gap|popup_pd|popup_w|popup_r|popup_title_fz|popup_title_lh|popup_text_fz|popup_text_lh}`.
- Селекторы: `.gr-actions__item`, `__title`, `__popup`, `__popup-title`, `__popup-text`.

### `product_gifts($size: null)` — Platform-bound

- Переменные: `--#{$size}_product_gifts_{gap|body_gap|title_fz|title_lh|text_fz|text_lh}`.
- Параллельные селекторы `.promo-action__*` и `.gr-product-actions__*`.
- Два набора классов считаются одним контрактом, но их происхождение не подтверждено.

## `_heading_type.scss`

### `heading_type($type: null)` — Core candidate

- Переменные: `--h_#{$type}_{desktop|laptop|tablet|mobile}`.
- Media queries: `1580px`, `1260px`, `767px`.
- Подтверждённые токенами `$type`: `0`…`6`.
- При `$type: null` ничего не генерирует.

## `_icon_button.scss`

### `icon_button($size: null, $type: null, $defaults: null)` — Platform-bound

- `$defaults`: reset, inline-flex, overlay, hover/active и `.js-selected`.
- `$size`: `--#{$size}_icon_btn_{w|h|r}`.
- `$type`: `--gr_#{$type}_icon_btn_{bg|bd|shadow|overlay|icon_bg}` и варианты `_h`, `_a`, `_s`.
- Селекторы: `&::before`, `&:hover`, `&:active`, `&.js-selected`, `.gr-mask-icon`.
- Подтверждённые токенами `$type`: `ghost`, `secondary`, `surface`, `surface_color`. В `_popup.scss` передаётся `ghost`.

## `_icon.scss`

### `icon($size: null, $defaults: null)` — Core candidate

- `$defaults`: inline-flex, нулевой font-size, mask position/repeat и `--transition`.
- `$size`: `--#{$size}_icon_w`, `--#{$size}_icon_h`.
- Для `-webkit-mask-size` используются width и height; для unprefixed `mask-size` в текущем коде height используется дважды.
- Mask image миксин не задаёт: его должен назначить потребитель.

## `_options.scss`

### `options($size: null, $title: null, $body: null)` — Core candidate

- При `$title`: `--#{$size}_options_title_{fz|lh}`.
- При `$body`: `--#{$size}_options_body_{fz|lh}`.
- Все свойства применяются к текущему селектору; вложенных селекторов нет.

## `_popup_title.scss`

### `popup_title($size: null, $defaults: null)` — Core candidate

- `$defaults`: `color: var(--popup_title_color)`.
- `$size`: `font: var(--#{$size}_popup_title)`.

## `_popup.scss`

### `popup($size: null, $defaults: null)` — Platform-bound

- Подтверждённые ветками размеры: `xl`, `lg`, `md`, `sm`.
- Переменные: `--#{$size}_popup_pd_{desktop|laptop|tablet|mobile}`, `--#{$size}_popup_mxw_{desktop|laptop|tablet}`, `--{lg|md|sm}_popup_title_m`, `--icon_cross_{lg|md}`.
- Media queries: `1580px`, `1260px`, `767px`.
- Селекторы: `.remodal-close-btn`, `.remodal__title`, `.remodal--title-margin`, `.gr-mask-icon`.
- Вызывает `icon_button`, `icon`, `popup_title`; собственных `@use`/`@import` нет.
- `$size: xl` всегда становится fullscreen. Для остальных размеров truthy `$defaults` включает fullscreen только до `767px`.

## `_price.scss`

### `price($size: null)` — Platform-bound

- Переменные: `--#{$size}_{old_price_fz|old_price_lh|old_price_currency_fz|old_price_currency_lh|price_onrequest_fz|price_onrequest_lh|current_price_fz|current_price_lh|price_currency_fz|price_currency_lh|price_popup_pd|price_popup_w|price_popup_r|price_popup_fz|price_popup_lh}`.
- Селекторы: `.price-old__value`, `.price-old__currency`, `.price-current`, `.price-current--onrequest`, `.price-current__value`, `.price-current__currency`, `.shop2-product-discount-desc`.
- Привязка Shop2 подтверждена последним селектором; происхождение остальных price-классов не подтверждено.

## `_rating.scss`

### `rating($size: null)` — Platform-bound

- Переменные: `--#{$size}_rating_{w|h|icon|icon_w|icon_h}`, `--rating_disabled`, `--rating_active`.
- Генерирует mask-based фон на `&::before` и `.tpl-rating::before`; `.tpl-rating` обрезает активную часть через `overflow: hidden`.
- В коде повторяются объявления `mask-size`.
- DOM-контракт `.tpl-rating` является обязательным для активного слоя; его происхождение не подтверждено.

## `_shop.scss`

### `grid_columns($defaults: null, $gap: null, $columns: null, $columns_margin: null, $columns_total: 100% / $columns, $columns_decrement: $columns - 1)` — Core candidate

- `$defaults` включает `display: grid`; `gap` всегда получает `$gap`.
- При `$columns_margin` формула: `repeat($columns, calc($columns_total - ($columns_margin * $columns_decrement / $columns)))`.
- Без margin: `repeat($columns, $columns_total)`.
- Значения `$columns_total` и `$columns_decrement` вычисляются из `$columns`; вызов без `$columns` не подтверждён и потенциально невалиден.

### `card_type($type: null, $hover: null)` — Unclassified

- Переменные: `--gr_card_type_#{$type}_{r|bg|bd|shadow}` и hover-варианты `_h`.
- Селекторы: текущий и `&:hover`.
- Прямых `.gr-*` классов нет, но токенный namespace платформоспецифичен; допустимые `$type` по коду не ограничены. В токенах есть card type `1` и `2`.

### `product_name($size: null)` — Core candidate

- Переменные: `--#{$size}_product_name_{fz|lh}`. Вложенных селекторов нет.

### `vendor_name($size: null)` — Core candidate

- Переменные: `--#{$size}_vendor_name_{fz|lh}`. Вложенных селекторов нет.

### `annonce($size: null)` — Core candidate

- Переменные: `--#{$size}_annonce_{fz|lh}`. Имя `annonce` сохранено как в исходнике.

### `article($size: null)` — Core candidate

- Переменные: `--#{$size}_article_{fz|lh}`. Цвет `--aritcle_color` миксином не используется.

### `bonus_flag($size: null)` — Core candidate

- Переменные: `--#{$size}_bonus_flag_{fz|lh|pd|r}`.

### `option_image($size: null)` — Unclassified

- Переменные: `--#{$size}_option_image_{gap|w|h|r}`.
- Селекторы: `.option-image`, `li` внутри текущего контейнера.
- Наличие обоих альтернативных селекторов подтверждено; ожидаемая семантика списка не подтверждена.

### `option_image2($size: null)` — Platform-bound

- Те же размерные переменные `option_image`.
- Селекторы: `.gr-image-picker__items`, `.gr-image-picker__item`.

### `option_color($size: null, $wrap: null, $item: null)` — Core candidate

- `$wrap` применяет `--#{$size}_option_color_gap` к текущему селектору.
- `$item` применяет `--#{$size}_option_color_{w|h|r}` к текущему селектору.
- При одновременных `$wrap` и `$item` генерируются оба набора свойств.

### `option_color2($size: null)` — Platform-bound

- Переменные: `--#{$size}_option_color_{gap|item_gap|w|h|r|item_fz|item_lh}`.
- Селекторы: `.gr-color-picker__items`, `__item`, `__image`, `__name`.

### `color_select($size: null)` — Platform-bound

- Переменные: `--#{$size}_color_select_{h|pd|r|icon|icon_right|icon_h|icon_w|item_g|item_fz|item_lh|color_h|color_w|color_r|popup_m|popup_pd|popup_r|popup_item_pd}`.
- Селекторы: `.gr-color-select__items`, `__item`, `__color`, `__popup`, `__text`; используются `::before` и mask image.

### `link_button($size: null, $defaults: null, $dashed: null, $text: null)` — Platform-bound

- `$defaults`: inline-flex, базовые состояния и theme values.
- `$size`: `--#{$size}_link_btn_{fz|lh|gap}`.
- Theme variables: `--link_btn_{color|bd|dashed_bd|icon_color}` и варианты `_h`, `_a`, `_s`.
- `$text` интерполируется как произвольный вложенный селектор `#{$text}`; при `$dashed` выбирается dashed border family.
- Селекторы: `#{$text}`, `.gr-mask-icon`, `&:hover`, `&:active`, `&.js-selected`.

## `_text_type.scss`

### `text_type($type: null)` — Core candidate

- Переменные: `--p_#{$type}_{desktop|laptop|tablet|mobile}`.
- Media queries: `1580px`, `1260px`, `767px`.
- Подтверждённые токенами `$type`: `xl`, `lg`, `md`, `sm`.

## `_toggle_title.scss`

### `toggle_title($size: null)` — Core candidate

- Переменная: `--#{$size}_toggle_title`.
- Подтверждённые токенами размеры: `sm`, `md`, `lg`.
- Миксин не создаёт icon или state selectors, несмотря на наличие соответствующих токенов.

## Общие неподтверждённые вопросы

- Реальные точки `@include` в проектах отсутствуют.
- Не подтверждено, передаются ли булевы `true` или строки `'true'`; Sass считает обе формы truthy, и в `_popup.scss` встречается строка.
- Внешний исторический порядок импорта не подтверждён; минимальная сборка фиксирует только доказанную зависимость `_popup.scss`.
- Нет спецификации классов `gr-*`, `.tpl-rating`, `.promo-action__*` и `.product-amount__*`.
- `$icon` у `button` не используется; назначение параметра неизвестно.
