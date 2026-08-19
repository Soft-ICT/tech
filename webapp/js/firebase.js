import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// আপনার Firebase Config (আপনার আসল কি-গুলো বসান)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// ডাটা ফেচিং ও লোকাল ক্যাশিং ফাংশন
export function subscribeToDatabase(path, callback) {
    const dbRef = ref(db, path);
    const localKey = "cached_data_" + path;

    // ১. লোকাল স্টোরেজে আগেই ডাটা থাকলে সঙ্গে সঙ্গে তা দেখাবে
    const savedData = localStorage.getItem(localKey);
    if (savedData) {
        try {
            callback(JSON.parse(savedData));
        } catch (e) {
            console.error(e);
        }
    }

    // ২. Firebase থেকে রিয়েলটাইম ডাটা ফেচ করবে
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            localStorage.setItem(localKey, JSON.stringify(data));
            callback(data);
        } else {
            callback(null);
        }
    }, (error) => {
        console.warn("Offline mode active or network error:", error);
    });
}
