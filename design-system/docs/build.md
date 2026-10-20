# Минимальная сборка Sass

## Назначение

Сборка проверяет синтаксис существующих SCSS-файлов и явные зависимости между миксинами. Она не создаёт компоненты и не проверяет наличие runtime CSS custom properties, шрифтов, SVG URL-переменных или HTML внешних платформ.

## Требования и установка

Требуются Node.js и npm. Единственная dev dependency — Dart Sass (`sass`), зафиксированный в `package.json` и `package-lock.json`.

Для локальной визуальной проверки также используется `playwright@1.64.1`.
В проверенной среде ему соответствует установленный browser revision
`chromium-1248` в стандартном каталоге Playwright. Это revision пакета
Playwright, а не обещание наличия браузера в каждой среде: его присутствие
нужно проверять перед запуском visual QA через `npx playwright install --list`.

```sh
npm ci
```

Для первичной установки без lock-файла использовалась команда:

```sh
npm install --save-dev --save-exact sass
```

## Entry points

- `design-system/scss/tokens.scss` встраивает CSS-токены в порядке: colors, fonts, sizes, icons.
- `design-system/scss/core.scss` импортирует runtime token layer и только те исходные SCSS-файлы, которые целиком содержат Core candidates согласно `mixins.md`.
- `design-system/scss/legacy-platform.scss` импортирует полный текущий набор. Смешанные файлы `_form_elements.scss` и `_shop.scss` находятся здесь, потому что их нельзя разделить без изменения существующих исходников.
- `design-system/scss/check.scss` вызывает все 39 миксинов с параметрами, подтверждёнными текущими токенами и ветками SCSS. Селекторы `.__sass-check-*` являются только fixtures проверки.

`_popup.scss` должен подключаться после `icon_button`, `icon` и `popup_title`: он вызывает эти миксины внутри `popup`.

## Команды

```sh
npm run build
npm run build:sass:core
npm run build:sass:legacy
npm run check:sass
npm run dev
npm run project:styles -- init <slug>
npm run project:styles -- build <slug>
npm run test:project-styles
npm run check:docs
npm run check:tokens
npm run check:project -- <slug>
npm run check:assets -- <slug>
npm run site:build -- <slug>
npm run check:site -- <slug>
npm run test:assets
npm run qa -- <slug>
npm run check:compliance -- <slug>
```

- `build`/`build:sass` компилирует все entrypoint-файлы из `design-system/scss/` в `dist/css/` с source maps.
- `build:sass:core` и `build:sass:legacy` позволяют проверить слои отдельно.
- `check:sass` компилирует smoke fixture в `dist/check/check.css` без source map.
- `dev` следит за `design-system/scss/` и автоматически пересобирает `dist/css/`.
- `project:styles -- init <slug>` создаёт `projects/<slug>/styles/custom.scss`
  только при отсутствии. Повторный запуск сохраняет файл владельца без
  изменений.
- `project:styles -- build <slug>` компилирует `styles/project.scss` в
  `css/project.css`, если исходник существует, и `styles/custom.scss` в
  `projects/<slug>/css/custom.css`. Если это имя уже занято сгенерированным
  legacy-проектом, передайте третий аргумент с отдельным путём, например
  `css/custom-overrides.css`, и подключите результат последним.
- `test:project-styles` проверяет, что повторная инициализация не стирает
  ручной комментарий/правило и что скомпилированный CSS содержит это правило.
- `check:project` проверяет `projects/<slug>/project.json` по локальной
  JSON-схеме, включая полный Git SHA версий и явных владельцев файлов.
- `check:assets` проверяет `assets.json`, ресурсы в HTML/CSS и внешние HTTP(S)
  ссылки в существующей production-сборке. `data:` URI и XML namespace не
  считаются внешними ресурсами. Подтверждённые долги выводятся предупреждениями
  из `scripts/known-asset-issues.json`; новые нарушения завершают команду с
  ненулевым кодом.
- `site:build` требует собранный корневой `dist/css/`, строго обрабатывает
  ожидаемые подключения таблиц стилей, создаёт изолированный
  `projects/<slug>/dist/` и проверяет наличие объявленных локальных ресурсов.
  Он переносит SVG-спрайт и меняет в итоговых CSS ровно 138 ссылок токенов с
  `/design-system/sets/1/` на относительный путь. Повторные запуски с теми же
  исходниками детерминированы.
- `check:site` раздаёт проектный `dist/` из `/some/path/` и фиксирует HTTP
  запросы к локальным HTML/CSS ресурсам с кодом 400 и выше. Это техническая
  проверка путей, не визуальная QA.
- `qa` требует уже собранный `projects/<slug>/dist/`. Он запускает матрицу
  viewport 1920×1080, 1440×900, 768×1024 и 390×844 для страниц из
  `project.json`, сохраняет снимки и программные результаты в
  `projects/<slug>/artifacts/qa/latest/`. Флаг `--run-id <id>` сохраняет
  отдельный архивный прогон. Проверка не заменяет экспертное сравнение с
  референсом; результаты содержат отдельные `technical` и `expert` части.
  При отсутствии Chromium команда завершает работу контролируемым
  `not-run` с причиной. Проверенная ревизия Playwright Chromium —
  `chromium-1248`; фактическая версия фиксируется в `results.json`.
  Если Chromium доступен, QA также сохраняет результат `@axe-core/playwright`
  в `technical.a11y`, включая `incomplete`: такие проверки не считаются
  пройденными. Это отдельный отчёт о нарушениях доступности и пока не меняет
  итоговый технический статус. В `strict` critical/serious findings — ошибки
  внутри отчёта, в `legacy` — предупреждения; moderate/minor — предупреждения
  в обоих режимах. Известный дефект общего `.ds-*` контракта фиксируется в
  `scripts/known-a11y-issues.json`, а не исправляется автоматически.
- `check:compliance` проверяет обязательные документы проекта и записи
  `ds-section` из `docs/token-map.md`: существование указанных файлов,
  уникальность ID, связи с базой знаний, покрытие top-level секций и
  неутверждённые `EXTEND`/`BLOCKED`. Известные legacy-долги выводятся как
  предупреждения, новые нарушения завершают команду с ненулевым кодом.

Каталог `dist/` является генерируемым и не смешивается с исходниками.

## Границы проверки

- `tokens.scss`, `core.scss` и `legacy-platform.scss` содержат runtime token layer; объявления миксинов сами по себе CSS не генерируют.
- `check.scss` действительно разворачивает все миксины и тем самым проверяет вложенные `@include`, Sass-выражения и генерируемые селекторы.
- Неопределённые CSS custom properties не являются ошибкой компилятора Sass. Они остаются отдельными runtime-блокерами, перечисленными в `tokens.md` и `icons.md`.
- `site:build` и `check:site` не могут сделать поставку успешной при известном
  дефекте общего токена, который указывает на отсутствующий файл, или при
  отсутствующем проектном ресурсе. Такие ошибки следует исправлять в их
  владельце либо отдельно согласовывать как известный долг.
- Используется legacy `@import`, поскольку миграция на `@use` не входит в текущий этап. Dart Sass может выводить соответствующие deprecation warnings; это предупреждения, а не синтаксические ошибки текущих файлов.
