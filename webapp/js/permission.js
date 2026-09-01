/* =========================================
   FCM Notification Permission & Token Module
   Path: tech/webapp/js/permission.js
========================================= */

import { messaging, db } from "./firebase.js";
import { getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";
import { ref, set, push, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// ১. নোটিফিকেশন পারমিশন নেওয়া এবং টোকেন জেনারেট করা
export async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            console.log("Notification permission granted.");
            
            // আপনার ফায়ারবেজ কনসোল থেকে পাওয়া VAPID Key এখানে বসাবেন
            const vapidKey = "BMrkQHSj9Ecth4EmZgRAJI9Wy0SaC6fYzMbibosBFXdaUo8BE-TRotw9UXx9Lp9ABFsLQJZPA_YOUR_REST_KEY"; 
            
            const currentToken = await getToken(messaging, { vapidKey: vapidKey });
            if (currentToken) {
                console.log("FCM Token acquired:", currentToken);
                // ডাটাবেজে টোকেন সেভ করুন (ডুপ্লিকেট চেক করে)
                saveTokenToDatabase(currentToken);
            } else {
                console.log("No registration token available.");
            }
        } else {
            console.log("Unable to get permission to notify.");
        }
    } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
    }
}

// ২. ডাটাবেজে টোকেন সেভ করার ফাংশন (যাতে একই টোকেন বারবার সেভ না হয়)
async function saveTokenToDatabase(token) {
    const tokensRef = ref(db, 'webapp/fcm_tokens');
    
    // চেক করা হচ্ছে টোকেনটি আগে থেকেই ডাটাবেজে আছে কি না
    const tokenQuery = query(tokensRef, orderByChild("token"), equalTo(token));
    const snapshot = await get(tokenQuery);

    if (!snapshot.exists()) {
        const newTokenRef = push(tokensRef);
        await set(newTokenRef, {
            token: token,
            time: new Date().toLocaleString('bn-BD')
        });
        console.log("New FCM Token saved to database.");
    } else {
        console.log("FCM Token already exists in database.");
    }
}

// ৩. সাই트 ওপรেন থাকা অবস্থায় (Foreground) নোটিশ রিসিভ করার জন্য
export function listenForForegroundMessages() {
    onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        const title = payload.notification?.title || "নতুন নোটিশ";
        const body = payload.notification?.body || "";
        alert(`📢 ${title}\n${body}`);
    });
}
