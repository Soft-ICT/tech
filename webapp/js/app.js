import { watchAuth, logoutUser } from "./auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { db } from "./firebase.js";

"use strict";

let database = {
    categories: [],
    headers: [],
    data: []
};

let currentCategoryId = null;
let editingCategoryId = null;

// Auth Observer & Load Data
watchAuth((user, role) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    console.log("Logged in:", user.email, "Role:", role);
    window.currentUser = user;
    window.currentUserRole = role;

    // ইউজার কনফার্ম হওয়ার পর ফায়ারবেস থেকে ডাটা লোড হবে
    loadDatabase();
});

/* =========================================
   INITIALIZE
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    loadTheme();
});

/* =========================================
   FIREBASE STORAGE
========================================= */

async function loadDatabase() {
    if (!window.currentUser) return;

    try {
        const snapshot = await get(ref(db, "webapp/user_data/" + window.currentUser.uid));

        if (snapshot.exists()) {
            database = snapshot.val();
            if (!database.categories) database.categories = [];
            if (!database.headers) database.headers = [];
            if (!database.data) database.data = [];
        } else {
            database = { categories: [], headers: [], data: [] };
        }

        renderCategories();
    } catch (error) {
        console.error("Database load error:", error);
        showToast("ডাটা লোড করতে ব্যর্থ হয়েছে");
    }
}

async function saveDatabase() {
    if (!window.currentUser) return;

    try {
        await set(ref(db, "webapp/user_data/" + window.currentUser.uid), database);
        console.log("Data saved to Firebase successfully");
    } catch (error) {
        console.error("Database save error:", error);
        showToast("ডাটা সেভ করতে সমস্যা হয়েছে");
    }
}

