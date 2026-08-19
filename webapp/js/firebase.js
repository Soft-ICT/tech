import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    onValue, 
    set, 
    push, 
    remove, 
    update 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// আপনার Firebase Config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

/* ==========================================
   OFFLINE DATA CACHING (LOCAL STORAGE BACKUP)
========================================== */

// Firebase-এর ডাটা অফলাইনের জন্য LocalStorage-এ সেভ করা
export function subscribeToDatabase(path, callback) {
    const dbRef = ref(db, path);
    const localKey = `offline_cache_${path.replace(/\//g, "_")}`;

    // ১. প্রথমে যদি লোকাল ক্যাশে ডাটা থাকে, তা সাথে সাথে স্ক্রিনে দেখাবে (অফলাইনের জন্য)
    const cachedData = localStorage.getItem(localKey);
    if (cachedData) {
        try {
            callback(JSON.parse(cachedData));
        } catch (e) {
            console.error("Cache parsing error:", e);
        }
    }

    // ২. অনলাইন থেকে নতুন ডাটা এলে বা আপডেট হলে স্ক্রিন ও লোকাল স্টোরেজ আপডেট করবে
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data !== null) {
            localStorage.setItem(localKey, JSON.stringify(data));
            callback(data);
        } else {
            localStorage.removeItem(localKey);
            callback(null);
        }
    }, (error) => {
        console.warn("Firebase fetch failed (Offline Mode Active):", error);
    });
}
