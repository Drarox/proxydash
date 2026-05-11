To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

open <http://localhost:3000>

## ProxyDash API

ProxyDash reads nginx site files from `/etc/nginx/sites-available` by default, set `NGINX_SITES_AVAILABLE_DIR` to watch another directory.
It reads the main nginx config from `/etc/nginx/nginx.conf` by default, set `NGINX_CONFIG_PATH` to use another file.

Available endpoints:

- `GET /api/health` - service status and nginx config directory.
- `GET /api/nginx/config` - main nginx config file with full content.
- `GET /api/nginx/config-files` - raw nginx config files with full content.
- `GET /api/nginx/sites` - parsed reverse proxy entries with domain, aliases, upstream target, TLS status, common proxy options, source path, and full config content.

Run tests:

```sh
bun test
```
