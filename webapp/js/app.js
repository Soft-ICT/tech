import { watchAuth, logoutUser } from "./auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { db } from "./firebase.js";

"use strict";

// **এখানে আপনার অ্যাডমিন UID বসান**
const ADMIN_UID = "YOUR_ADMIN_FIREBASE_UID_HERE"; 

let database = { categories: [], headers: [], data: [] };
let currentCategoryId = null;
let targetMoveDataId = null;

watchAuth((user, role) => {
    if (!user) { window.location.href = "login.html"; return; }
    window.currentUser = user;
    window.currentUserRole = (user.uid === ADMIN_UID) ? "admin" : "user";
    updateRoleUI();
    loadDatabase();
});

document.addEventListener("DOMContentLoaded", () => { setupEvents(); initTheme(); });

function updateRoleUI() {
    const isAdmin = window.currentUserRole === "admin";
    const buttons = [
        document.getElementById("addCategoryBtn"),
        document.getElementById("emptyAddBtn"),
        document.getElementById("addSubCategoryBtn"),
        document.getElementById("addHeaderBtn"),
        document.getElementById("addDataBtn")
    ];
    buttons.forEach(btn => { if (btn) btn.style.display = isAdmin ? "inline-block" : "none"; });
}

async function loadDatabase() {
    try {
        // সবাই একই পাথ থেকে ডাটা দেখবে (অ্যাডমিনের তৈরি করা)
        const snapshot = await get(ref(db, "webapp/shared_data"));
        if (snapshot.exists()) {
            database = snapshot.val();
        } else {
            database = { categories: [], headers: [], data: [] };
        }
        if (currentCategoryId) renderCategoryDetails();
        else renderCategories();
    } catch (error) { showToast("ডাটা লোড করতে সমস্যা হয়েছে"); }
}

async function saveDatabase() {
    if (window.currentUserRole !== "admin") return;
    try {
        await set(ref(db, "webapp/shared_data"), database);
    } catch (error) { showToast("ডাটা সেভ করতে সমস্যা হয়েছে"); }
}

// ... (আপনার আগের পিন লজিক, রেন্ডারিং, এবং ইভেন্ট লিসেনার এখানে থাকবে)
// মনে রাখবেন, রেন্ডারিং ফাংশনে `if (window.currentUserRole === "admin")` চেকটি ঠিকঠাক বসানো আছে।
// ইভেন্ট লিসেনারগুলোও শুধু এডমিনের জন্য একটিভ থাকবে।

// (সহজ করার জন্য আমি রেন্ডার লজিকটি এখানে রিপিট করছি না, আগের দেওয়া কোডেই সব সেট আছে)

document.getElementById("logoutBtn")?.addEventListener("click", () => { if (confirm("লগআউট করবেন?")) logoutUser(); });

function initTheme() {
    if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-mode");
}
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
}
function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg; toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}
// বাকি সব ফাংশন আগের মতই কাজ করবে।
