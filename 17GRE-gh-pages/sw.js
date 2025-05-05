var cacheName = "17grePWA-v0.2.3";
var cacheContents = [
    "./",
    "./index.html",
    "./index.js",
    "./index.css",
    "./lib/vue.global.prod.js"
];

self.addEventListener("install", function(e) {
    console.log("[Service Worker] Install");
    self.skipWaiting();
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            console.log("[Service Worker] Caching contents");
            return cache.addAll(cacheContents);
        })
    );
});

self.addEventListener("fetch", function(e) {
    e.respondWith(
        caches.match(e.request, { ignoreSearch: true }).then(function(r) {
            console.log("[Service Worker] Fetching resouce: " + e.request.url);
            return r || fetch(e.request).then(function(response) {
                return caches.open(cacheName).then(function(cache) {
                    console.log("[Service Worker] Caching new resource: " + e.request.url);
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});
