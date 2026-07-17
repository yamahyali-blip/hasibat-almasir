const CACHE = "movement-calculator-v6";
const CORE = [
  "./","./index.html","./styles.css?v=6","./app.js?v=6","./manifest.webmanifest",
  "./assets/mbz-camo.jpg","./assets/zayed.jpg","./assets/forces-logo.png",
  "./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const req = event.request;
  const isPage = req.mode === "navigate" || req.destination === "document";
  if(isPage){
    event.respondWith(fetch(req).then(res => {
      const copy=res.clone();caches.open(CACHE).then(c => c.put("./index.html",copy));return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(fetch(req).then(res => {
    const copy=res.clone();caches.open(CACHE).then(c => c.put(req,copy));return res;
  }).catch(() => caches.match(req)));
});
