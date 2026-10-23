# Контрольные испытания генератора сайтов

Дата фиксации исходного состояния: 2026-10-15. Этот набор измеряет качество
генератора до следующих системных изменений. Он не считает первый output
правильным только потому, что он был сохранён как screenshot baseline.

## Правила сравнения

1. Baseline local screenshot служит только для поиска регрессии между версиями
   генератора. Он не является доказательством сходства с внешним референсом.
2. Reference сравнивается только в одинаковом viewport и в области, доступной
   на source page. Закрытый оверлеем или недоступный контент не оценивается как
   точная реплика.
3. До принятия нового baseline сначала запускается сравнение со старым; затем
   visual differences и технические результаты разбираются вручную.
4. Незавершённый case явно имеет статус `not-run`, а не нулевой балл и не
   «успешный» результат.

## Общие настройки испытаний

| Параметр | Значение |
|---|---|
| Desktop first screen | 1440 × 900 |
| Mobile first screen | 390 × 844 |
| Полная страница | desktop 1440px width |
| Техническая проверка | console errors, failed/HTTP >=400 resources, broken images, horizontal overflow |
| Локальная регрессия | Playwright screenshot diff, `maxDiffPixelRatio: 0.005` |
| Сборка перед QA | `npm run build`, `npm run check:sass` |
| Общая инструкция генерации | `.agents/skills/site-from-reference/SKILL.md` |
| Общая инструкция QA | `.agents/skills/visual-qa/SKILL.md` |

## Объективный скорер

`npm run evaluation:score -- <case-id>` читает готовые QA-артефакты и не
запускает браузер. Запись имеет `run_kind`:

- `artifact-baseline` — оценка уже существующего проекта; это единственный
  доступный режим на данном этапе;
- `generation` — требует зафиксированный
  `evaluation/cases/<id>/brief.md`, чистую перегенерацию проекта и будет
  введён отдельным пилотом.

Для artifact baseline измеряются максимум 50 баллов: техническая корректность
15, адаптивность и доступность 15, повторное использование DS 10 и
переносимость 10. Надёжность процесса и скорость/стоимость помечаются
`not-measured`: журнала запусков и сопоставимых данных о расходе нет. Итог
всегда записывается как `score / score_out_of`; сравнение версий допускается
только при одинаковом `measured_metrics` и по проценту, а не по сырым баллам.
Повторная оценка готового проекта после изменения DS записывается отдельным
`artifact-baseline` run: она ссылается на `previous_run` и содержит
`change_note`, не перезаписывая исходный generation run.

Автоматические жёсткие отказы: `site:build`, внешний production-ресурс или
недоступная обязательная страница. Ручные флаги `local_extend` и
`custom_styles_lost` живут в `reviewer_flags`; до проверки человеком они
равны `null`, а не `false`. Скорер их не выводит сам. `evaluated_at` берётся
из времени зафиксированного QA-артефакта; для `prerequisite-fail` без
артефакта он равен `null`. Поле `versions` хранит значение и
`recorded_in_project`: только generator/DS-версии из `project.json` имеют
это значение `true`; `project`-версия определяется Git при подсчёте.
`evaluated_at_commit` и `working_tree_clean` фиксируют Git SHA и состояние
рабочего дерева на момент оценки; они являются входными данными записи, а не
подменой версий, сохранённых в проекте. Артефакты `projects/*/artifacts/`,
`docs/generator/evaluation-results/` и каталоги `dist/` не участвуют в
проверке чистоты. `status_reproducible` равен `false`, если рабочее дерево
нечистое. В технической корректности обычный `warning` стоит 0.5; warning
со всеми находками из known issues, у которых `review_after` в будущем,
считается 1 и получает `known_issue_exempt: true` в разбивке.

## Контрольные cases

### Case A — fashion-store: image-led e-commerce

| Поле | Зафиксированное значение |
|---|---|
| Статус | `baseline-captured` |
| Генерируемый проект | `projects/fashion-store/` |
| Reference | `https://clothing-shop.oml.ru/` |
| Тип | магазин женской одежды; image-led editorial commerce |
| Source evidence | URL доступен; first-screen reference desktop/mobile сохранён в `projects/fashion-store/artifacts/visual-qa/latest/reference-*.png` |
| Настройки генерации | project-local `css/custom.css`, существующие `.ds-header`, `.ds-footer`, `.ds-product-card`, Button, Icon Button, Rating, Price, Flag; без изменения shared CSS |
| Финальные локальные captures | `artifacts/visual-qa/latest/{desktop-1440x900,mobile-390x844,desktop-full-page}.png` |
| Технические результаты | `3/3` Playwright tests passed; console errors 0; failed requests 0; HTTP >=400 0; broken images 0; horizontal overflow 0 |
| История влияющих правок | до capture исправлялись перенос desktop hero, положение header, mobile hero и плотность mobile catalog; затем добавлены генераторные правила header-zone/evidence/asset inventory и воспроизводимый visual QA. Последние правила ещё не были применены повторной генерацией этой страницы. |

#### Исходная оценка качества

| Критерий | Балл / 5 | Подтверждение и ограничения |
|---|---:|---|
| Композиция | 3 | Hero и общая ось близки, но product categories находятся в иной зоне header, а не в utility navigation reference. |
| Изображения | 5 | Используются релевантные изображения; во время QA 10/10 загрузились. |
| Типографика | 3 | Hero похож по характеру, но логотип и часть иерархии отличаются от reference. |
| Отступы и сетки | 3 | Desktop собран, на mobile есть обрезание brand strip и неравномерные переносы category links. |
| Цвета | 4 | Палитра hero близка; full-page editorial transition требует отдельной art-direction оценки. |
| Адаптивность | 3 | Нет horizontal overflow, но search action ведёт к скрытому на mobile полю, а лента брендов клиппится. |
| Повторное использование DS | 4 | Использованы публичные `.ds-*` contracts; локальные overrides не меняют shared styles. |
| **Взвешенный итог** | **70 / 100** | Это честная исходная оценка, а не предыдущая самооценка 87.5/100. |

Найденные проблемы и доказательства: `projects/fashion-store/docs/generator-review.md`.
Технический результат и artifacts: `projects/fashion-store/docs/visual-qa-pipeline-report.md`.

### Case D — house-store: brief-driven premium commerce

| Поле | Зафиксированное значение |
|---|---|
| Статус | `technical-qa-captured; expert-not-reviewed` |
| Генерируемый проект | `projects/house-store/` |
| Reference | `not-applicable` — владелец подтвердил режим `brief` в `project.json`. |
| Тип | минималистичный магазин одежды с фильтрами и каталогом. |
| Настройки генерации | режим `brief`; существующие Header, Footer, Product Card, Form, Price, Rating и Badge; локальный `css/custom.css`. |
| Viewports | 1920 × 1080, 1440 × 900, 768 × 1024, 390 × 844. |
| Финальные screenshots | `projects/house-store/artifacts/qa/latest/screenshots/`; фактический состав фиксирует `results.json`. |
| Технический результат | программная часть зафиксирована в `projects/house-store/artifacts/qa/latest/results.json`; экспертная часть имеет статус `not-reviewed`. |
| История влияющих правок | первый контрольный прогон универсального `npm run qa -- house-store`; не является доказательством сходства с внешним референсом. |

Назначение case: проверять переносимую production-сборку, каталог с фильтрами
и общие DS-контракты в проекте без URL-референса. Повторный запуск начинается
с `npm run site:build -- house-store`, затем `npm run qa -- house-store` и
`npm run check:compliance -- house-store`.

### Case E — test-site: long-form employer promotion

| Поле | Зафиксированное значение |
|---|---|
| Статус | `legacy-prerequisite-fail` |
| Генерируемый проект | `projects/test-site/` |
| Reference | `https://hr.tutu.ru/` (источник указан в проектной документации). |
| Тип | промо-страница работодателя с длинной последовательностью секций. |
| Настройки генерации | legacy проект с локальным `css/custom.css`; в карте есть pending `EXTEND` для вкладок. |
| Viewports | при готовой portable-сборке: 1920 × 1080, 1440 × 900, 768 × 1024, 390 × 844. |
| Финальные screenshots | `not-run`: `site:build` не может собрать проект без заявленного локального ресурса. |
| Технический результат | `prerequisite-fail`; QA намеренно не переходит к исходникам. |
| История влияющих правок | formal DS-first карта фиксирует известный legacy `EXTEND` в `css/custom.css` как долг, а не как утверждённый API. |

Назначение case: проверить многоэкранную промо-композицию после устранения
ресурсной предпосылки. До этого case не используется для экспертной оценки
генератора и не должен подменяться результатами другого проекта.

### Case B — govuk-service: public-service information architecture

| Поле | Зафиксированное значение |
|---|---|
| Статус | `reference-verified; generation-not-run` |
| Планируемый проект | `projects/govuk-service/` |
| Reference | `https://www.gov.uk/` |
| Тип | публичный сервис / информационный портал |
| Source evidence | URL открыт в браузере 2026-10-15; доступны cookie banner, двухуровневая navigation, поисковая форма, текстовые service lists и плотный информационный footer. |
| Генераторные настройки для будущего запуска | `site-from-reference`; priority: native Form/Input, neutral Header/Footer, local project CSS; не переносить визуальный стиль fashion-store. |
| Viewports | 1440 × 900, 390 × 844, full-page desktop; дополнительно 768/1024 из-за menu/search. |
| Финальные screenshots | `not-run` — проект ещё не создан, поэтому файлов нет. |
| Технический результат | `not-run` — нельзя подменять его результатом Case A. |
| Визуальная оценка | `not-run` — reference доступен, но generated output отсутствует. |
| История влияющих генераторных правок | будет начинаться с revision после 2026-10-15; baseline Case A не считается результатом этого case. |

Цель case: проверить text-heavy hierarchy, form/search, service-list density,
контраст и responsive menu без зависимости от изображения как главного носителя
композиции.

### Case C — stripe-saas: high-density SaaS marketing

| Поле | Зафиксированное значение |
|---|---|
| Статус | `reference-verified; generation-not-run` |
| Планируемый проект | `projects/stripe-saas/` |
| Reference | `https://stripe.com/` |
| Тип | SaaS / financial-infrastructure marketing |
| Source evidence | URL открыт в браузере 2026-10-15; наблюдаются тёмный product nav, крупный multi-line hero, CTA pair, logo cloud, bento-card layout, data sections и image/product UI. |
| Генераторные настройки для будущего запуска | `site-from-reference`; использовать existing Core, Button, Icon, Icon Button, Form, Header/Footer и local CSS. Не создавать Stripe-specific global tokens или копировать брендовые assets без отдельного разрешения. |
| Viewports | 1440 × 900, 390 × 844, full-page desktop; дополнительно 768/1024 из-за bento grid/menu. |
| Финальные screenshots | `not-run` — проект ещё не создан, поэтому файлов нет. |
| Технический результат | `not-run`. |
| Визуальная оценка | `not-run`. |
| История влияющих генераторных правок | будет начинаться с revision после 2026-10-15. |

Цель case: проверить complex hero, плотную SaaS-типографику, bento/grid,
двухкнопочные CTA, темные поверхности и product-UI imagery — качества, не
покрытые fashion-store и govuk-service.

## Процедура первичного запуска незавершённого case

1. Создать `projects/<slug>/` через `site-from-reference`, сохранив
   `reference-analysis.md`, `token-map.md`, `page-blueprint.md` и список
   наблюдаемых/inferred секций.
2. Добавить project-local `visual-qa.config.mjs` с `pagePath`, `referenceUrl`
   и режимом reference comparison; не менять `fashion-store` config.
3. Добавить аналогичный Playwright spec или обобщить runner только после того,
   как второй case подтвердит общий контракт. До этого не выдавать один
   fashion-store spec за поддержку всех проектов.
4. Запустить `npm run build`, `npm run check:sass`, `npm run site:build -- <slug>`,
   `npm run qa -- <slug>` и `npm run check:compliance -- <slug>`, затем first
   capture. Для legacy prerequisite-fail зафиксировать причину и не запускать
   QA по исходникам.
   Сначала оценить local/reference pair по семи критериям ниже, и только после
   осознанного принятия запустить baseline update.
5. Сохранить results JSON, local/reference screenshots и список проблем в
   `projects/<slug>/artifacts/visual-qa/` и `projects/<slug>/docs/`.

## Форма оценки каждого case

| Критерий | Что проверять |
|---|---|
| Композиция | порядок секций, hierarchy header, hero proportions, major alignment |
| Изображения | тип assets, crop, focal point, visual weight, broken resources |
| Типографика | hierarchy, line count, widths, weights, line-height |
| Отступы и сетки | container/gutter, grid columns, repeated rhythm, responsive reflow |
| Цвета | surface/foreground contrast, accents, state visibility, palette coherence |
| Адаптивность | 390/768/1024/1440, no overflow, content priorities, reachable actions |
| Повторное использование DS | public tokens/components/blocks used; local overrides; unjustified shared changes |

Каждый критерий получает 0–5 и взвешивается как в
`design-system/docs/generation/visual-qa-checklist.md`. В отчёте обязательно
разделять технические ошибки, visual differences against reference и local
regressions against baseline.

## Повторный запуск после изменения генератора

Для каждого завершённого case:

1. Сохранить revision генератора и перечислить изменённые skills/docs/API.
2. Не обновлять baseline до первого прогона новой версии.
3. Выполнить build, Sass check и Playwright QA с прежними URL/viewport/config.
4. Сравнить новый local capture со старым baseline; отдельно вручную оценить
   same-region reference pair.
5. Зафиксировать изменение семи оценок, технических ошибок и списка проблем.
6. Только если новый результат принят, создать новый versioned baseline, не
   удаляя сведения о предыдущем сравнении.

## Текущий охват и честные ограничения

- Фактический generated baseline существует только для Case A.
- Case B и Case C — отобранные и browser-verified references, но не созданные
  проекты; отсутствие результата помечено `not-run`.
- Поэтому набор уже задаёт воспроизводимую методику и контрастные входы, но не
  является утверждением о качестве генерации для service/SaaS до их реального
  запуска.
