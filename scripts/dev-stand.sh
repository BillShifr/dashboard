#!/bin/sh
set -eu
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
cd "$project_root"

if docker ps -a --format '{{.Names}}' | grep -qx dashboard-postgres; then
  docker start dashboard-postgres >/dev/null
  echo "Started existing dashboard-postgres"
  exit 0
fi

POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-dashboard} \
CONTAINER_DATABASE_URL=${CONTAINER_DATABASE_URL:-postgres://dashboard:dashboard@db:5432/dashboard} \
  docker compose up -d db

echo "dashboard-postgres is ready on 127.0.0.1:5436"
