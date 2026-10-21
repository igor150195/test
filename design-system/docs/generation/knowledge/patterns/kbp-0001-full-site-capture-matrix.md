---
id: KBP-0001
title: Full-site screenshot matrix with overlapping segments
kind: quality-workflow
status: candidate
scope: universal
platform: neutral
industry: []
page_types: [home, landing]
tags: [visual-qa, responsive, full-page, regression]
requires:
  components: []
  tokens: []
  optional_tokens: []
variants: [first-screen, full-page, overlapping-segments]
data_needed: [page-url, viewport-matrix]
viewports_checked: [1920x1080, 1440x900, 768x1024, 390x844]
evidence:
  implementation: .agents/skills/visual-qa/SKILL.md
  technical_check: projects/test-site/artifacts/visual-qa/reference-restoration-2026-10-16/final-matrix/project-pass-3/results.json
  visual_check: projects/test-site/docs/qa-report.md
  projects: [test-site]
  limitations: [one project, technical evidence contains MP4 net::ERR_ABORTED despite readyState 4]
review_after: 2027-01-16
supersedes: []
applies_when: [страница длиннее одного viewport, доступен Chromium]
not_when: [нет доступа к браузеру]
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
