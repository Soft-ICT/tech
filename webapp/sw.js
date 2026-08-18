self.addEventListener("install", (e) => {
  console.log("Service Worker installed");
});

self.addEventListener("fetch", (e) => {
  // অ্যাপ অফলাইনে কাজ করার জন্য ক্যাশিং লজিক দেওয়া যায়
});

