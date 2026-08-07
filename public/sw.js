/**
 * PDF opener Service Worker.
 * Auth app = Bearer token (localStorage) — browser tak bisa kirim header saat
 * window.open(url) navigasi langsung. SW ini menambahkan Authorization ke
 * request /api/* yang belum punya header, jadi PDF bisa dibuka di tab browser
 * native TANPA blob. Token dikirim dari halaman via postMessage.
 */
let authToken = null;

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "AUTH") {
    authToken = typeof e.data.token === "string" && e.data.token ? e.data.token : null;
    // Ack so the page knows the token has actually landed before it trusts
    // this SW to inject Authorization on the next navigation (see swAuth.ts).
    if (e.ports && e.ports[0]) e.ports[0].postMessage({ ok: true });
  }
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) {
    if (!authToken) return; // passthrough default
    const headers = new Headers(e.request.headers);
    if (headers.has("Authorization")) return; // fetch API normal — sudah ada header
    headers.set("Authorization", `Bearer ${authToken}`);
    e.respondWith(fetch(new Request(e.request, { headers })));
  }
});
