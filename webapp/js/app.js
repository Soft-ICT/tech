import { watchAuth, loginAdmin, logoutAdmin } from "./auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { db } from "./firebase.js";

"use strict";

let database = { categories: [], headers: [], data: [] };
let currentCategoryId = null;
window.currentUserRole = "guest";

/* AUTH WATCHER */
watchAuth((user, role) => {
    const adminBtn = document.getElementById("adminLoginBtn");
    
    if (!user) {
        window.currentUser = null;
        window.currentUserRole = "guest";
        if (adminBtn) {
            adminBtn.textContent = "🔑 Admin Login";
            adminBtn.style.backgroundColor = "";
        }
    } else {
        window.currentUser = user;
        window.currentUserRole = role || "admin";
        if (adminBtn) {
            adminBtn.textContent = "🚪 Logout";
            adminBtn.style.backgroundColor = "#dc3545";
        }
    }

    updateAdminUI();
    loadDatabase();
});

function updateAdminUI() {
    const isAdmin = window.currentUserRole === "admin";
    const adminElements = document.querySelectorAll(".admin-only");
    
    adminElements.forEach(el => {
        if (isAdmin) {
            el.classList.remove("hidden");
            el.style.display = "";
        } else {
            el.classList.add("hidden");
            el.style.display = "none";
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    initTheme();
    updateAdminUI();
});

/* DARK MODE CONTROLLER */
function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    showToast(isDark ? "নাইট মোড অন করা হয়েছে" : "ডে মোড অন করা হয়েছে");
}

/* EVENT LISTENERS */
function setupEvents() {
    // Dark mode toggle
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);
    
    // Admin Login / Logout Trigger
    document.getElementById("adminLoginBtn")?.addEventListener("click", () => {
        if (window.currentUserRole === "admin" && window.currentUser) {
            if (confirm("আপনি কি নিশ্চিত লগআউট করতে চান?")) {
                logoutAdmin().then(res => {
                    if (res.success) showToast("সফলভাবে লগআউট হয়েছে");
                });
            }
        } else {
            openModal("loginModal");
        }
    });

    // Login Form Submit
    document.getElementById("submitLoginBtn")?.addEventListener("click", async () => {
        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document.getElementById("loginPassword")?.value.trim();

        if (!email || !password) {
            showToast("ইমেইল এবং পাসওয়ার্ড দিন");
            return;
        }

        const res = await loginAdmin(email, password);
        if (res.success) {
            showToast("অ্যাডমিন লগইন সফল হয়েছে!");
            closeModal("loginModal");
            document.getElementById("loginEmail").value = "";
            document.getElementById("loginPassword").value = "";
        } else {
            showToast("লগইন ব্যর্থ: " + (res.error || "পাসওয়ার্ড বা ইমেইল ভুল"));
        }
    });

    // Close Modals
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
}

/* DATABASE LOAD */
async function loadDatabase() {
    try {
        const snapshot = await get(ref(db, "webapp/public_data"));
        if (snapshot.exists()) {
            database = snapshot.val();
            if (!database.categories) database.categories = [];
        } else {
            database = { categories: [], headers: [], data: [] };
        }
        renderCategories();
    } catch (error) {
        console.error("Database load error:", error);
    }
}

function renderCategories() {
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    if (!list || !emptyState) return;

    if (!database.categories || database.categories.length === 0) {
        emptyState.classList.remove("hidden");
        list.classList.add("hidden");
    } else {
        emptyState.classList.add("hidden");
        list.classList.remove("hidden");
    }
    updateAdminUI();
}

function openModal(id) {
    document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id)?.classList.add("hidden");
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 2500);
}
