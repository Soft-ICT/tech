/* =========================================
   FCM Permission & Token Module
========================================= */

import { messaging, db } from "./firebase.js";

import {
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";

import {
    ref,
    set,
    push,
    get,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


/* =========================================
   FCM CONFIG
========================================= */

const vapidKey = "এখানে_আপনার_আসল_VAPID_PUBLIC_KEY";


/* =========================================
   1. Permission + Token
========================================= */

export async function requestNotificationPermission() {

    try {

        if (!("Notification" in window)) {
            console.log("Browser does not support notifications.");
            return;
        }

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            console.log("Notification permission denied.");
            return;
        }

        console.log("Notification permission granted.");


        /* Service Worker register */

        const registration = await navigator.serviceWorker.register(
            "./firebase-messaging-sw.js"
        );

        console.log(
            "FCM Service Worker registered:",
            registration.scope
        );


        /* Get FCM Token */

        const currentToken = await getToken(messaging, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration
        });


        if (currentToken) {

            console.log("FCM Token acquired:", currentToken);

            await saveTokenToDatabase(currentToken);

        } else {

            console.log("No FCM registration token available.");

        }

    } catch (error) {

        console.error(
            "FCM permission/token error:",
            error
        );

    }
}


/* =========================================
   2. Save Token
========================================= */

async function saveTokenToDatabase(token) {

    try {

        const tokensRef = ref(
            db,
            "webapp/fcm_tokens"
        );

        const tokenQuery = query(
            tokensRef,
            orderByChild("token"),
            equalTo(token)
        );

        const snapshot = await get(tokenQuery);


        if (!snapshot.exists()) {

            const newTokenRef = push(tokensRef);

            await set(newTokenRef, {

                token: token,

                time: new Date().toISOString(),

                userAgent: navigator.userAgent

            });

            console.log(
                "New FCM token saved."
            );

        } else {

            console.log(
                "FCM token already exists."
            );

        }

    } catch (error) {

        console.error(
            "Token save error:",
            error
        );

    }
}


/* =========================================
   3. Foreground Messages
========================================= */

export function listenForForegroundMessages() {

    onMessage(messaging, (payload) => {

        console.log(
            "Foreground message:",
            payload
        );


        const title =
            payload.notification?.title ||
            payload.data?.title ||
            "নতুন নোটিশ";


        const body =
            payload.notification?.body ||
            payload.data?.body ||
            "";


        alert(`📢 ${title}\n${body}`);

    });

}
