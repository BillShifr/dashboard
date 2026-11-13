# Roadmap — dashboard.tfoms

## Зафиксировано

- Продукты: территории + диспансеризация
- Persist: серверные пресеты
- Хост: `dashboard.tfoms`
- Стек: Next.js 16, React 19, Postgres 18, Drizzle, Zod, Vitest, Playwright, exceljs
- Ops: по образцу work-calendar (Podman Compose, SHA-образы, ручной `update-production.sh`)
- Порты локально: app `3090`, e2e `3091`, Postgres `127.0.0.1:5436`

## Этапы

### 1. Каркас — сделано

Auth, presets schema, health, login, Docker/compose/nginx, bootstrap-admin, docs.

### 2. Domain — сделано

hex/geo, medical scales, disp metrics/layout/mapShapes, territory scene, shared
glyphs/svg/pdf/png, zod `territory-v1` / `disp-v5`.

### 3. API + UI редактора — сделано

CRUD пресетов + SVG-редактор (geo/hex/med) для обоих kind + серверное сохранение.

### 4. Export — сделано

Pipeline `state → scene → svg → png/pdf` (offline glyphs PT Sans).

### 5. Импорт Excel — сделано

`POST /api/presets/:id/import-excel` (лист «ППЦ объемы»), `restore-reference` из каталога.

### 6. Quality / release — в работе

- [x] Unit (15 тестов), typecheck, lint, build
- [x] E2E сценарий `preset-flow` (login → create → save → PNG) в CI
- [ ] Первый deploy на `portal` (`$HOME/apps/dashboard`)
- [ ] Проверка docker-образов на CI (job `docker`)

## Библиотеки

Используем: Next, React, Zod, Drizzle, postgres.js, Argon2, Vitest, Playwright, exceljs.
Не используем: Leaflet/Mapbox, Chart.js, html2canvas как единственный экспорт.
