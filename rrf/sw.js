// sw.js

const CACHE_NAME = 'phonebook-v1.3';

const urlsToCache = [
    './',
    './mtcontacts.html',
    './manifest.json?v=1.3'
];


// =====================================================
// INSTALL EVENT
// =====================================================

self.addEventListener('install', (event) => {

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then((cache) => {

                return cache.addAll(urlsToCache);

            })

            .then(() => {

                // নতুন Service Worker দ্রুত সক্রিয় হবে
                return self.skipWaiting();

            })

    );

});


// =====================================================
// ACTIVATE EVENT
// =====================================================

self.addEventListener('activate', (event) => {

    event.waitUntil(

        caches.keys()

            .then((cacheNames) => {

                return Promise.all(

                    cacheNames.map((cacheName) => {

                        // পুরোনো সব Cache মুছে ফেলবে
                        if (cacheName !== CACHE_NAME) {

                            console.log(
                                'পুরোনো Cache মুছে ফেলা হচ্ছে:',
                                cacheName
                            );

                            return caches.delete(cacheName);

                        }

                        return Promise.resolve();

                    })

                );

            })

            .then(() => {

                // সব খোলা পেজে নতুন Service Worker নিয়ন্ত্রণ নেবে
                return self.clients.claim();

            })

    );

});


// =====================================================
// FETCH EVENT
// =====================================================

self.addEventListener('fetch', (event) => {

    // GET ছাড়া অন্য request Service Worker handle করবে না
    if (event.request.method !== 'GET') {

        return;

    }


    event.respondWith(

        caches.match(event.request)

            .then((cachedResponse) => {

                // Cache-এ থাকলে Cache থেকে দেখাবে
                if (cachedResponse) {

                    return cachedResponse;

                }


                // Cache-এ না থাকলে Internet থেকে আনবে
                return fetch(event.request);

            })

    );

});
