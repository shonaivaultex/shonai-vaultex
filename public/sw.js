const CACHE_NAME = "vaultex-shell-v1";
const APP_SHELL = ["/offline", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/auth/") || url.pathname.startsWith("/api/")) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline")));
    return;
  }
  if (["style", "script", "image", "font"].includes(event.request.destination)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      return response;
    })));
  }
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(self.registration.showNotification(data.title ?? "SHONAI VAULTEX", { body: data.body ?? "新しいお知らせがあります。", icon: "/icon-192.png", badge: "/icon-192.png", data: { url: data.url ?? "/mypage" }, tag: data.tag ?? "vaultex-notification", renotify: true }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close(); const url = event.notification.data?.url ?? "/mypage";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => { const existing = clients.find((client) => new URL(client.url).pathname === new URL(url, self.location.origin).pathname); return existing ? existing.focus() : self.clients.openWindow(url); }));
});
