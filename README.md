# Dashboard

Редактор карт Югры и диспансеризации для презентационных материалов ТФОМС.

Продукт разворачивается независимо на `dashboard.tfoms` и не использует код или БД других внутренних систем.

Документация: [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md), [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Локальный запуск

Требуются Node.js 26 и Docker (Postgres 18).

```sh
cp .env.example .env
cp .env.example .env.local
sh scripts/dev-stand.sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Приложение: `http://127.0.0.1:3090`. Локальный seed создаёт `admin` и `editor`; пароль — `INITIAL_ADMIN_PASSWORD`.

Postgres 18: data-volume монтируется в `/var/lib/postgresql` (не `/data`), иначе контейнер падает в restart loop.

Скрипты `db:migrate` / `db:seed` подхватывают `.env` автоматически (`scripts/load-env.ts`).

### Проверки

```sh
npm run verify          # format, lint, typecheck, unit, build
docker start dashboard-postgres
npm run db:migrate && npm run db:seed
npm run test:e2e        # нужен build и Postgres
npx playwright install chromium   # один раз на машине разработчика
```

## Production

Контур как у kanban: GitHub Actions проверяет commit, на portal user timer
`dashboard-autodeploy.timer` вызывает
`CONTAINER_ENGINE=podman sh scripts/update-production.sh` из `$HOME/apps/dashboard`.
Первая установка: `docs/OPERATIONS.md`.

Nginx: `deploy/nginx/dashboard.tfoms.conf` → `127.0.0.1:3090`.
Compose: `compose.prod.yml` (база без порта на хост).

Репозиторий: https://github.com/BillShifr/dashboard (private).
