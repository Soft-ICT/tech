const CACHE_NAME = "police-phonebook-v2"; // bump this on every deploy to bust old caches

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",

    "./css/style.css?v=3",

    "./js/app.js",

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

                        if (
                            cacheName !== CACHE_NAME
                        ) {

                            return caches.delete(
                                cacheName
                            );

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
     * Firebase / external API request
     * Service Worker cache করবে না।
     */

    if (
        request.url.includes("firebaseio.com") ||
        request.url.includes("googleapis.com") ||
        request.url.includes("gstatic.com")
    ) {

        return;

    }


    /*
     * HTML / CSS / JS / Image — App shell ফাইলগুলো
     *
     * আগে ছিল Cache-First: cache-এ থাকলে সবসময় পুরনো ভার্সন
     * দেখাতো, অনলাইনে থাকলেও নতুন আপডেট আসতো না।
     *
     * এখন Network-First: অনলাইনে থাকলে সবসময় সবার আগে
     * নেটওয়ার্ক থেকে সর্বশেষ ভার্সন আনার চেষ্টা করবে এবং
     * cache আপডেট করবে। শুধু অফলাইনে থাকলে (fetch fail হলে)
     * cache থেকে ফলব্যাক দেখাবে।
     */

    event.respondWith(

        fetch(request)

            .then(function (networkResponse) {

                if (
                    networkResponse &&
                    networkResponse.status === 200 &&
                    networkResponse.type !== "opaque"
                ) {

                    const responseClone =
                        networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(function (cache) {

                            cache.put(
                                request,
                                responseClone
                            );

                        });

                }

                return networkResponse;

            })

            .catch(function () {

                /*
                 * ইন্টারনেট না থাকলে (offline) cache থেকে
                 * ফলব্যাক দেখানোর চেষ্টা করবে
                 */

                return caches.match(request)

                    .then(function (cachedResponse) {

                        if (cachedResponse) {

                            return cachedResponse;

                        }

                        /*
                         * ক্যাশেও না থাকলে index.html দেখানোর
                         * চেষ্টা (SPA fallback)
                         */

                        return caches.match(
                            "./index.html"
                        );

                    });

            })

    );

});
