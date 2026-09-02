importScripts(
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js"
);


firebase.initializeApp({

    apiKey: "AIzaSyCSirbiyWf7WQn9UqoZghAfph2U5jwJbPI",

    authDomain: "qrt-team.firebaseapp.com",

    databaseURL:
        "https://qrt-team-default-rtdb.firebaseio.com",

    projectId: "qrt-team",

    storageBucket:
        "qrt-team.firebasestorage.app",

    messagingSenderId:
        "855875068920",

    appId:
        "1:855875068920:web:df1a2218ee083000b8ec0d",

    measurementId:
        "G-BKNYLRYSGS"

});


const messaging = firebase.messaging();


/* =========================================
   Background Message
========================================= */

messaging.onBackgroundMessage((payload) => {

    console.log(
        "[firebase-messaging-sw.js] Background message:",
        payload
    );


    const title =
        payload.data?.title ||
        payload.notification?.title ||
        "নতুন নোটিশ";


    const body =
        payload.data?.body ||
        payload.notification?.body ||
        "";


    const image =
        payload.data?.image ||
        payload.notification?.image ||
        "";


    const url =
        payload.data?.url ||
        "./index.html";


    const notificationOptions = {

        body: body,

        icon: image || "./icons/icon-192.png",

        data: {
            url: url
        }

    };


    return self.registration.showNotification(
        title,
        notificationOptions
    );

});


/* =========================================
   Notification Click
========================================= */

self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();

        const url =
            event.notification.data?.url ||
            "./index.html";


        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            })

            .then((clientList) => {

                for (const client of clientList) {

                    if ("focus" in client) {

                        client.navigate(url);

                        return client.focus();

                    }

                }


                if (clients.openWindow) {

                    return clients.openWindow(url);

                }

            })

        );

    }
);
