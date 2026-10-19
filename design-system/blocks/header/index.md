# Header

`.ds-header` — нейтральная шапка сайта с логотипом, поиском и пользовательскими
действиями. Она использует `.ds-input`, `.ds-icon-button` и `.ds-counter`, но
не зависит от Shop2, Remodal, `gr-*` или legacy header-разметки.

Перед `blocks.css` подключите `core.css` и `components.css`.

## HTML-структура

```html
<header class="ds-header">
    <div class="ds-header__inner">
        <a class="ds-header__logo" href="/" aria-label="На главную">Brand</a>

        <form class="ds-header__search" action="/search/" method="get" role="search">
            <label class="visually-hidden" for="site-search">Поиск по сайту</label>
            <input
                class="ds-input"
                id="site-search"
                name="q"
                type="text"
                placeholder="Поиск"
            >
        </form>

        <nav class="ds-header__actions" aria-label="Пользовательские действия">
            <a class="ds-icon-button ds-icon-button--sm" href="/account/" aria-label="Личный кабинет">
                <span class="ds-icon" style="--ds-icon: var(--icon_user_sm)" aria-hidden="true"></span>
            </a>
            <a class="ds-icon-button ds-icon-button--sm" href="/cart/" aria-label="Корзина">
                <span class="ds-icon" style="--ds-icon: var(--icon_cart_sm)" aria-hidden="true"></span>
            </a>
        </nav>
    </div>
</header>
```

Форма поиска, навигация действий и отдельные кнопки необязательны. Для
декоративного счётчика рядом с кнопкой используйте `.ds-counter`; обеспечьте
доступное имя ссылки, включающее количество, если оно важно пользователю.

На mobile поисковая форма переносится на вторую строку. У action-кнопок
обязательно есть `aria-label`, поскольку в них отображается только иконка.
