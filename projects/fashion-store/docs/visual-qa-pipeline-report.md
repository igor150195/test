# Прогон минимального visual-QA конвейера

Дата фактического прогона: 2026-10-15. Контрольный проект:
`projects/fashion-store`.

## Выполненные команды

```text
npm run build
npm run visual:qa:baseline
npm run visual:qa
npm run check:sass
```

`npm run build` и `npm run check:sass` завершились успешно. Sass вывел
известные legacy deprecation warnings для `@import` и slash-division; новых
compile errors не возникло.

`visual:qa:baseline` создал baseline. Повторный `visual:qa` выполнил три
Playwright проверки и завершился с результатом `3 passed`.

## Сохранённые артефакты

| Вид | Текущий capture | Baseline |
|---|---|---|
| Desktop first screen, 1440×900 | `artifacts/visual-qa/latest/desktop-1440x900.png` | `artifacts/visual-qa/baseline/desktop-1440x900.png` |
| Mobile first screen, 390×844 | `artifacts/visual-qa/latest/mobile-390x844.png` | `artifacts/visual-qa/baseline/mobile-390x844.png` |
| Desktop full page | `artifacts/visual-qa/latest/desktop-full-page.png` | `artifacts/visual-qa/baseline/desktop-full-page.png` |
| Reference first screens | `artifacts/visual-qa/latest/reference-desktop-1440x900.png`, `reference-mobile-390x844.png` | — |

Фактические machine-readable результаты находятся рядом: `latest/*.json` и
`latest/playwright-report.json`.

## Технические ошибки

| Проверка | Desktop | Mobile | Full page |
|---|---:|---:|---:|
| Console errors | 0 | 0 | 0 |
| Failed requests | 0 | 0 | 0 |
| HTTP resource responses >=400 | 0 | 0 | 0 |
| Broken images | 0 | 0 | 0 |
| Horizontal overflow | нет, 1440/1440 | нет, 390/390 | нет, 1440/1440 |

Это подтверждает техническую исправность проверенной страницы на трёх capture
targets. Это не является доказательством визуального сходства с референсом.

## Визуальные расхождения с референсом

Reference screenshots получены на тех же first-screen viewport и сохранены,
но initial pipeline намеренно имеет статус `capture-only`: он не строит ложный
pixel diff для динамической внешней страницы с демо-оверлеем. Визуальные
расхождения следует оценивать вручную по паре снимков. Уже известные замечания
о hierarchy header и hero зафиксированы в [generator review](generator-review.md).

Полная страница референса не сравнивалась: нижнюю часть внешнего сайта закрывает
демо-оверлей. Поэтому локальный full-page capture используется для внутренней
регрессии и целостности страницы, не для заявления о точности копии.

## Регрессии относительно предыдущей версии

| Этап | Результат |
|---|---|
| Создание baseline | Созданы три принятых local snapshot. |
| Повторный прогон без изменений | Все три screenshot comparisons прошли в пределах `maxDiffPixelRatio: 0.005`. |

Следовательно, между baseline и повторным прогоном не обнаружено локальных
визуальных регрессий. Baseline не оценивает соответствие reference и должен
обновляться только после осознанного принятия нового результата.

## Ограничения

- В этой минимальной версии не реализован automated pixel diff с внешним
  reference: его контент может быть динамичным, отличаться данными или быть
  закрыт оверлеем.
- Проверяются 1440×900, 390×844 и desktop full page. Для страниц с меню,
  фильтрами или сложной grid-навигацией следующий этап должен добавить 768 и
  1024px как отдельные capture targets.
- Проверка охватывает одну страницу контрольного проекта. Новый проект должен
  получить собственный project-local config и baseline, а не использовать этот.
