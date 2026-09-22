// LAYER service worker - offline app shell + runtime caching for fonts
const CACHE = "layer-v15";
const ASSETS = [
  "./",
  "./index.html",
  "./makeup.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./products/tirtir-milk-toner.png",
  "./products/bioderma-sebium-h2o.png",
  "./products/boj-rice-milk-toner.png",
  "./products/anua-azelaic-serum.png",
  "./products/anua-heartleaf-cleanser.png",
  "./products/sunozon-oil-control-spf50.png"
];
// Pages get the network first (so updates always show up); everything else is cache-first.
const NETWORK_FIRST = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isNetworkFirst(req){
  if (req.mode === "navigate") return true;
  const url = new URL(req.url);
  return NETWORK_FIRST.some((p) => url.pathname.endsWith(p.replace("./", "/")));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  if (isNetworkFirst(req)) {
    // Always try the live page first, so updates show up immediately when online.
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
