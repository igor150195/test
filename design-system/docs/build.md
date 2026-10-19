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

Каталог `dist/` является генерируемым и не смешивается с исходниками.

## Границы проверки

- `tokens.scss`, `core.scss` и `legacy-platform.scss` содержат runtime token layer; объявления миксинов сами по себе CSS не генерируют.
- `check.scss` действительно разворачивает все миксины и тем самым проверяет вложенные `@include`, Sass-выражения и генерируемые селекторы.
- Неопределённые CSS custom properties не являются ошибкой компилятора Sass. Они остаются отдельными runtime-блокерами, перечисленными в `tokens.md` и `icons.md`.
- Используется legacy `@import`, поскольку миграция на `@use` не входит в текущий этап. Dart Sass может выводить соответствующие deprecation warnings; это предупреждения, а не синтаксические ошибки текущих файлов.
