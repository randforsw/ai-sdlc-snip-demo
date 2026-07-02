# Snip — URL Shortener Backend

A zero-dependency [Bun](https://bun.sh) server that creates and resolves short links stored in memory.

## Quick start

```bash
bun run server.js
# or
bun start
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Listening port |
| `BASE_URL` | `http://localhost:<PORT>` | Origin used in `shortUrl` values |
| `RAILWAY_PUBLIC_DOMAIN` | — | Fallback: `https://<domain>` when `BASE_URL` is not set |
| `PUBLIC_DIR` | — | When set, serve static files from this folder (`/` → `index.html`). A matching static file takes precedence over a short code of the same name. |

## API

### `POST /api/links`
Create a short link.

**Body:** `{ "url": "https://example.com" }`

| Status | Body |
|---|---|
| 201 | `{ code, url, shortUrl, hits, createdAt }` |
| 400 | invalid JSON or non-http(s) URL |

### `GET /api/links`
Return all links as a JSON array (same shape as above).

### `GET /:code`
Redirect (302) to the original URL and increment the hit counter.
Returns 404 JSON if the code is unknown.

All responses include open CORS headers (`Access-Control-Allow-Origin: *`).
