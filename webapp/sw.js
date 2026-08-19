/* =========================================================
   Police Phonebook PWA - Service Worker
========================================================= */

const CACHE_NAME = "police-phonebook-v2";


/* =========================================================
   App Shell
========================================================= */

const APP_SHELL = [

    "./",
    "./index.html",
    "./manifest.json",

    "./css/style.css?v=3",

    "./js/app.js",
    "./js/auth.js",
    "./js/firebase.js",

    "./icons/icon-192.png",
    "./icons/icon-512.png"

];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        console.log(
            "[SW] Installing..."
        );

        event.waitUntil(

            caches
                .open(CACHE_NAME)

                .then(cache => {

                    console.log(
                        "[SW] Caching app shell"
                    );

                    return cache.addAll(
                        APP_SHELL
                    );

                })

                .then(() => {

                    console.log(
                        "[SW] Install complete"
                    );

                    return self.skipWaiting();

                })

                .catch(error => {

                    console.error(
                        "[SW] Cache install error:",
                        error
                    );

                })

        );

    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        console.log(
            "[SW] Activating..."
        );

        event.waitUntil(

            caches
                .keys()

                .then(cacheNames => {

                    return Promise.all(

                        cacheNames.map(
                            cacheName => {

                                if (
                                    cacheName !==
                                    CACHE_NAME
                                ) {

                                    console.log(
                                        "[SW] Removing old cache:",
                                        cacheName
                                    );

                                    return caches.delete(
                                        cacheName
                                    );

                                }

                                return null;

                            }
                        )

                    );

                })

                .then(() => {

                    console.log(
                        "[SW] Activation complete"
                    );

                    return self.clients.claim();

                })

        );

    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;

        const url =
            new URL(
                request.url
            );


        /*
         * শুধু GET request handle করব।
         */

        if (
            request.method !== "GET"
        ) {

            return;

        }


        /*
         * Firebase এবং external API
         * request cache করা হবে না।
         */

        if (

            url.hostname.includes(
                "firebaseio.com"
            )

            ||

            url.hostname.includes(
                "googleapis.com"
            )

            ||

            url.hostname.includes(
                "gstatic.com"
            )

        ) {

            return;

        }


        /*
         * Google Fonts
         */

        if (

            url.hostname.includes(
                "fonts.googleapis.com"
            )

            ||

            url.hostname.includes(
                "fonts.gstatic.com"
            )

        ) {

            event.respondWith(

                networkFirst(
                    request
                )

            );

            return;

        }


        /*
         * App HTML / CSS / JS / Images
         */

        event.respondWith(

            cacheFirst(
                request
            )

        );

    }
);


/* =========================================================
   CACHE FIRST
========================================================= */

async function cacheFirst(
    request
) {

    try {

        /*
         * আগে Cache খুঁজবে
         */

        const cachedResponse =
            await caches.match(
                request
            );


        if (
            cachedResponse
        ) {

            return cachedResponse;

        }


        /*
         * Cache-এ না থাকলে Internet
         */

        const networkResponse =
            await fetch(
                request
            );


        /*
         * Valid response হলে cache করবে
         */

        if (

            networkResponse &&

            networkResponse.status ===
                200 &&

            networkResponse.type !==
                "opaque"

        ) {

            const cache =
                await caches.open(
                    CACHE_NAME
                );

            await cache.put(

                request,

                networkResponse.clone()

            );

        }


        return networkResponse;

    }

    catch (error) {

        console.error(
            "[SW] Cache-first error:",
            error
        );


        /*
         * HTML page হলে offline index
         * ফেরত দেওয়ার চেষ্টা
         */

        if (
            request.mode ===
            "navigate"
        ) {

            const offlinePage =
                await caches.match(
                    "./index.html"
                );


            if (
                offlinePage
            ) {

                return offlinePage;

            }

        }


        /*
         * কিছুই পাওয়া না গেলে
         */

        return new Response(

            "Offline - এই পেজটি বর্তমানে পাওয়া যাচ্ছে না।",

            {
                status: 503,

                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }

            }

        );

    }

}


/* =========================================================
   NETWORK FIRST
========================================================= */

async function networkFirst(
    request
) {

    try {

        const networkResponse =
            await fetch(
                request
            );


        if (

            networkResponse &&

            networkResponse.status ===
                200 &&

            networkResponse.type !==
                "opaque"

        ) {

            const cache =
                await caches.open(
                    CACHE_NAME
                );

            await cache.put(

                request,

                networkResponse.clone()

            );

        }


        return networkResponse;

    }

    catch (error) {

        console.log(
            "[SW] Network unavailable, using cache"
        );


        const cachedResponse =
            await caches.match(
                request
            );


        if (
            cachedResponse
        ) {

            return cachedResponse;

        }


        return new Response(
            "",
            {
                status: 503
            }
        );

    }

}


/* =========================================================
   MESSAGE
========================================================= */

self.addEventListener(
    "message",
    event => {

        if (
            !event.data
        ) {

            return;

        }


        /*
         * নতুন Service Worker
         * সঙ্গে সঙ্গে activate
         */

        if (
            event.data.type ===
            "SKIP_WAITING"
        ) {

            self.skipWaiting();

        }


        /*
         * Cache clear
         */

        if (
            event.data.type ===
            "CLEAR_CACHE"
        ) {

            event.waitUntil(

                caches
                    .keys()

                    .then(
                        cacheNames => {

                            return Promise.all(

                                cacheNames.map(
                                    cacheName =>
                                        caches.delete(
                                            cacheName
                                        )
                                )

                            );

                        }
                    )

            );

        }

    }
);
