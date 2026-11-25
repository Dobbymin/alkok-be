#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-alkok-postgres}"
POSTGRES_USER="${POSTGRES_USER:-alkok}"
POSTGRES_DB="${POSTGRES_DB:-alkok}"
BACKUP_DIR="${BACKUP_DIR:-/home/dobbymin/backups/alkok}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

DATE_STAMP="$(date +%Y%m%d)"
DUMP_FILE="${BACKUP_DIR}/alkok-${DATE_STAMP}.dump"
STAGE="init"

notify_failure() {
  local exit_code="$?"
  local timestamp
  timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[backup-db] ERROR at stage=${STAGE} (exit=${exit_code}) at ${timestamp}" >&2

  if [ -n "$DISCORD_WEBHOOK_URL" ]; then
    local payload
    payload=$(printf '{"content":"🚨 **[Alkok DB Backup Failed]** stage: `%s` | exit: `%s` | time: `%s`"}' "$STAGE" "$exit_code" "$timestamp")
    curl -fsS -H "Content-Type: application/json" -d "$payload" "$DISCORD_WEBHOOK_URL" >/dev/null 2>&1 || true
  fi
}

trap notify_failure ERR

STAGE="mkdir"
mkdir -p "$BACKUP_DIR"

STAGE="pg_dump"
docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$DUMP_FILE"

STAGE="pg_restore_list"
docker exec -i "$POSTGRES_CONTAINER" pg_restore --list < "$DUMP_FILE" >/dev/null

STAGE="retention_cleanup"
find "$BACKUP_DIR" -maxdepth 1 -name 'alkok-*.dump' -type f -mtime +"$RETENTION_DAYS" -delete

if [ -n "$RCLONE_REMOTE" ]; then
  STAGE="rclone_upload"
  rclone copy "$DUMP_FILE" "$RCLONE_REMOTE"
else
  echo "[backup-db] RCLONE_REMOTE is unset; skipping offsite upload."
fi

echo "[backup-db] Completed successfully: $DUMP_FILE"
