/* =========================================
   Firebase Auth — Lazy Loaded

   static import ব্যর্থ হলে (অফলাইনে SDK না থাকলে) পুরো
   module load-ই আটকে যায়, যেটা app.js-এর import চেইনকেও
   ভেঙে দেয়। তাই dynamic import() ব্যবহার করা হচ্ছে।
========================================= */

let authSDK = null;
let authInstance = null;
let authLoadAttempted = false;

async function ensureAuth() {
    if (authInstance) return authInstance;
    if (authLoadAttempted) return null;

    authLoadAttempted = true;

    try {
        authSDK = await import(
            "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js"
        );
        const { app } = await import("./firebase.js");
        authInstance = authSDK.getAuth(app);
        return authInstance;
    } catch (error) {
        console.error("Auth SDK load failed (offline?):", error);
        return null;
    }
}

// Admin Login Function
export async function loginAdmin(email, password) {
    const auth = await ensureAuth();
    if (!auth) {
        return { success: false, error: "ইন্টারনেট সংযোগ প্রয়োজন" };
    }

    try {
        const userCredential = await authSDK.signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Admin Logout Function
export async function logoutAdmin() {
    const auth = await ensureAuth();
    if (!auth) {
        return { success: false, error: "ইন্টারনেট সংযোগ প্রয়োজন" };
    }

    try {
        await authSDK.signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Auth State Watcher
export function watchAuth(callback) {
    ensureAuth().then(function (auth) {
        if (!auth) {
            // অফলাইনে SDK লোড না হলে guest হিসেবে ধরে নিয়ে
            // callback চালানো হচ্ছে, যাতে বাকি অ্যাপ (cached
            // ডাটা দেখানো) থেমে না থাকে
            callback(null, null);
            return;
        }

        authSDK.onAuthStateChanged(auth, (user) => {
            if (user) {
                callback(user, "admin");
            } else {
                callback(null, null);
            }
        });
    });
}
