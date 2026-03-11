/**
 * Mobile LTM Viewer — lightweight Bun.serve() app
 * Serves the mobile PWA and proxies /api/* to the LTM backend (port 7331).
 * Run: bun --hot server.ts
 */
import index from "./index.html";

const API_BACKEND = process.env.LTM_API_URL ?? "http://localhost:7331";
const PORT = Number(process.env.PORT) || 7333;

Bun.serve({
  port: PORT,

  routes: {
    "/": index,
    "/manifest.json": new Response(Bun.file("./manifest.json")),
  },

  async fetch(req) {
    const url = new URL(req.url);

    // Proxy /api/* to the LTM backend
    if (url.pathname.startsWith("/api/")) {
      const backendUrl = `${API_BACKEND}${url.pathname}${url.search}`;
      const proxyRes = await fetch(backendUrl, {
        method: req.method,
        headers: req.headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      }).catch((e: Error) => new Response(JSON.stringify({ error: e.message }), { status: 502 }));
      return proxyRes;
    }

    return new Response("Not found", { status: 404 });
  },

  development: {
    hmr: true,
    console: true,
  },
});

console.log(`LTM Mobile running on http://localhost:${PORT}`);
console.log(`  API backend: ${API_BACKEND}`);
