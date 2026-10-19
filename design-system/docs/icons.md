# Текущий API SVG-иконок

## Источник и структура

Источник: `sets/1/new.sprite.view.svg`.

- корневой размер: `500 × 240`;
- корневой `viewBox`: `0 0 500 240`;
- 138 уникальных элементов `<view id="…">`;
- 138 вложенных `<svg>` с геометрией иконок;
- `<symbol>`, `<defs>` и `<use>` не применяются;
- дублирующихся `view` ID и дублирующихся `viewBox`-областей не обнаружено.

Фактическим идентификатором API является точное значение `view/@id`. Переименование ID может нарушить внешние ссылки, даже если в этом репозитории они не найдены.

## Реестр ID

Таблица содержит все 138 ID. Колонка «Размеры/ID» использует фактические имена, а не предполагаемые имена.

| Семейство | Размеры/ID |
|---|---|
| advanced filters | `icon_advanced_filters_sm`, `icon_advanced_filters_md` |
| arrow bottom | `icon_arrow_bot_sm`, `icon_arrow_bot_md`, `icon_arrow_bot_lg` |
| arrow first | `icon_arrow_first_sm`, `icon_arrow_first_md`, `icon_arrow_first_lg` |
| arrow last | `icon_arrow_last_sm`, `icon_arrow_last_md`, `icon_arrow_last_lg` |
| arrow left | `icon_arrow_left_sm`, `icon_arrow_left_md`, `icon_arrow_left_lg` |
| arrow right | `icon_arrow_right_sm`, `icon_arrow_right_md`, `icon_arrow_right_lg` |
| arrow top | `icon_arrow_top_sm`, `icon_arrow_top_md`, `icon_arrow_top_lg` |
| available | `icon_available_sm`, `icon_available_md` |
| bag cart | `icon_bag_cart_sm`, `icon_bag_cart_md` |
| bonus | `icon_bonus_sm`, `icon_bonus_md` |
| burger | `icon_burger_sm`, `icon_burger_md` |
| calendar | `icon_calendar_sm`, `icon_calendar_md` |
| cart add | `icon_cart_add_sm`, `icon_cart_add_md` |
| cart | `icon_cart_sm`, `icon_cart_md` |
| cart not | `icon_cart_not_sm`, `icon_cart_not_md` |
| catalog combined | `icon_catalog_comb_sm`, `icon_catalog_comb_md` |
| catalog | `icon_catalog_sm`, `icon_catalog_md` |
| check | `icon_check_sm`, `icon_check_md` |
| compare active | `icon_compare_active_sm`, `icon_compare_active_md` |
| compare add | `icon_compare_add_sm`, `icon_compare_add_md` |
| compare | `icon_compare_sm`, `icon_compare_md` |
| cross | `icon_cross_sm`, `icon_cross_md`, `icon_cross_lg` |
| delete | `icon_delete_sm`, `icon_delete_md` |
| delivery box | `icon_delivery_box_sm`, `icon_delivery_box_md`, `icon_delivery_box_lg` |
| delivery courier | `icon_delivery_courier_sm`, `icon_delivery_courier_md`, `icon_delivery_courier_lg` |
| delivery | `icon_delivery_sm`, `icon_delivery_md`, `icon_delivery_lg` |
| delivery, extra ID | `icon_delivery_sm-1` |
| favorite active | `icon_favorite_active_sm`, `icon_favorite_active_md` |
| favorite add | `icon_favorite_add_sm`, `icon_favorite_add_md` |
| favorite | `icon_favorite_sm`, `icon_favorite_md` |
| file | `icon_file_sm`, `icon_file_md` |
| filter | `icon_filter_sm`, `icon_filter_md` |
| help | `icon_help_sm` |
| home | `icon_home_sm`, `icon_home_md` |
| info | `icon_info_sm` |
| mail | `icon_mail_sm`, `icon_mail_md` |
| minus | `icon_minus_sm`, `icon_minus_md`, `icon_minus_lg` |
| more dots | `icon_more_dots_sm`, `icon_more_dots_md` |
| not available | `icon_not_available_sm`, `icon_not_available_md` |
| notification | `icon_notification_sm`, `icon_notification_md` |
| on request | `icon_on_request_sm`, `icon_on_request_md` |
| phone incoming | `icon_phone_in_sm`, `icon_phone_in_md` |
| phone | `icon_phone_sm`, `icon_phone_md` |
| pin | `icon_pin_sm`, `icon_pin_md` |
| plus | `icon_plus_sm`, `icon_plus_md`, `icon_plus_lg` |
| present | `icon_present_sm`, `icon_present_md` |
| preview | `icon_preview_sm`, `icon_preview_md` |
| price view | `icon_price_view_sm`, `icon_price_view_md` |
| print | `icon_print_sm` |
| question | `icon_question_sm`, `icon_question_md` |
| rating star | `icon_rating_star_sm`, `icon_rating_star_md` |
| refresh | `icon_refresh_sm`, `icon_refresh_md` |
| sale | `icon_sale_sm`, `icon_sale_md` |
| search | `icon_search_sm`, `icon_search_md` |
| select | `icon_select_sm`, `icon_select_md` |
| share | `icon_share_sm`, `icon_share_md` |
| simple view | `icon_simple_view_sm`, `icon_simple_view_md` |
| sort ascending | `icon_sort_asc_sm`, `icon_sort_asc_md` |
| sort descending | `icon_sort_desc_sm`, `icon_sort_desc_md` |
| sort | `icon_sort_sm`, `icon_sort_md` |
| thumbs view | `icon_thumbs_view_sm`, `icon_thumbs_view_md` |
| time | `icon_time_sm`, `icon_time_md` |
| user | `icon_user_sm`, `icon_user_md` |
| warning | `icon_warning_sm`, `icon_warning_md` |
| zoom | `icon_zoom_sm`, `icon_zoom_md` |

## Фактические размеры областей

- 71 вложенная SVG-область имеет `20 × 20`.
- 65 областей имеют `30 × 30`.
- `icon_rating_star_sm` имеет `12 × 12`.
- `icon_rating_star_md` имеет область `500 × 49.54`; внутренний SVG использует `viewBox="0 0 545 54"`. В rating mixin эта маска масштабируется до component token size и повторяется по горизонтали.

Suffix не гарантирует физический размер:

- большинство `_sm` — `20 × 20`, но `icon_rating_star_sm` — `12 × 12`;
- arrow `_md` (`bot`, `first`, `last`, `left`, `right`, `top`) и `icon_cross_md` имеют `20 × 20`;
- остальные обычные `_md` в текущем файле имеют `30 × 30`;
- `_lg` имеют `30 × 30`.

Следовательно, `sm`/`md`/`lg` являются именами вариантов, а не надёжной единицей измерения.

## Дубли и отклонения

Дублирующихся ID нет. При сравнении `InnerXml` вложенных SVG обнаружены пары с одинаковой геометрией:

- `icon_on_request_md` и `icon_time_md`;
- `icon_on_request_sm` и `icon_time_sm`;
- `icon_delivery_courier_sm` и `icon_home_sm`;
- `icon_delivery_sm-1` и `icon_pin_sm`.

Совпадение геометрии не доказывает ошибку: разные семантические ID могут намеренно указывать на одинаковый рисунок. Решение об объединении не принято.

Отклонения именования:

- `icon_delivery_sm-1` использует дефис и числовой suffix после размера;
- `bot` используется вместо полного `bottom`;
- `catalog_comb`, `phone_in`, `price_view`, `thumbs_view` используют сокращённые или предметные имена без отдельной спецификации;
- варианты `help`, `info`, `print` существуют только в `sm`.

## Иконки, на которые ссылаются токены

`tokens/icons.css` объявляет URL custom property для каждого из 138 существующих SVG ID. Поэтому `--icon_arrow_bot_sm`, `--icon_arrow_bot_md`, `--icon_rating_star_sm`, `--icon_rating_star_md`, `--icon_cross_lg` и `--icon_cross_md` теперь разрешаются через этот реестр.

Отсутствуют в SVG и потому не объявлены как URL custom properties:

- `--icon_rating_star_lg`;
- `--icon_site_checkbox`;
- `--icon_site_checkbox_small`.

Переменные `--icon_primary*`, `--icon_accent*` и `--icon_bg_main*` из `new_colors.css` являются цветами иконок, а не ссылками на SVG ID.

## Существующий механизм подключения

Фактически подтверждена только принимающая сторона:

- `icon`, `rating`, `select`, `checkbox`, `color_select` и `popup` используют CSS masks;
- mask source передаётся через `var(--icon_…)` либо динамическую `var(--#{$size}_…_icon)`;
- цвет маски задаётся через `background`/`background-color` на элементе или псевдоэлементе.

`tokens/icons.css` задаёт декларации вида `--icon_cross_md: url("/design-system/sets/1/new.sprite.view.svg#icon_cross_md")`. Sass entrypoint `scss/tokens.scss` встраивает этот файл в результирующий CSS. Корневой путь выбран потому, что относительный путь из `dist/css` к исходному спрайту был бы некорректным; приложение должно публиковать ассеты по пути `/design-system/` либо переопределить URL-переменные при интеграции.

Предполагаемый формат URL-фрагмента следует из `<view id>`, но до появления реального потребителя его браузерная совместимость и поведение при внешнем файле остаются непроверенными.

## Известные ограничения

- Нет fallback для отсутствующей или неподдерживаемой mask image.
- Доступное имя не является частью SVG; его должен обеспечивать HTML-контрол.
- Некоторые paths используют stroke, большинство полагается на исходный fill; при mask-использовании это обычно не влияет на цвет, но визуальный результат не проверен.
- Нет автоматической сверки token references со sprite registry.
- Нет демонстрационной страницы и визуального baseline для 138 ID.
- Браузерная совместимость внешнего SVG fragment view как `mask-image` не проверена визуально.
