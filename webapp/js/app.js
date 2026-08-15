import { watchAuth, logoutUser } from "./auth.js";
import { ref, set, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { db } from "./firebase.js";

"use strict";

let database = { categories: [], headers: [], data: [] };
let currentCategoryId = null;
let targetMoveDataId = null;
let primaryAdminUid = null;

// Auth Observer
watchAuth(async (user) => {
    if (!user) { 
        window.location.href = "login.html"; 
        return; 
    }
    
    window.currentUser = user;
    
    // ১. ইউজারের রোল চেক করা
    await checkUserRole(user.uid);
    
    // ২. সিস্টেমের মেইন অ্যাডমিন কে তা ডায়নামিকলি খুঁজে বের করা
    await findPrimaryAdmin();
    
    // UI এবং ডাটা লোড
    updateRoleUI();
    loadDatabase();
});

document.addEventListener("DOMContentLoaded", () => { 
    setupEvents(); 
    initTheme(); 
});

// ডায়নামিকলি ইউজারের রোল যাচাই (Admin নাকি User)
async function checkUserRole(uid) {
    try {
        const userSnap = await get(ref(db, `webapp/users/${uid}`));
        if (userSnap.exists()) {
            const userData = userSnap.val();
            window.currentUserRole = userData.role || "user";
        } else {
            window.currentUserRole = "user";
        }
    } catch (err) {
        console.error("Role fetch error:", err);
        window.currentUserRole = "user";
    }
}

// ডেটাবেজ থেকে যেকোনো একটি Active Admin UID খুঁজে বের করা
async function findPrimaryAdmin() {
    try {
        const usersRef = ref(db, "webapp/users");
        const adminQuery = query(usersRef, orderByChild("role"), equalTo("admin"));
        const snapshot = await get(adminQuery);
        
        if (snapshot.exists()) {
            const admins = snapshot.val();
            // প্রথম পাওয়া অ্যাডমিনের UID নেওয়া হবে
            primaryAdminUid = Object.keys(admins)[0]; 
        } else {
            // যদি কোনো অ্যাডমিন না পাওয়া যায় তবে বর্তমান ইউজারের UID
            primaryAdminUid = window.currentUser.uid; 
        }
    } catch (err) {
        console.error("Primary Admin fetch error:", err);
        primaryAdminUid = window.currentUser.uid;
    }
}

// রোল অনুযায়ী বাটন দেখানো বা লুকানো
function updateRoleUI() {
    const isAdmin = window.currentUserRole === "admin";
    const adminButtons = [
        document.getElementById("addCategoryBtn"),
        document.getElementById("emptyAddBtn"),
        document.getElementById("addSubCategoryBtn"),
        document.getElementById("addHeaderBtn"),
        document.getElementById("addDataBtn")
    ];

    adminButtons.forEach(btn => { 
        if (btn) btn.style.display = isAdmin ? "inline-block" : "none"; 
    });
}

// অ্যাডমিনের শেয়ার করা ডাটা লোড
async function loadDatabase() {
    if (!window.currentUser) return;

    try {
        // সবসময় ডায়নামিকলি প্রাপ্ত অ্যাডমিনের পাথ থেকে ডাটা লোড হবে
        const targetPath = `webapp/user_data/${primaryAdminUid}`;
        const snapshot = await get(ref(db, targetPath));

        if (snapshot.exists()) {
            database = snapshot.val();
            database.categories = database.categories || [];
            database.headers = database.headers || [];
            database.data = database.data || [];
        } else {
            database = { categories: [], headers: [], data: [] };
        }

        if (currentCategoryId) renderCategoryDetails();
        else renderCategories();
    } catch (error) {
        console.error("Database load error:", error);
        showToast("ডাটা লোড করা যায়নি");
    }
}

// ডাটা সেভ করা (শুধু অ্যাডমিনদের জন্য)
async function saveDatabase() {
    if (window.currentUserRole !== "admin") return;
    try {
        // অ্যাডমিন সেভ করলে নিজের নোডেই সেভ হবে
        await set(ref(db, `webapp/user_data/${window.currentUser.uid}`), database);
        showToast("ডাটা সংরক্ষিত হয়েছে");
    } catch (error) {
        console.error("Save error:", error);
        showToast("ডাটা সেভ করতে সমস্যা হয়েছে");
    }
}

// ইভেন্ট লিসেনার ও ইউটিলিটি
function setupEvents() {
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        if (confirm("আপনি কি লগআউট করতে চান?")) logoutUser();
    });
    
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);
}

function initTheme() {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg; 
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}
