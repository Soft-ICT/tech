const CACHE_NAME = "police-phonebook-v1";

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
     * HTML / CSS / JS / Image
     * আগে Cache থেকে নেওয়ার চেষ্টা করবে।
     */

    event.respondWith(

        caches.match(request)

            .then(function (cachedResponse) {

                if (cachedResponse) {

                    return cachedResponse;

                }


                /*
                 * Cache-এ না থাকলে Internet থেকে আনবে
                 */

                return fetch(request)

                    .then(function (networkResponse) {

                        /*
                         * Valid response হলে cache করবে
                         */

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
                         * Internet না থাকলে index.html
                         * দেখানোর চেষ্টা
                         */

                        return caches.match(
                            "./index.html"
                        );

                    });

            })

    );

});
