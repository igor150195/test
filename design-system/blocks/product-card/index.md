---
id: DSB-product-card
kind: block
maturity: stable
platform: neutral
purpose: commerce product cards
classes: [.ds-product-card, .ds-product-card__media, .ds-product-card__image-link, .ds-product-card__image, .ds-product-card__flags, .ds-product-card__favorite, .ds-product-card__body, .ds-product-card__title, .ds-product-card__title-link, .ds-product-card__meta, .ds-product-card__actions, .ds-product-card__add, .ds-product-card__grid]
structural_classes: []
variants: []
requires:
  components: [.ds-button, .ds-icon-button, .ds-price, .ds-rating, .ds-badge, .ds-flag]
public_tokens: [--ds-container-max, --ds-grid-gap, --ds-content-gap]
optional_tokens: []
a11y: [alternative-text, accessible-name, decorative-icon-hidden, interactive-nesting, semantic-heading]
viewports_verified: []
examples: [design-system/templates/home.html, design-system/templates/shop.html]
---

# Product Card

`.ds-product-card` — нейтральный составной блок товара. Он использует
публичные API ранее созданных `.ds-badge`/`.ds-flag`, `.ds-rating`,
`.ds-price`, `.ds-button` и `.ds-icon-button`, но не зависит от Shop2,
Remodal, `gr-*` или legacy product mixins.

Перед `blocks.css` подключите `core.css` и `components.css`.

## HTML-структура

```html
<article class="ds-product-card">
    <div class="ds-product-card__media">
        <a class="ds-product-card__image-link" href="/products/example/">
            <img
                class="ds-product-card__image"
                src="/images/example.jpg"
                alt="Название товара"
            >
        </a>

        <div class="ds-product-card__flags" aria-label="Метки товара">
            <span class="ds-flag ds-flag--new">Новинка</span>
            <span class="ds-flag ds-flag--sale">−25%</span>
        </div>

        <button
            class="ds-icon-button ds-icon-button--sm ds-product-card__favorite"
            type="button"
            aria-label="Добавить в избранное"
        >
            <span
                class="ds-icon"
                style="--ds-icon: var(--icon_favorite_add_sm)"
                aria-hidden="true"
            ></span>
        </button>
    </div>

    <div class="ds-product-card__body">
        <h3 class="ds-product-card__title">
            <a class="ds-product-card__title-link" href="/products/example/">
                Название товара
            </a>
        </h3>

        <div class="ds-product-card__meta">
            <span class="ds-rating" role="img" aria-label="Рейтинг: 4 из 5">
                <span class="ds-rating__stars" aria-hidden="true">
                    <span class="ds-rating__fill" style="width: 80%"></span>
                </span>
            </span>
        </div>

        <div class="ds-price">
            <data class="ds-price__current" value="1490">1&nbsp;490&nbsp;₽</data>
            <del class="ds-price__old"><data value="1990">1&nbsp;990&nbsp;₽</data></del>
        </div>

        <div class="ds-product-card__actions">
            <button class="ds-button ds-button--primary ds-product-card__add" type="button">
                В корзину
            </button>
        </div>
    </div>
</article>
```

`article` можно заменить на другой семантически подходящий контейнер. Не
оборачивайте всю карточку в ссылку, если внутри есть кнопки: интерактивные
элементы нельзя вкладывать друг в друга. У изображения и заголовка могут быть
отдельные ссылки на тот же товар.

`__flags`, `__favorite`, `__meta`, старая цена и кнопки действий необязательны.
При отсутствии изображения оставьте область `__media` и добавьте осмысленный
placeholder на уровне проекта; блок не подменяет отсутствующие ресурсы.

## Сетка карточек

`.ds-product-card__grid` — необязательный контейнер списка карточек. Он
использует CSS Grid, `--ds-container-max` и `--ds-grid-gap`; это не обязательная
вложенность для отдельной `.ds-product-card`. Внутренняя область
`__body` использует `--ds-content-gap` одновременно для собственного `gap` и
padding.

Проект может переопределить layout-токены после `tokens.css`, не меняя исходники
дизайн-системы:

```css
.my-project {
    --ds-container-max: 1280px;
    --ds-grid-gap: var(--ds-space-8);
}
```
