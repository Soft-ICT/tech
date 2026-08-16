import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { auth, db } from "./firebase.js";

export async function registerUser(email, password, name) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;
    await set(ref(db, "webapp/users/" + uid), {
        name: name,
        role: "user",
        createdAt: Date.now()
    });
    return credential.user;
}

export async function loginUser(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}

export async function logoutUser() {
    await signOut(auth);
}

export async function getUserRole(uid) {
    const snapshot = await get(ref(db, "webapp/users/" + uid));
    if (!snapshot.exists()) {
        return "user";
    }
    const userData = snapshot.val();
    return userData.role === "admin" ? "admin" : "user";
}

export function watchAuth(callback) {
    return onAuthStateChanged(auth, async user => {
        if (!user) {
            callback(null, "guest");
            return;
        }
        const role = await getUserRole(user.uid);
        callback(user, role);
    });
}
