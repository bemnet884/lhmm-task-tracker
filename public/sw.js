const OFFLINE_HTML = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px;color:#111">
<div><h2 style="margin:0 0 8px">You're offline</h2>
<p style="margin:0;color:#666">Check your connection and try again.</p></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html" } })
    )
  );
});