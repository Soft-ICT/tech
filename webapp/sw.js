const CACHE_NAME = "police-phonebook-v3"; // bump on every deploy to bust old caches

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

    /*
     * Firebase SDK-এর মূল কোড ফাইল (gstatic.com) — এগুলো
     * app.js/firebase.js/auth.js-এর ভেতরে import করা হয়। এগুলো
     * cache না থাকলে অফলাইনে import ব্যর্থ হয় এবং পুরো app.js
     * module-ই রান হয় না (কোনো JavaScript-ই কাজ করে না)।
     */
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js",
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js",
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js"
];


/* =========================
   INSTALL
========================= */

self.addEventListener("install", function (event) {

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(function (cache) {

                /*
                 * addAll() atomic — একটা রিসোর্সও fetch ব্যর্থ
                 * হলে পুরো install বাতিল হয়ে যায়, ফলে SW-ই
                 * activate হয় না। তাই প্রতিটা রিসোর্স আলাদাভাবে
                 * add করা হচ্ছে, একটা ব্যর্থ হলেও বাকিগুলো যেন
                 * cache হয়।
                 */

                return Promise.all(

                    APP_SHELL.map(function (url) {

                        return cache.add(url).catch(function (err) {

                            console.warn(
                                "SW precache skipped:",
                                url,
                                err
                            );

                        });

                    })

                );

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
     * শুধু Firebase-এর লাইভ ডাটা/অথ API রিকোয়েস্ট (আসল ডাটাবেস
     * রিড/রাইট, লগইন) SW cache করবে না — এগুলো সবসময় সর্বশেষ
     * হতে হবে এবং অফলাইনে ব্যর্থ হওয়াই স্বাভাবিক।
     *
     * লক্ষ্য করুন: gstatic.com (Firebase SDK-এর কোড ফাইল)
     * এখানে বাদ দেওয়া হয়নি — ওগুলো নিচের network-first লজিক
     * দিয়েই cache হবে, কারণ ওগুলো ছাড়া app.js module load-ই
     * ব্যর্থ হয়।
     */

    if (
        request.url.includes("firebaseio.com") ||
        request.url.includes("googleapis.com")
    ) {

        return;

    }


    /*
     * HTML / CSS / JS / Image / Firebase SDK ফাইল
     *
     * Network-First: অনলাইনে থাকলে সবসময় সবার আগে নেটওয়ার্ক
     * থেকে সর্বশেষ ভার্সন আনার চেষ্টা করবে এবং cache আপডেট
     * করবে। শুধু অফলাইনে থাকলে (fetch fail হলে) cache থেকে
     * ফলব্যাক দেখাবে।
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
