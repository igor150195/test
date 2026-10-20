# Token map — test-site

Проект не добавляет и не переопределяет глобальные токены дизайн-системы. Его отличающаяся от нейтральной DS палитра и геометрия изолированы в `projects/test-site/css/custom.css`.

| Роль | Фактический источник | Где применяется |
|---|---|---|
| Основной шрифт | публичный `--font1` из `tokens.css` | весь текст проекта |
| Кнопки | `.ds-button` и его состояния из `components.css` | CTA hero и вакансий |
| Базовый footer | `.ds-footer` из `blocks.css` | каркас большого footer |
| Внешние отступы | `--ds-page-gutter` | контейнеры на узких экранах |
| Интервалы секций | `--ds-section-space` | вертикальный ритм секций |
| Проектная палитра | локальные `--primary`, `--accent`, `--bg_main`, `--on_bg_main`, `--tutu-card` | только `custom.css` |
| Проектная геометрия | локальные `--site_width`, `--tutu-radius` | максимальная ширина и скругления макета |

`--primary` и другие локальные имена не являются контрактом общей дизайн-системы. Компонентные переменные кнопок не используются для отступов блоков и секций.

## Повторно используемые классы DS

- `.ds-button`, `.ds-button--accent`, `.ds-button--white`;
- `.ds-footer`, `.ds-footer__inner`, `.ds-footer__columns`, `.ds-footer__bottom`, `.ds-footer__link`;
- `.visually-hidden` для доступных подписей.

Новых SCSS-миксинов, глобальных иконок, CSS-токенов и изменений существующих компонентов нет.

## Ретроспективные статусы секций

Статусы опираются на `reference-analysis.md`, `page-blueprint.md` и
`design-system-gap-report.md`; непроверенные секции не получают искусственный
статус.

```ds-section
{
    "id": "career-directions-tabs",
    "status": "EXTEND",
    "decision": "pending",
    "html_selector": ".tutu-directions__switcher",
    "local_selectors": [".tutu-direction-tabs"],
    "local_files": ["css/custom.css"],
    "ds_sources": [
        "design-system/components/button/index.md",
        "design-system/components/form/index.md"
    ],
    "knowledge_ids": []
}
```

`html_selector` подтверждён в `index.html`. Это pending `EXTEND`: tabs/media
локально реализованы до политики, поэтому compliance должен фиксировать
известное нарушение, а не считать секцию переиспользуемым API.

```ds-section
{
    "id": "site-footer",
    "status": "REUSE",
    "html_selector": ".tutu-footer",
    "local_selectors": [".tutu-footer"],
    "local_files": ["css/custom.css"],
    "ds_sources": ["design-system/blocks/footer/index.md"],
    "knowledge_ids": []
}
```

Hero, показатели, форматы работы, преимущества, ценности, карточки людей и
вакансии остаются «не определено»: существующие документы описывают их
композицию, но не доказывают применимость системного контракта.
