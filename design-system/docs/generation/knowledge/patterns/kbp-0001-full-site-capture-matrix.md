---
id: KBP-0001
title: Full-site screenshot matrix with overlapping segments
category: quality-workflow
tags: [visual-qa, responsive, full-page, regression]
status: candidate
implementation: .agents/skills/visual-qa/SKILL.md
examples:
  - projects/test-site/artifacts/visual-qa/reference-restoration-2026-10-16/final-matrix/project-pass-3
  - projects/test-site/docs/qa-report.md
tokens: []
components: []
viewports: [1920x1080, 1440x900, 768x1024, 390x844]
technical_check: projects/test-site/artifacts/visual-qa/reference-restoration-2026-10-16/final-matrix/project-pass-3/results.json
visual_check: projects/test-site/docs/qa-report.md
---

## Назначение

Проверять длинную страницу от header до footer сочетанием первого экрана,
full-page изображения и перекрывающихся viewport-сегментов. Это обнаруживает
проблемы в нижних секциях, которые не видны на уменьшенном full-page снимке.

## Подтверждение

В `test-site` сохранены все три типа снимков для четырёх viewport; отчёт
подтверждает отсутствие broken images, ошибок консоли и горизонтального
переполнения. Решение пока `candidate`: проверено на одной странице, а не на
нескольких независимых проектах.

## Ограничения и условия отказа

Не применять как доказательство сходства с референсом без его равнозначных
снимков. Нужен браузер, способный сохранять PNG. Динамические ресурсы требуют
отдельно документировать ошибки загрузки, даже если screenshot выглядит верно.
