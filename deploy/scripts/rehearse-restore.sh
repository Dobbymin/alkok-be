#!/usr/bin/env bash
set -euo pipefail

SOURCE_CONTAINER="${SOURCE_CONTAINER:-alkok-dev-postgres}"
POSTGRES_USER="${POSTGRES_USER:-alkok}"
POSTGRES_DB="${POSTGRES_DB:-alkok}"
REHEARSAL_CONTAINER="alkok-restore-rehearsal-$$"
TMP_DUMP="$(mktemp "/tmp/alkok-rehearsal-${$}-XXXXXX.dump")"

cleanup() {
  docker rm -f "$REHEARSAL_CONTAINER" >/dev/null 2>&1 || true
  rm -f "$TMP_DUMP"
}
trap cleanup EXIT

START_TS="$(date +%s)"

echo "[rehearse] 1. Dumping from ${SOURCE_CONTAINER}..."
docker exec "$SOURCE_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$TMP_DUMP"

echo "[rehearse] 2. Verifying dump archive with pg_restore --list..."
docker exec -i "$SOURCE_CONTAINER" pg_restore --list < "$TMP_DUMP" >/dev/null

echo "[rehearse] 3. Launching ephemeral postgres:17-alpine (${REHEARSAL_CONTAINER})..."
docker run -d \
  --name "$REHEARSAL_CONTAINER" \
  -e POSTGRES_USER="$POSTGRES_USER" \
  -e POSTGRES_PASSWORD="$POSTGRES_USER" \
  -e POSTGRES_DB="$POSTGRES_DB" \
  postgres:17-alpine >/dev/null

READY=false
for _ in $(seq 1 60); do
  if docker exec "$REHEARSAL_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    READY=true
    break
  fi
  sleep 1
done

if [ "$READY" != "true" ]; then
  docker logs "$REHEARSAL_CONTAINER" >&2 || true
  echo "[rehearse] ERROR: Rehearsal postgres container did not become ready in time." >&2
  exit 1
fi

echo "[rehearse] 4. Restoring dump into ephemeral container..."
docker exec -i "$REHEARSAL_CONTAINER" pg_restore --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$TMP_DUMP"

echo "[rehearse] 5. Verifying restored table row counts..."
COUNTS=$(docker exec "$REHEARSAL_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "SELECT (SELECT count(*) FROM contents WHERE deleted_at IS NULL) || ',' || (SELECT count(*) FROM categories) || ',' || (SELECT count(*) FROM users) || ',' || (SELECT count(*) FROM sources);")

IFS=',' read -r CONTENTS_CNT CATEGORIES_CNT USERS_CNT SOURCES_CNT <<< "$COUNTS"
END_TS="$(date +%s)"
RTO_SECONDS=$((END_TS - START_TS))

echo "[rehearse] Restored counts -> contents=${CONTENTS_CNT}, categories=${CATEGORIES_CNT}, users=${USERS_CNT}, sources=${SOURCES_CNT}"
echo "[rehearse] Measured RTO: ${RTO_SECONDS}s (target < 3600s)"

if [ "$CONTENTS_CNT" -lt 42 ] || [ "$CATEGORIES_CNT" -lt 11 ] || [ "$USERS_CNT" -lt 1 ] || [ "$SOURCES_CNT" -lt 10 ]; then
  echo "[rehearse] ERROR: Restored counts below release gate thresholds!" >&2
  exit 1
fi

if [ "$RTO_SECONDS" -ge 3600 ]; then
  echo "[rehearse] ERROR: RTO exceeded 3600s!" >&2
  exit 1
fi

echo "[rehearse] Restore rehearsal PASSED."
