# Шаблон стилей нового проекта

Новый проект хранит сгенерированные стили отдельно от ручного слоя:

```text
projects/<slug>/
├── styles/
│   ├── project.scss  # генерируемая проектная композиция
│   └── custom.scss   # изменения владельца; генератор не перезаписывает
└── css/
    ├── project.css   # результат project.scss
    └── custom.css    # результат custom.scss
```

В HTML подключайте файлы в порядке: `tokens.css`, `core.css`,
`components.css`, `blocks.css`, затем `css/project.css`, затем `css/custom.css`.
У `custom.scss` нет права заменять отсутствующий контракт дизайн-системы:
такой пробел должен быть отмечен как `EXTEND` или `BLOCKED` до реализации.

Инициализация не перезаписывает существующий файл:

```sh
node scripts/project-styles.mjs init <slug>
node scripts/project-styles.mjs build <slug>
```

`build` компилирует `styles/project.scss` в `css/project.css`, если исходник
существует, и всегда компилирует сохраняемый `styles/custom.scss` в
`css/custom.css` (либо в явно переданный выходной путь).

Для существующего проекта, где `css/custom.css` уже является основным
генерируемым стилем, используйте другой выходной путь, например
`css/custom-overrides.css`, и подключайте его последним. Не мигрируйте и не
очищайте прежний файл без согласования с владельцем.
