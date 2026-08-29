/* =========================================================
   Firebase Admin Authentication
   auth.js
========================================================= */

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { app } from "./firebase.js";


// =========================================================
// Firebase Auth Instance
// =========================================================

const auth = getAuth(app);


// =========================================================
// Admin Login
// =========================================================

export async function loginAdmin(email, password) {

    try {

        // Input clean
        email = String(email || "").trim();
        password = String(password || "");

        // Empty check
        if (!email) {
            return {
                success: false,
                error: "ইমেইল লিখুন"
            };
        }

        if (!password) {
            return {
                success: false,
                error: "পাসওয়ার্ড লিখুন"
            };
        }


        // Firebase Login
        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user = userCredential.user;


        // Login successful
        console.log(
            "Admin Login Successful:",
            user.email
        );


        return {
            success: true,
            user: user
        };


    } catch (error) {

        console.error(
            "Admin Login Error:",
            error
        );


        let message = error.message || "লগইন ব্যর্থ হয়েছে";


        // Firebase error message
        switch (error.code) {

            case "auth/invalid-email":
                message = "ইমেইল ঠিকানা সঠিক নয়";
                break;

            case "auth/user-not-found":
                message = "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি";
                break;

            case "auth/wrong-password":
                message = "পাসওয়ার্ড সঠিক নয়";
                break;

            case "auth/invalid-credential":
                message = "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়";
                break;

            case "auth/too-many-requests":
                message = "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন";
                break;

            case "auth/network-request-failed":
                message = "ইন্টারনেট সংযোগে সমস্যা হয়েছে";
                break;
        }


        return {
            success: false,
            error: message
        };
    }
}



// =========================================================
// Admin Logout
// =========================================================

export async function logoutAdmin() {

    try {

        console.log("Admin Logout Started");


        // Firebase থেকে সম্পূর্ণ Sign Out
        await signOut(auth);


        // Local/global admin state পরিষ্কার
        if (typeof window !== "undefined") {

            window.currentUser = null;

            window.currentUserRole = "guest";
        }


        console.log("Admin Logout Successful");


        return {
            success: true
        };


    } catch (error) {

        console.error(
            "Admin Logout Error:",
            error
        );


        return {
            success: false,
            error: error.message || "লগআউট ব্যর্থ হয়েছে"
        };
    }
}



// =========================================================
// Authentication State Watcher
// =========================================================

export function watchAuth(callback) {

    if (typeof callback !== "function") {

        console.error(
            "watchAuth: callback function পাওয়া যায়নি"
        );

        return null;
    }


    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {

            if (user) {

                console.log(
                    "Auth State: ADMIN LOGGED IN",
                    user.email
                );


                callback(
                    user,
                    "admin"
                );


            } else {

                console.log(
                    "Auth State: LOGGED OUT"
                );


                // Logout হলে Guest state
                callback(
                    null,
                    "guest"
                );
            }
        }
    );


    // চাইলে পরবর্তীতে listener বন্ধ করা যাবে
    return unsubscribe;
}



// =========================================================
// Get Current Firebase User
// =========================================================

export function getCurrentAdmin() {

    return auth.currentUser || null;
}



// =========================================================
// Check Admin Login Status
// =========================================================

export function isAdminLoggedIn() {

    return !!auth.currentUser;
}
