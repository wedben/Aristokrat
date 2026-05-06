#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DB_SERVICE="${DB_SERVICE:-db}"
DB_USER="${DB_USER:-aristokrat}"
DB_NAME="${DB_NAME:-aristokrat}"

mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y-%m-%d_%H-%M-%S)"
backup_file="$BACKUP_DIR/${DB_NAME}_${timestamp}.sql.gz"

echo "Creating backup: $backup_file"
docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip -9 > "$backup_file"

echo "Backup created successfully."

echo "Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Done."
