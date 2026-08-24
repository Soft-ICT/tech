// ওয়েবসাইট লোড হওয়ার সাথে সাথে স্টোরেজ পারসিস্টেন্ট সেট করবে
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(function(persistent) {
    if (persistent) {
      console.log("Storage marked as persistent! Data will not be cleaned.");
    }
  });
}
