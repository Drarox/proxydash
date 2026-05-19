# ProxyDash — Backend

Bun + Hono API server. Parses Nginx config files and exposes a REST API consumed by the frontend.

## Setup

```sh
bun install
bun run dev   # hot-reload on http://localhost:3000
```

## Project structure

```
src/
├── index.ts              # Entry point — HTTP server, routes, startup
├── nginx/
│   ├── parser.ts         # Nginx config file parser
│   ├── service.ts        # Service layer (reads files, reads cert cache)
│   └── types.ts          # Shared types
├── cache/
│   └── certCache.ts      # In-memory cert cache — read, write, refresh logic
├── crons/
│   └── certRefresh.ts    # Croner job — schedules periodic cert refreshes
└── utils/
    └── cert-check.ts     # Low-level TLS certificate check (raw socket)
```

## Certificate caching

On startup, `startCertRefreshCron()` is called. It immediately fetches TLS certificate status for all proxy domains and stores the results in the in-memory cache. A cron job then refreshes the cache on a schedule (default: every hour).

`GET /api/nginx/sites` always reads from the cache, so it returns instantly regardless of how many domains are configured.

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api` | Service info and endpoint index |
| `GET` | `/api/health` | Health check + resolved config paths |
| `GET` | `/api/nginx/config` | Raw content of `nginx.conf` |
| `GET` | `/api/nginx/config-files` | Raw content of every file in `sites-available` |
| `GET` | `/api/nginx/sites` | Parsed proxy site list with cached cert status |
| `GET` | `/api/stats` | Stats summary (sites count, certs needing attention, TLS health %) |
| `POST` | `/api/nginx/cert-cache/refresh` | Trigger an immediate cert cache refresh |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `NGINX_CONFIG_PATH` | `/etc/nginx/nginx.conf` | Path to the main Nginx config file |
| `NGINX_SITES_AVAILABLE_DIR` | `/etc/nginx/sites-available` | Path to the sites-available directory |
| `CERT_REFRESH_CRON` | `0 * * * *` | Cron pattern for automatic cert refresh (every hour by default) |