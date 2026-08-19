const CACHE_NAME = "police-phonebook-v3";

// স্থানীয় ফাইলসমূহ
const LOCAL_ASSETS = [
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

// Firebase external CDN ফাইলসমূহ
const EXTERNAL_ASSETS = [
    "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap",
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js",
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js",
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js"
];

/* =========================
   INSTALL
========================= */
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async function (cache) {
            // Local files
            await cache.addAll(LOCAL_ASSETS);
            
            // External Firebase CDN files
            for (const url of EXTERNAL_ASSETS) {
                try {
                    const response = await fetch(url, { mode: "cors" });
                    if (response.ok) {
                        await cache.put(url, response);
                    }
                } catch (e) {
                    console.log("External asset cache skipped:", url);
                }
            }
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

/* =========================
   ACTIVATE
========================= */
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

/* =========================
   FETCH (Stale-While-Revalidate Strategy)
========================= */
self.addEventListener("fetch", function (event) {
    const request = event.request;

    // Firebase Database Realtime Sync URL-গুলো ক্যাশ করবে না
    if (request.url.includes("firebaseio.com")) {
        return;
    }

    event.respondWith(
        caches.match(request).then(function (cachedResponse) {
            if (cachedResponse) {
                // Background-এ নেটওয়ার্ক থেকে আপডেট নেওয়ার চেষ্টা করবে
                fetch(request).then(function (networkResponse) {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(request, networkResponse);
                        });
                    }
                }).catch(() => {});
                
                return cachedResponse;
            }

            // ক্যাশে না থাকলে নেটওয়ার্ক থেকে আনবে
            return fetch(request).then(function (networkResponse) {
                if (
                    networkResponse &&
                    networkResponse.status === 200 &&
                    (networkResponse.type === "basic" || networkResponse.type === "cors")
                ) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(function () {
                // অফলাইনে HTML Request হলে index.html দেখাবে
                if (request.headers.get("accept")?.includes("text/html")) {
                    return caches.match("./index.html");
                }
            });
        })
    );
});
