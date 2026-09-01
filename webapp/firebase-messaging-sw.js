importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCSirbiyWf7WQn9UqoZghAfph2U5jwJbPI",
    authDomain: "qrt-team.firebaseapp.com",
    databaseURL: "https://qrt-team-default-rtdb.firebaseio.com",
    projectId: "qrt-team",
    storageBucket: "qrt-team.firebasestorage.app",
    messagingSenderId: "855875068920",
    appId: "1:855875068920:web:df1a2218ee083000b8ec0d",
    measurementId: "G-BKNYLRYSGS"
});

const messaging = firebase.messaging();

// ব্যাকগ্রাউন্ডে নোটিশ রিসিভ করার হ্যান্ডলার
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.image || '/icon.png' // আপনার অ্যাপের আইকন বা লোগো
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
