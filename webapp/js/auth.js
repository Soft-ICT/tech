import { auth } from "./firebase.js";

// Admin Login Function
export async function loginAdmin(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);[span_10](start_span)[span_10](end_span)
        return { success: true, user: userCredential.user };[span_11](start_span)[span_11](end_span)
    } catch (error) {
        return { success: false, error: error.message };[span_12](start_span)[span_12](end_span)
    }
}

// Admin Logout Function
export async function logoutAdmin() {
    try {
        await auth.signOut();[span_13](start_span)[span_13](end_span)
        return { success: true };[span_14](start_span)[span_14](end_span)
    } catch (error) {
        return { success: false, error: error.message };[span_15](start_span)[span_15](end_span)
    }
}

// Auth State Watcher
export function watchAuth(callback) {
    auth.onAuthStateChanged((user) => {[span_16](start_span)[span_16](end_span)
        if (user) {
            callback(user, "admin");[span_17](start_span)[span_17](end_span)
        } else {
            callback(null, null);[span_18](start_span)[span_18](end_span)
        }
    });
}
