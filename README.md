# Snip — Tiny URL Shortener

One backend, two clients, three git branches, zero shared build tooling.

```
https://github.com/randforsw/ai-sdlc-snip-demo
├── branch: backend   → Bun HTTP server  (server.js, zero npm deps)
├── branch: frontend  → Angular 19 SPA   (snip-frontend/)
└── branch: cli       → Node.js CLI      (cli.js, zero npm deps)
```

This **`main`** branch is a pure superproject: it contains no source code of its
own, only three git submodules that each track one of the branches above.

---

## Architecture

```
Browser / CLI
     │
     │  HTTP (JSON)
     ▼
┌─────────────────────────────┐
│  Bun server  :3000          │
│  in-memory Map store        │
│  base-62 6-char short codes │
└─────────────────────────────┘
```

### API contract

| Method | Path | Body / Notes | Response |
|--------|------|--------------|----------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | `{ code, url, shortUrl, hits, createdAt }` |
| `GET` | `/api/links` | — | `Link[]` (same shape) |
| `GET` | `/:code` | — | `301` → original URL, or `404` |

`BASE_URL` / `PORT` are configurable via environment variables (see backend README).

---

## Repository layout

| Submodule path | Branch | What's inside |
|---|---|---|
| `backend/` | `backend` | `server.js`, `package.json`, `README.md` |
| `frontend/` | `frontend` | Angular 19 app (`src/`, `angular.json`, …) |
| `cli/` | `cli` | `cli.js`, `package.json`, wrappers, `README.md` |

Each layer is a fully independent project. You can clone any single branch
without touching the others.

---

## Cloning

### Full superproject (all three layers)

```sh
git clone --recurse-submodules https://github.com/randforsw/ai-sdlc-snip-demo.git
cd ai-sdlc-snip-demo
```

> **Why `--recurse-submodules`?**  
> A plain `git clone` leaves `backend/`, `frontend/`, and `cli/` as **empty
> folders**. The flag tells git to also initialise and populate each submodule
> automatically.

If you already cloned without the flag:

```sh
git submodule update --init --recursive
```

### Single layer only

```sh
# backend only
git clone -b backend https://github.com/randforsw/ai-sdlc-snip-demo.git snip-backend

# frontend only
git clone -b frontend https://github.com/randforsw/ai-sdlc-snip-demo.git snip-frontend

# CLI only
git clone -b cli https://github.com/randforsw/ai-sdlc-snip-demo.git snip-cli
```

---

## Running all three pieces

### 1 — Backend (Bun)

```sh
cd backend
bun run start          # or: bun server.js
# listens on http://localhost:3000
```

Requires [Bun](https://bun.sh) ≥ 1.0. No `npm install` needed.

### 2 — Frontend (Angular dev server)

```sh
cd frontend
npm install
npm start              # ng serve → http://localhost:4200
```

The Angular app talks to `http://localhost:3000` by default.  
For a production build: `npm run build` → output in `dist/snip-frontend/browser/`.

### 3 — CLI (Node.js)

```sh
cd cli
node cli.js help
```

No `npm install` needed. Set `SNIP_API` to override the backend URL:

```sh
SNIP_API=http://localhost:3000 node cli.js add https://example.com
node cli.js ls
node cli.js open <code>
```

Or install globally: `cd cli && npm link`, then use `snip` anywhere.

---

## Updating a submodule

**Inside a submodule** — work and commit normally:

```sh
cd backend
# … edit server.js …
git add server.js
git commit -m "fix: handle empty URL gracefully"
git push origin backend
```

**Back in the superproject** — bump the recorded commit pointer:

```sh
cd ..                                    # back to superproject root
git submodule update --remote backend    # fast-forward to latest commit on branch
git add backend
git commit -m "chore: bump backend submodule"
git push origin main
```

> The superproject stores a **commit SHA**, not a branch name.  
> `git submodule update --remote` is how you advance that pointer to the
> branch's latest commit.

---

## Branch overview

| Branch | Purpose | Key file |
|---|---|---|
| `main` | Superproject (this branch) | `.gitmodules` |
| `backend` | Bun server | `server.js` |
| `frontend` | Angular 19 SPA | `angular.json` |
| `cli` | Node.js CLI | `cli.js` |
| `bundle` | **Generated output** — do not hand-edit | `server.js`, `cli.js`, `public/`, `Dockerfile` |

---

## Bundle branch (generated deployable)

The `bundle` submodule folder contains a self-contained, Docker/Railway-ready
package that combines all three layers: the Bun server, the built Angular SPA
(served as static files), and the CLI.

**Regenerate after any source change:**

```sh
# Assemble locally (no push)
node scripts/build-bundle.mjs

# Assemble + push bundle branch + main
node scripts/build-bundle.mjs --push
```

The script (`scripts/build-bundle.mjs`) is a zero-dependency Node.js ESM module.
It is safe to re-run — if nothing has changed it reports "Nothing to commit" and exits cleanly.

**What gets written to `bundle/`:**

| File | Source |
|---|---|
| `server.js` | copied verbatim from `backend/` |
| `cli.js` | copied verbatim from `cli/` |
| `public/` | Angular production build (`ng build`) |
| `.env` | `PUBLIC_DIR=./public` (Bun auto-loads; enables static file serving) |
| `package.json` | `"start": "bun server.js"`, no `"type"` field |
| `Dockerfile` | `FROM oven/bun:1-alpine`, `EXPOSE 3000`, `CMD bun server.js` |
| `.dockerignore` | excludes `node_modules`, `*.md` |
| `railway.json` | selects the Dockerfile builder |

**Deploy to Railway:**
```sh
# From the bundle/ submodule folder:
railway up
# or connect the bundle branch directly in the Railway dashboard.
```
