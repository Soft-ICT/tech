import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { app } from "./firebase.js";

const auth = getAuth(app);


// =========================================
// Admin Login
// =========================================
export async function loginAdmin(email, password) {
    try {
        email = String(email || "").trim();

        if (!email || !password) {
            return {
                success: false,
                error: "ইমেইল এবং পাসওয়ার্ড দিন"
            };
        }

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        return {
            success: true,
            user: userCredential.user
        };

    } catch (error) {
        console.error("Admin Login Error:", error);

        return {
            success: false,
            error: error.message || "লগইন ব্যর্থ হয়েছে"
        };
    }
}


// =========================================
// Admin Logout
// =========================================
export async function logoutAdmin() {
    try {
        await signOut(auth);

        // নিশ্চিতভাবে local admin state পরিষ্কার
        window.currentUser = null;
        window.currentUserRole = "guest";

        return {
            success: true
        };

    } catch (error) {
        console.error("Admin Logout Error:", error);

        return {
            success: false,
            error: error.message || "লগআউট ব্যর্থ হয়েছে"
        };
    }
}


// =========================================
// Auth State Watcher
// =========================================
export function watchAuth(callback) {

    return onAuthStateChanged(auth, (user) => {

        if (user) {
            callback(user, "admin");
        } else {
            callback(null, "guest");
        }

    });
}
