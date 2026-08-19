const CACHE_NAME = "police-phonebook-v2";

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/style.css?v=3",
    "./js/app.js",
    "./js/firebase.js",
    "./js/auth.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

/* =========================
   INSTALL
========================= */
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(APP_SHELL);
            })
            .then(function () {
                return self.skipWaiting();
            })
    );
});

/* =========================
   ACTIVATE
========================= */
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (cacheNames) {
                return Promise.all(
                    cacheNames.map(function (cacheName) {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(function () {
                return self.clients.claim();
            })
    );
});

/* =========================
   FETCH
========================= */
self.addEventListener("fetch", function (event) {
    const request = event.request;

    // Firebase / External API Network First request with Offline Fallback
    if (
        request.url.includes("firebaseio.com") ||
        request.url.includes("googleapis.com") ||
        request.url.includes("gstatic.com")
    ) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(function (networkResponse) {
                if (
                    networkResponse &&
                    networkResponse.status === 200 &&
                    networkResponse.type === "basic"
                ) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(function () {
                return caches.match(request).then(function (cachedResponse) {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (request.headers.get("accept")?.includes("text/html")) {
                        return caches.match("./index.html");
                    }
                });
            })
    );
});
