const CACHE_NAME = "police-phonebook-v3.2-secure";

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/style.css?v=3",
    "./js/app.js",
    "./js/firebase.js",
    "./js/auth.js",
    "./icon/icon-192.png",
    "./icon/icon-512.png"
];

/* =========================
   INSTALL EVENT
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
   ACTIVATE EVENT
========================= */
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (cacheNames) {
                return Promise.all(
                    cacheNames.map(function (cacheName) {
                        if (cacheName !== CACHE_NAME) {
                            console.log("Old Cache Deleted:", cacheName);
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
   FETCH EVENT (Offline First & Self-Healing Support)
========================= */
self.addEventListener("fetch", function (event) {
    const request = event.request;

    if (request.method !== "GET") return;

    if (
        request.url.includes("firebaseio.com") ||
        request.url.includes("identitytoolkit") ||
        request.url.includes("securetoken")
    ) {
        return;
    }

    event.respondWith(
        caches.match(request).then(function (cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request)
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
                    if (request.mode === "navigate") {
                        return caches.match("./index.html");
                    }
                });
        })
    );
});
