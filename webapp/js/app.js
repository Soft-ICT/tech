/* =========================================
   FIREBASE IMPORTS & SETUP
========================================= */

import { watchAuth, logoutUser } from "./auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { db } from "./firebase.js";

"use strict";

/* =========================================
   DATABASE & STATE MANAGEMENT
========================================= */

let database = {
    categories: [],
    headers: [],
    data: []
};

let currentCategoryId = null;
let editingCategoryId = null;

/* =========================================
   AUTH WATCHER & INITIAL LOAD
========================================= */

watchAuth((user, role) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    window.currentUser = user;
    window.currentUserRole = role;

    loadDatabase();
});

document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
});

/* =========================================
   FIREBASE STORAGE LOGIC
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
            database = {
                categories: [],
                headers: [],
                data: []
            };
        }

        renderCategories();
    } catch (error) {
        console.error("Database load error:", error);
        showToast("ফায়ারবেস থেকে ডাটা লোড করা যায়নি");
    }
}

async function saveDatabase() {
    if (!window.currentUser) return;

    try {
        await set(ref(db, "webapp/user_data/" + window.currentUser.uid), database);
    } catch (error) {
        console.error("Database save error:", error);
        showToast("ফায়ারবেসে ডাটা সেভ করতে সমস্যা হয়েছে");
    }
}

function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
}

/* =========================================
   EVENTS SETUP
========================================= */

function setupEvents() {
    document.getElementById("addCategoryBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("emptyAddBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("addSubCategoryBtn")?.addEventListener("click", () => openCategoryModal(true));

    document.getElementById("saveCategoryBtn")?.addEventListener("click", saveCategory);
    document.getElementById("saveHeaderBtn")?.addEventListener("click", saveHeader);
    document.getElementById("saveDataBtn")?.addEventListener("click", saveData);

    document.getElementById("addHeaderBtn")?.addEventListener("click", openHeaderModal);
    document.getElementById("addDataBtn")?.addEventListener("click", openDataModal);

    // Page Navigation Back Button
    document.getElementById("backToMainBtn")?.addEventListener("click", goBack);

    document.getElementById("searchBtn")?.addEventListener("click", toggleSearch);
    document.getElementById("clearSearch")?.addEventListener("click", clearSearch);
    document.getElementById("searchInput")?.addEventListener("input", renderCategories);

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            closeModal(btn.dataset.close);
        });
    });

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
}

/* =========================================
   PAGE SWITCHING LOGIC
========================================= */

function openCategory(id) {
    const category = database.categories.find(item => item.id === id);
    if (!category) return;

    currentCategoryId = id;

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    const titleElement = document.getElementById("detailsTitle");
    const subtitleElement = document.getElementById("detailsSubtitle");

    if (titleElement) titleElement.textContent = category.name;

    const headersCount = database.headers.filter(h => h.categoryId === id).length;
    const dataCount = database.data.filter(d => d.categoryId === id).length;
    if (subtitleElement) subtitleElement.textContent = `${headersCount} Header • ${dataCount} Data`;

    renderCategoryDetails();
}

function goBack() {
    const currentCat = database.categories.find(c => c.id === currentCategoryId);
    
    if (currentCat && currentCat.parentId) {
        openCategory(currentCat.parentId);
    } else {
        currentCategoryId = null;
        document.getElementById("categoryDetailsView")?.classList.add("hidden");
        document.getElementById("mainDashboardView")?.classList.remove("hidden");
        renderCategories();
    }
}

/* =========================================
   CATEGORY & SUB-CATEGORY LOGIC
========================================= */

function openCategoryModal(isSubCategory = false) {
    editingCategoryId = null;
    const modalTitle = document.getElementById("categoryModalTitle");
    if (modalTitle) {
        modalTitle.textContent = isSubCategory ? "নতুন Sub-Category" : "নতুন Category";
    }

    const input = document.getElementById("categoryNameInput");
    if (input) input.value = "";

    openModal("categoryModal");
    setTimeout(() => input?.focus(), 100);
}

async function saveCategory() {
    const input = document.getElementById("categoryNameInput");
    const name = input?.value.trim();

    if (!name) {
        showToast("Category Name লিখুন");
        return;
    }

    if (editingCategoryId) {
        const category = database.categories.find(item => item.id === editingCategoryId);
        if (category) {
            category.name = name;
        }
    } else {
        database.categories.push({
            id: generateId("cat"),
            name: name,
            parentId: currentCategoryId ? currentCategoryId : null,
            createdAt: Date.now()
        });
    }

    await saveDatabase();
    closeModal("categoryModal");

    if (currentCategoryId) {
        renderCategoryDetails();
    } else {
        renderCategories();
    }
    showToast("Category সেভ করা হয়েছে");
}

/* =========================================
   RENDER LOGIC
========================================= */

function renderCategories() {
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    const countElement = document.getElementById("categoryCount");
    const searchVal = document.getElementById("searchInput")?.value.trim().toLowerCase();

    if (!list || !emptyState) return;

    let categoriesToShow = database.categories.filter(cat => !cat.parentId);

    if (searchVal) {
        categoriesToShow = database.categories.filter(cat => 
            cat.name.toLowerCase().includes(searchVal)
        );
    }

    list.innerHTML = "";
    if (countElement) countElement.textContent = `${categoriesToShow.length}টি Category`;

    if (database.categories.length === 0) {
        emptyState.classList.remove("hidden");
        list.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    list.classList.remove("hidden");

    categoriesToShow.forEach(category => {
        const card = document.createElement("div");
        card.className = "category-card";
        card.style.cssText = "padding: 15px; border-radius: 8px; background: var(--card-bg, #fff); margin-bottom: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(0,0,0,0.1);";
        
        const subCount = database.categories.filter(c => c.parentId === category.id).length;
        const dataCount = database.data.filter(d => d.categoryId === category.id).length;

        card.innerHTML = `
            <div>
                <h3 style="margin:0; font-size:16px;">📁 ${escapeHTML(category.name)}</h3>
                <small style="color:gray;">${subCount} Sub-Categories • ${dataCount} Data</small>
            </div>
            <span>➡️</span>
        `;

        card.addEventListener("click", () => openCategory(category.id));
        list.appendChild(card);
    });
}

function renderCategoryDetails() {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";

    const subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);

    if (subCategories.length > 0) {
        const subWrapper = document.createElement("div");
        subWrapper.style.marginBottom = "20px";
        subWrapper.innerHTML = `<h4 style="margin-bottom:10px;">📂 Sub-Categories</h4>`;

        subCategories.forEach(sub => {
            const item = document.createElement("div");
            item.style.cssText = "padding: 12px 15px; background: rgba(0,0,0,0.04); border-radius: 6px; margin-bottom: 8px; cursor: pointer; display: flex; justify-content: space-between; font-weight: 500;";
            item.innerHTML = `<span>📁 ${escapeHTML(sub.name)}</span> <span>➡️</span>`;
            item.addEventListener("click", () => openCategory(sub.id));
            subWrapper.appendChild(item);
        });

        container.appendChild(subWrapper);
    }

    const headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    const categoryData = database.data.filter(d => d.categoryId === currentCategoryId);

    headers.forEach(header => {
        const headerBox = document.createElement("div");
        headerBox.style.cssText = "margin-bottom: 15px; padding: 12px; border: 1px dashed #ccc; border-radius: 6px;";
        headerBox.innerHTML = `<h5 style="margin:0 0 10px 0; font-size: 15px;">🏷️ ${escapeHTML(header.title)}</h5>`;

        const headerItems = categoryData.filter(d => d.headerId === header.id);
        headerItems.forEach(item => {
            const dataEl = document.createElement("div");
            dataEl.style.cssText = "padding:10px; background:#fff; margin-bottom:6px; border-radius:4px; border:1px solid #eee;";
            dataEl.innerHTML = `<strong>${escapeHTML(item.title)}</strong><p style="margin:4px 0 0 0; font-size:13px; color:#555;">${escapeHTML(item.description)}</p>`;
            headerBox.appendChild(dataEl);
        });

        container.appendChild(headerBox);
    });

    const noHeaderData = categoryData.filter(d => !d.headerId);
    if (noHeaderData.length > 0) {
        const noHeaderBox = document.createElement("div");
        noHeaderBox.innerHTML = `<h5 style="margin: 10px 0;">📄 সাধারণ Data</h5>`;
        noHeaderData.forEach(item => {
            const dataEl = document.createElement("div");
            dataEl.style.cssText = "padding:10px; background:#fff; margin-bottom:6px; border-radius:4px; border:1px solid #eee;";
            dataEl.innerHTML = `<strong>${escapeHTML(item.title)}</strong><p style="margin:4px 0 0 0; font-size:13px; color:#555;">${escapeHTML(item.description)}</p>`;
            noHeaderBox.appendChild(dataEl);
        });
        container.appendChild(noHeaderBox);
    }

    if (subCategories.length === 0 && headers.length === 0 && categoryData.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:gray; margin-top:30px;">এটি একটি খালি ক্যাটাগরি। সাব-ক্যাটাগরি, হেডার অথবা ডাটা যোগ করুন।</p>`;
    }
}

/* =========================================
   HEADER & DATA LOGIC
========================================= */

function openHeaderModal() {
    const input = document.getElementById("headerNameInput");
    if (input) input.value = "";
    openModal("headerModal");
}

async function saveHeader() {
    const input = document.getElementById("headerNameInput");
    const title = input?.value.trim();

    if (!title || !currentCategoryId) return;

    database.headers.push({
        id: generateId("header"),
        categoryId: currentCategoryId,
        title: title
    });

    await saveDatabase();
    closeModal("headerModal");
    renderCategoryDetails();
    showToast("Header সেভ করা হয়েছে");
}

function openDataModal() {
    const titleInput = document.getElementById("dataTitleInput");
    const descInput = document.getElementById("dataDescriptionInput");
    const select = document.getElementById("dataHeaderSelect");

    if (titleInput) titleInput.value = "";
    if (descInput) descInput.value = "";

    if (select) {
        select.innerHTML = `<option value="">Header ছাড়া</option>`;
        const currentHeaders = database.headers.filter(h => h.categoryId === currentCategoryId);
        currentHeaders.forEach(h => {
            select.innerHTML += `<option value="${h.id}">${escapeHTML(h.title)}</option>`;
        });
    }

    openModal("dataModal");
}

async function saveData() {
    const title = document.getElementById("dataTitleInput")?.value.trim();
    const desc = document.getElementById("dataDescriptionInput")?.value.trim();
    const headerId = document.getElementById("dataHeaderSelect")?.value;

    if (!title || !currentCategoryId) return;

    database.data.push({
        id: generateId("data"),
        categoryId: currentCategoryId,
        headerId: headerId || null,
        title: title,
        description: desc
    });

    await saveDatabase();
    closeModal("dataModal");
    renderCategoryDetails();
    showToast("Data সেভ করা হয়েছে");
}

/* =========================================
   UI HELPERS
========================================= */

function openModal(id) {
    document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id)?.classList.add("hidden");
}

function toggleSearch() {
    document.getElementById("searchBox")?.classList.toggle("hidden");
}

function clearSearch() {
    const input = document.getElementById("searchInput");
    if (input) input.value = "";
    renderCategories();
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

function escapeHTML(str) {
    return String(str || "").replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[match]));
}
