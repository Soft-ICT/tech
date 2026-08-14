// sw.js ফাইলের ভেতরে এভাবে আপডেট করুন
const CACHE_NAME = 'phonebook-v1.1'; // <--- এখানে v1.1 করে দিন

const urlsToCache = [
  './',
  './index.html',
  './manifest.json?v=1.1'
];

// Install Event - পুরাতন ক্যাশ মুছে নতুন ক্যাশ তৈরি করা
self.addEventListener('install', (event) => {
  self.skipWaiting(); // নতুন সার্ভিস ওয়ার্কার সাথে সাথে একটিভ হবে
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate Event - পুরোনো ক্যাশ ডিলিট করার সবচেয়ে গুরুত্বপূর্ণ অংশ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('পুরোনো ক্যাশ মুছে ফেলা হচ্ছে:', cache);
            return caches.delete(cache); // পুরোনো v1.0 বা আগের ক্যাশ মুছে যাবে
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

