# Минимальный visual-QA конвейер

Конвейер реализован для контрольного проекта `projects/fashion-store`. Он не
заменяет оценку дизайнера: техническая исправность, локальная visual-регрессия
и сходство с внешним референсом — разные результаты.

## Что используется

- `playwright` — единственная browser dev dependency; версия зафиксирована в
  `package.json` и lock-файле.
- `scripts/visual-qa/static-server.mjs` — встроенный Node static-server из
  корня репозитория, без нового server package.
- `scripts/visual-qa/fashion-store.spec.mjs` — один контрольный Playwright
  spec.
- `projects/fashion-store/visual-qa.config.mjs` — локальные URL и scope
  контрольного проекта.

Chromium устанавливается командой `npx playwright install chromium` один раз
для среды, где выполняется browser QA.

## Команды

```sh
npm run build
npm run visual:qa:baseline
npm run visual:qa
```

`visual:qa:baseline` создаёт или обновляет ожидаемые снимки. Запускайте её
только после осознанного принятия нового визуального состояния. `visual:qa`
записывает свежие артефакты и сравнивает их с baseline; визуальная разница выше
допуска `0.5%` делает команду неуспешной.

Static-server запускается Playwright автоматически на `127.0.0.1:4173`. Если
такой сервер уже запущен, Playwright использует его; он должен раздавать корень
этого репозитория.

## Артефакты

```text
projects/fashion-store/artifacts/visual-qa/
├── baseline/                  # принятые локальные visual snapshots
├── latest/
│   ├── desktop-1440x900.png
│   ├── mobile-390x844.png
│   ├── desktop-full-page.png
│   ├── reference-*.png        # если URL референса доступен
│   ├── *.json                 # фактический технический результат на viewport
│   └── playwright-report.json
└── test-results/              # диагностические файлы Playwright при fail
```

Каждый JSON разделяет результат на:

- `technical`: console errors, failed/HTTP>=400 resources, broken images и
  horizontal overflow;
- `visualReference`: screenshot внешнего reference той же области либо честный
  статус невозможности. На первом этапе это `capture-only`, а не ложный
  автоматический вывод о pixel-perfect сходстве;
- `regression`: состояние сравнения с сохранённым baseline.

## Ограничения первой версии

- Точный reference diff не автоматизирован: внешний URL может быть динамичным,
  закрытым оверлеем или иметь разные данные. Снимок сохраняется для ручного
  сравнения одной области на одинаковом viewport.
- Проверяются 1440×900, 390×844 и full-page desktop. Матрица 768/1024 остаётся
  обязательной при последующем расширении проекта с navigation/grid/filter,
  но не добавлена в первый минимальный spec.
- Baseline фиксирует регрессии локальной версии, а не доказывает соответствие
  исходному референсу.
