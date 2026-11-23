# Dashboard: обязательные правила продукта

## Это боевой продукт

- Dashboard разрабатывается как самостоятельная production-система.
- В UI разрешены только реальные данные из БД и реально работающие операции.
- Запрещены мок-данные, заглушки «скоро» и кнопки без эффекта.
- Нереализованное фиксируется в `docs/PRODUCT_SPEC.md` → «Висяки».

## Локальный Docker-стенд

- Контейнер: `dashboard-postgres`
- Volume: `dashboard_postgres-data`
- Адрес: `127.0.0.1:5436`
- Приложение: `npm run dev` → `127.0.0.1:3090`

Запрещено: `docker compose down -v`, удаление volume, второй Postgres «для проверки».

## Production

- Хост `portal`, каталог `$HOME/apps/dashboard`, DNS `dashboard.tfoms`.
- Релиз только через `scripts/update-production.sh` после зелёного CI точного SHA. На хосте это делает user timer `dashboard-autodeploy.timer` (`deploy/auto-deploy.sh`).
- Production compose: `compose.prod.yml`. Локальный стенд: `compose.yml`.
- Автоматический rollback после миграций запрещён.

## Архитектура

- Доменная логика карт/метрик — в `src/domain`, без DOM.
- Payload пресетов валидируется Zod на сервере.
- UI зависит от domain/API, не наоборот.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
