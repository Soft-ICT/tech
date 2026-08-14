// sw.js

const CACHE_NAME = 'phonebook-v1.2';

const urlsToCache = [
    './',
    './mtcontacts.html',
    './manifest.json?v=1.2'
];

// Install Event
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

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log(
                                'পুরোনো ক্যাশ মুছে ফেলা হচ্ছে:',
                                cacheName
                            );

                            return caches.delete(cacheName);
                        }

                        return null;
                    })
                );
            })
            .then(() => {
                // সব খোলা পেজে নতুন Service Worker নিয়ন্ত্রণ নেবে
                return self.clients.claim();
            })
    );
});

// Fetch Event
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
                return fetch(event.request)
                    .then((networkResponse) => {

                        // সফল response হলে cache-এ রাখবে
                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            networkResponse.type === 'basic'
                        ) {
                            const responseToCache =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(
                                        event.request,
                                        responseToCache
                                    );
                                });
                        }

                        return networkResponse;
                    });
            })
            .catch(() => {

                // Internet না থাকলে mtcontacts.html দেখাবে
                return caches.match('./mtcontacts.html');
            })
    );
});
