# Эксплуатация Dashboard

Контур как у kanban: rootless Podman на `portal`, Nginx только на localhost, выпуск после зелёного CI `main`.

## Контур

- приложение: `http://dashboard.tfoms` → Nginx:80 → `127.0.0.1:3090`;
- каталог: `$HOME/apps/dashboard`;
- секреты: `$HOME/apps/dashboard/.env` (права `600`, из `.env.production.example`);
- compose: `compose.prod.yml` (Postgres без порта на хост);
- volume: `dashboard_postgres-data`;
- образы: `dashboard:<git-sha>`, `dashboard-migrator:<git-sha>`;
- user units: `dashboard.service`, `dashboard-autodeploy.timer` (каждые 5 минут).

Локальная разработка по-прежнему использует `compose.yml` и порт `5436`.

## Подготовка хоста

1. `git clone git@github.com:BillShifr/dashboard.git "$HOME/apps/dashboard"`
2. `cp .env.production.example .env` и подставить секреты, `chmod 600 .env`
3. Nginx: `deploy/nginx/dashboard.tfoms.conf`, DNS `dashboard.tfoms`
4. `sudo loginctl enable-linger "$USER"`
5. Первый выпуск вручную, затем установка таймера:

```sh
cd "$HOME/apps/dashboard"
CONTAINER_ENGINE=podman sh scripts/update-production.sh
sh deploy/install-autodeploy.sh
```

`install-autodeploy.sh` требует чистый `main` в `$HOME/apps/dashboard`.

## Обновление

Таймер сам подтягивает `origin/main`, если CI этого SHA зелёный, и вызывает `scripts/update-production.sh`. Ручной запуск тот же:

```sh
cd "$HOME/apps/dashboard"
CONTAINER_ENGINE=podman sh scripts/update-production.sh
```

Откат приложения после уже применённых миграций не выполняется. Проверка: `curl --fail http://127.0.0.1:3090/api/health`.

## Патчи, ноябрь 2026

Этот сервис не исполняет PHP и не проксирует FastCGI. Список PHP (в том числе CVE-2026-129289, request smuggling в PHP-FPM) к Dashboard не относится. На том же Nginx другие сайты с `fastcgi_keep_conn on` нужно обновить отдельно: PHP 8.5.13 / 8.4.28 / 8.3.37 / 8.2.36.

Пакет Nginx на `portal` должен быть не ниже 1.30.7 или 1.31.9 (советники nginx.org от 18.11.2026, включая CVE-2026-123007). Конфиг `dashboard.tfoms.conf` слушает только HTTP/1.1 на порту 80, без `alias`/`try_files`, HTTP/2, HTTP/3 и почтового модуля.

Приложение: Next.js не ниже 16.4.5 (релиз безопасности 3.11.2026). В проекте нет Cache Components и `'use cache'`.
