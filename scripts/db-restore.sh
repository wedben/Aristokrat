#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <path_to_backup.sql.gz>"
  exit 1
fi

BACKUP_PATH="$1"
if [[ ! -f "$BACKUP_PATH" ]]; then
  echo "Backup file not found: $BACKUP_PATH"
  exit 1
fi

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
DB_SERVICE="${DB_SERVICE:-db}"
DB_USER="${DB_USER:-aristokrat}"
DB_NAME="${DB_NAME:-aristokrat}"

echo "Restoring backup: $BACKUP_PATH"
echo "WARNING: existing data in database '$DB_NAME' will be replaced."
read -r -p "Continue? (yes/no): " answer
if [[ "$answer" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

gzip -dc "$BACKUP_PATH" | docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  psql -U "$DB_USER" -d "$DB_NAME"

echo "Restore completed."
