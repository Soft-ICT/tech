const CACHE_NAME = "police-phonebook-v2"; // নতুন ভার্সন

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/style.css?v=3",
    "./js/app.js",
    "./js/auth.js",
    "./js/firebase.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    // ফায়ারবেস SDK ফাইলগুলো অফলাইন ক্যাশে যুক্ত করা হলো
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js",
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js",
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js"
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

    /*
     * শুধুমাত্র লাইভ ডাটাবেজ API এবং অথেন্টিকেশন রিকোয়েস্ট ক্যাশ স্কিপ করবে।
     * gstatic.com বাদ দেওয়া হয়েছে যেন মডিউল ফাইল ক্যাশ হতে পারে।
     */
    if (
        request.url.includes("firebaseio.com") ||
        request.url.includes("identitytoolkit.googleapis.com")
    ) {
        return;
    }

    /*
     * HTML / CSS / JS / Images এবং External CDN
     * আগে Cache থেকে নেওয়ার চেষ্টা করবে।
     */
    event.respondWith(
        caches.match(request)
            .then(function (cachedResponse) {
                if (cachedResponse) {
                    return cachedResponse;
                }

                /*
                 * Cache-এ না থাকলে Internet থেকে আনবে এবং ক্যাশে রাখবে
                 */
                return fetch(request)
                    .then(function (networkResponse) {
                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            networkResponse.type !== "opaque"
                        ) {
                            const responseClone = networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(function (cache) {
                                    cache.put(request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(function () {
                        /*
                         * Internet না থাকলে fallback হিসেবে index.html দেখাবে
                         */
                        return caches.match("./index.html");
                    });
            })
    );
});
