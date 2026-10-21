---
id: DSB-footer
kind: block
maturity: stable
platform: neutral
purpose: site footer navigation and legal information
classes: [.ds-footer, .ds-footer__inner, .ds-footer__columns, .ds-footer__title, .ds-footer__list, .ds-footer__link, .ds-footer__bottom, .ds-footer__copyright, .ds-footer__socials]
structural_classes: [.ds-footer__column]
variants: []
requires:
  components: [.ds-icon, .ds-icon-button]
public_tokens: []
optional_tokens: []
a11y: [semantic-landmark, accessible-name, decorative-icon-hidden]
viewports_verified: []
examples: [design-system/templates/home.html, design-system/templates/shop.html]
---

# Footer

`.ds-footer` — нейтральный подвал сайта с навигационными колонками, копирайтом
и необязательными социальными ссылками. Блок не использует Shop2, Remodal,
`gr-*` или legacy footer-разметку.

Перед `blocks.css` подключите `core.css` и `components.css`.

## HTML-структура

```html
<footer class="ds-footer">
    <div class="ds-footer__inner">
        <nav class="ds-footer__columns" aria-label="Навигация в подвале">
            <section class="ds-footer__column" aria-labelledby="footer-catalog">
                <h2 class="ds-footer__title" id="footer-catalog">Каталог</h2>
                <ul class="ds-footer__list">
                    <li><a class="ds-footer__link" href="/catalog/">Все товары</a></li>
                </ul>
            </section>
            <section class="ds-footer__column" aria-labelledby="footer-help">
                <h2 class="ds-footer__title" id="footer-help">Помощь</h2>
                <ul class="ds-footer__list">
                    <li><a class="ds-footer__link" href="/delivery/">Доставка</a></li>
                </ul>
            </section>
        </nav>

        <div class="ds-footer__bottom">
            <small class="ds-footer__copyright">© 2026 Brand</small>
            <nav class="ds-footer__socials" aria-label="Социальные сети">
                <a class="ds-icon-button ds-icon-button--sm" href="https://example.com" aria-label="Социальная сеть">
                    <span class="ds-icon" style="--ds-icon: var(--icon_share_sm)" aria-hidden="true"></span>
                </a>
            </nav>
        </div>
    </div>
</footer>
```

Колонки и социальные ссылки необязательны. Ссылки должны вести на реальные
адреса; подменять отсутствующую иконку текстовым символом или эмодзи не следует.
`aria-label` необходим для social link, если внутри него только иконка.

`__columns` строится на CSS Grid и самостоятельно перестраивается под доступную
ширину; список не должен содержать интерактивные элементы внутри ссылки.
