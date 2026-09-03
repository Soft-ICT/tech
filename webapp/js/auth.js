import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { app } from "./firebase.js";

const auth = getAuth(app);

// Admin Login Function
export async function loginAdmin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Admin Logout Function
export async function logoutAdmin() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Auth State Watcher
export function watchAuth(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            callback(user, "admin");
        } else {
            callback(null, null);
        }
    });
}

