import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { app } from "./firebase.js";

const auth = getAuth(app);

export function watchAuth(callback) {
    // সরাসরি ব্যাকগ্রাউন্ডে অটোমেটিক লগইন
    signInAnonymously(auth).catch((error) => {
        console.error("Auto Login Error:", error);
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // সকল ইউজারে অটোমেটিক Admin রোল অ্যাসাইন করা হচ্ছে
            callback(user, "admin");
        } else {
            callback(null, null);
        }
    });
}
