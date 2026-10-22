# Анализ референса: pilot-1

## 1. Источник и уверенность

- URL: `https://ochaka.presslayouts.com/`.
- Дата анализа: 2026-10-22.
- Входные данные: реально открытая главная страница в браузере, desktop
  viewport; DOM accessibility tree и список загруженных изображений.
- Язык: английский (`lang="en-US"` у референса). Пользовательский выбор
  `ru | en` не был уточнён, поэтому это рабочее допущение только для анализа.
- Недоступное: мобильная компоновка, состояния открытого меню/корзины и
  авторизация не проверялись. Внешние изображения референса не считаются
  разрешёнными для копирования: в пилоте допустимы только локальные
  `placeholder`-ресурсы, если это будет отдельно одобрено.
- Уверенность: средняя для desktop структуры; низкая для mobile и поведения.

## 2. Назначение и структура

Тип — fashion e-commerce. Основные наблюдаемые действия: переход в каталог,
открытие товара, поиск, wishlist, account и cart. Референс использует
англоязычные демонстрационные товарные и editorial-тексты; их нельзя выдавать
за факты проекта.

| Порядок | Секция | Наблюдаемое содержимое | Доказательство |
|---:|---|---|---|
| 1 | Utility/header | promo strip, Help & FAQs, Factory, language/currency, logo, primary nav, search/account/wishlist/cart | видимый desktop и DOM |
| 2 | Hero | 3 слайда `Fall winter collection`, крупная fashion-фотография и CTA | DOM, hero images `cls-header-*` |
| 3 | Promo categories | три image-led карточки Clothing / Trending / Dresses | DOM |
| 4 | New Arrivals | tabs, 8 товарных карточек, price, colour swatches, sale/hot labels | DOM |
| 5 | Shop this look | lookbook-banner и 3 товара | DOM |
| 6 | Customer reviews | повторяемые testimonial/product пары | DOM |
| 7 | Read our blog | 4 editorial-карточки статей | DOM |
| 8 | Instagram | заголовок Follow Us On Instagram и social promo | DOM |
| 9 | Footer | Our services, Useful links, Newsletter, secondary product widgets | DOM headings |

## 3. Первый экран и визуальный язык

- Верхняя promo-полоса — чёрная, с мелким светлым текстом и utility links.
- Основная шапка — белая, широкий логотип слева, навигация по центру, иконки
  справа. На видимом desktop у cart есть красный счётчик.
- Hero — почти белый полноширинный фон, текст расположен слева и частично
  выходит за верхний край screenshot; крупный портрет модели занимает правую
  половину. Точная высота и текстовая привязка не измерялись.
- Визуальный характер: editorial, монохромный, просторный, с тонкими
  границами и акцентом красного только на счётчике/price states.
- Контентные фотографии являются существенной частью сходства. Без
  лицензированных изображений или согласованного placeholder-объёма нельзя
  заявлять визуальную реплику референса.

## 4. Сетка, адаптивность и интерактивность

- На desktop New Arrivals показывает много колонок товарных карточек;
  точное число меняется с шириной и требует отдельной mobile-проверки.
- Наблюдаемы: carousel hero, product tabs, mobile menu, search popup,
  mini-cart, wishlist и account links. Их рабочее поведение не подтверждено
  для нового статического сайта.
- Нативные ссылки, semantic nav и форма поиска возможны без JS. Slider,
  tabs, drawers и cart behaviour не имеют подтверждённого нейтрального
  контракта дизайн-системы.

## 5. Проверенные системные решения

| Нужда | Проверенный API | Вывод |
|---|---|---|
| Header actions/search | `DSB-header`, `DSC-icon-button`, `DSC-icon`, `DSC-counter`, `DSC-form` | Частично применим, но не покрывает utility bar и primary nav layout. |
| Product cards | `DSB-product-card`, `DSC-price`, `DSC-badge`, `DSC-rating`, `DSC-button` | Подходит для статичной товарной сетки. |
| Footer/newsletter | `DSB-footer`, `DSC-form`, `DSC-button` | Можно собрать из существующих контрактов. |
| Full-site QA | `KBP-0001` candidate | Только материал для исследования; не готовое решение. |
| Hero slider, tabs, lookbook, testimonials, blog cards, Instagram feed | catalog search не нашёл записи | Требуют EXTEND/BLOCKED и решения владельца. |

## 6. Assets

Референс загружает внешние editorial/product изображения WordPress CDN, например
`cls-header-1.webp`, `home-fashion-1.webp`. Их права не подтверждены и они не
будут копироваться. Пользователь допускает только локальные placeholder-
ресурсы; это ограничивает визуальную точность image-led секций.

## 7. План visual QA после одобрения

После согласованной реализации проверять 1920×1080, 1440×900, 768×1024 и
390×844; для каждого — first-screen, full-page и перекрывающиеся сегменты.
Сравнение с референсом будет ограничено лицензированными/placeholder assets и
не должно называться точным совпадением без разрешённых аналогов изображений.
