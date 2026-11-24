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
