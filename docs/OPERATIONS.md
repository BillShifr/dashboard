# Эксплуатация Dashboard

## Контур

- приложение: `http://dashboard.tfoms` → Nginx:80 → `127.0.0.1:3090`;
- runtime: rootless Podman Compose;
- каталог: `$HOME/apps/dashboard`;
- volume: `dashboard_postgres-data`;
- образы: `dashboard:<git-sha>`, `dashboard-migrator:<git-sha>`.

## Подготовка хоста

1. `git clone git@github.com:BillShifr/dashboard.git "$HOME/apps/dashboard"` (private: SSH deploy key или доступ учётки)
2. Скопировать `.env.production.example` → `.env` (права `600`)
3. Установить `deploy/nginx/dashboard.tfoms.conf` и DNS `dashboard.tfoms`
4. User unit `deploy/systemd/dashboard.service`
5. Первый релиз через `update-production.sh`

## Обновление

```sh
cd "$HOME/apps/dashboard"
CONTAINER_ENGINE=podman sh scripts/update-production.sh
```

Проверка: `curl --fail http://127.0.0.1:3090/api/health`
