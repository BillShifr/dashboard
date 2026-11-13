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
- Релиз только через `scripts/update-production.sh` после зелёного CI точного SHA.
- Автоматический rollback после миграций запрещён.

## Архитектура

- Доменная логика карт/метрик — в `src/domain`, без DOM.
- Payload пресетов валидируется Zod на сервере.
- UI зависит от domain/API, не наоборот.
