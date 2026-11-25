# Alkok Deployment & Operations Guide

## 1. GitHub Actions Secrets

Configure the following secrets in `Dobbymin/alkok-be` repository settings:

| Secret | Description |
| :--- | :--- |
| `RPI_HOST` | Raspberry Pi 4 SSH hostname or IP |
| `RPI_USER` | SSH username (e.g. `dobbymin`) |
| `RPI_SSH_KEY` | Private SSH key for RPi login |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL for deploy rollback / backup / AI alerts |

> Note: When `RPI_HOST`, `RPI_USER`, or `RPI_SSH_KEY` is unset, `.github/workflows/deploy.yml` builds and pushes the ARM64 GHCR image and skips the SSH deploy step cleanly.

## 2. Raspberry Pi 4 Directory Layout (`/home/dobbymin/project/alkok`)

- `docker-compose.prod.yml` (copied from `deploy/docker-compose.prod.yml`)
- `.env` (permissions `600`, backend secrets — see `.env.example` + `GHCR_OWNER`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `BE_IMAGE_TAG`)
- `.env.fe` (permissions `600`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `INTERNAL_API_BASE_URL`)
- `pgdata/` (PostgreSQL 17 data volume)

## 3. Host Nginx Setup

Copy `deploy/nginx/alkok.dobbymin.cloud.conf` to `/etc/nginx/conf.d/alkok.dobbymin.cloud.conf`, run Certbot for TLS, and reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Daily DB Backup & Cloudflare R2 Offsite Sync (`backup-db.sh`)

`deploy/scripts/backup-db.sh` creates a custom-format PostgreSQL dump (`alkok-YYYYMMDD.dump`), verifies archive integrity with `pg_restore --list`, prunes local dumps older than 7 days, uploads to Cloudflare R2 via `rclone copy`, and sends a Discord alert if any stage fails.

### RPi Cron Setup (Daily 04:00 KST)

1. Configure an `rclone` remote (e.g. `r2`) pointing to your Cloudflare R2 bucket with a **30-day object lifecycle rule**.
2. Register the cron job (`crontab -e`):

```cron
0 4 * * * POSTGRES_CONTAINER=alkok-postgres POSTGRES_USER=alkok POSTGRES_DB=alkok RCLONE_REMOTE=r2:alkok-backups DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." /home/dobbymin/project/alkok/scripts/backup-db.sh >> /home/dobbymin/backups/alkok/backup.log 2>&1
```

## 5. Restore Rehearsal (`rehearse-restore.sh`)

Run `./deploy/scripts/rehearse-restore.sh` to verify `pg_dump` → `pg_restore --list` → ephemeral `postgres:17-alpine` restore → table count validation (`contents >= 42`, `categories >= 11`, `users >= 1`, `sources >= 10`) and measure RTO.

- **Latest Local Rehearsal Result**: `contents=42`, `categories=11`, `users=1`, `sources=10`, **Measured RTO = 7s** (< 3600s target).
- **Note**: Live Cloudflare R2 upload (`rclone copy`) and Discord webhook delivery depend on RPi host `rclone` config and `DISCORD_WEBHOOK_URL` secret.
