const CACHE_NAME = 'phonebook-v1';
const urlsToCache = [
  './mtcontacts.html',
  './manifest.json',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js'
];

// ইনস্টল এবং ক্যাশিং
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// অফলাইনে ফাইল রিটার্ন করা
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
