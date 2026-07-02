import { join, resolve, sep } from "path";

const PORT = parseInt(process.env.PORT || "3000", 10);

function resolveBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN)
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${PORT}`;
}

const BASE_URL = resolveBaseUrl();
const PUBLIC_DIR = process.env.PUBLIC_DIR?.trim() || null;

// In-memory link store: code -> { code, url, shortUrl, hits, createdAt }
const links = new Map();

const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomCode(len = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => B62[b % 62]).join("");
}

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function tryStaticFile(urlPath) {
  if (!PUBLIC_DIR) return null;
  const rel = urlPath === "/" ? "index.html" : urlPath.slice(1);
  const base = resolve(PUBLIC_DIR);
  const abs = resolve(base, rel);
  // Guard against path-traversal attacks
  if (!abs.startsWith(base + sep) && abs !== base) return null;
  const file = Bun.file(abs);
  return (await file.exists())
    ? new Response(file, { headers: { ...CORS_HEADERS } })
    : null;
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    const method = req.method;

    // CORS pre-flight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
    }

    // POST /api/links — create a short link
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      if (!isHttpUrl(body?.url)) {
        return json({ error: "url must be a valid http or https URL" }, 400);
      }
      let code;
      do {
        code = randomCode();
      } while (links.has(code));
      const link = {
        code,
        url: body.url,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    // GET /api/links — list all links
    if (method === "GET" && pathname === "/api/links") {
      return json([...links.values()]);
    }

    // GET * — static file (wins over short code), then short-code redirect
    if (method === "GET") {
      const staticRes = await tryStaticFile(pathname);
      if (staticRes) return staticRes;

      if (pathname.length > 1) {
        const code = pathname.slice(1);
        const link = links.get(code);
        if (!link) return json({ error: "Short link not found" }, 404);
        link.hits++;
        return new Response(null, {
          status: 302,
          headers: { ...CORS_HEADERS, Location: link.url },
        });
      }
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(
  `Snip listening on :${PORT}  BASE_URL=${BASE_URL}` +
    (PUBLIC_DIR ? `  PUBLIC_DIR=${PUBLIC_DIR}` : "")
);
