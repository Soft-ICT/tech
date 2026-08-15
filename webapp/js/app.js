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
let targetMoveDataId = null;

/* =========================================
   AUTH WATCHER & INITIAL LOAD
========================================= */

watchAuth((user, role) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    window.currentUser = user;
    window.currentUserRole = role || "user"; // 'admin' অথবা 'user'

    updateRoleUI();
    loadDatabase();
});

document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    initTheme();
});

/* =========================================
   ROLE-BASED UI CONTROL
========================================= */

function updateRoleUI() {
    const isAdmin = window.currentUserRole === "admin";

    // এডমিন না হলে টপ বাটনসমূহ লুকাতে সাহায্য করবে
    const addCatBtn = document.getElementById("addCategoryBtn");
    const emptyAddBtn = document.getElementById("emptyAddBtn");
    const addSubCatBtn = document.getElementById("addSubCategoryBtn");
    const addHeaderBtn = document.getElementById("addHeaderBtn");
    const addDataBtn = document.getElementById("addDataBtn");

    if (addCatBtn) addCatBtn.style.display = isAdmin ? "inline-block" : "none";
    if (emptyAddBtn) emptyAddBtn.style.display = isAdmin ? "inline-block" : "none";
    if (addSubCatBtn) addSubCatBtn.style.display = isAdmin ? "inline-block" : "none";
    if (addHeaderBtn) addHeaderBtn.style.display = isAdmin ? "inline-block" : "none";
    if (addDataBtn) addDataBtn.style.display = isAdmin ? "inline-block" : "none";
}

/* =========================================
   NIGHT / DARK MODE LOGIC
========================================= */

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
    showToast(isDark ? "নাইট মোড অন করা হয়েছে" : "ডে মোড অন করা হয়েছে");
}

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
            database = { categories: [], headers: [], data: [] };
        }

        if (currentCategoryId) renderCategoryDetails();
        else renderCategories();
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
        showToast("ডাটা সেভ করতে সমস্যা হয়েছে");
    }
}

function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
}

/* =========================================
   PINNING & SORTING LOGIC
========================================= */

function getSortedItems(items = []) {
    return [...items].sort((a, b) => {
        // ১. পিন করা আইটেমগুলো সবার উপরে থাকবে
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // ২. দুটিই পিন করা থাকলে: ১ম পিন করা আইটেম উপরে, ২য় পিন করা আইটেম তার নিচে
        if (a.pinned && b.pinned) {
            return (a.pinnedAt || 0) - (b.pinnedAt || 0);
        }

        // ৩. সাধারণ আইটেমের ক্ষেত্রে ডিফল্ট অর্ডার
        return 0;
    });
}

async function togglePin(type, id) {
    if (window.currentUserRole !== "admin") return;

    let item = null;
    if (type === "category") item = database.categories.find(c => c.id === id);
    else if (type === "header") item = database.headers.find(h => h.id === id);
    else if (type === "data") item = database.data.find(d => d.id === id);

    if (!item) return;

    if (item.pinned) {
        item.pinned = false;
        delete item.pinnedAt;
        showToast("পিন তুলে নেওয়া হয়েছে");
    } else {
        item.pinned = true;
        item.pinnedAt = Date.now();
        showToast("পিন করা হয়েছে");
    }

    await saveDatabase();

    if (currentCategoryId) renderCategoryDetails();
    else renderCategories();
}

/* =========================================
   EVENTS SETUP
========================================= */

function setupEvents() {
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);

    document.getElementById("addCategoryBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("emptyAddBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("addSubCategoryBtn")?.addEventListener("click", () => openCategoryModal(true));

    document.getElementById("saveCategoryBtn")?.addEventListener("click", saveCategory);
    document.getElementById("saveHeaderBtn")?.addEventListener("click", saveHeader);
    document.getElementById("saveDataBtn")?.addEventListener("click", saveData);
    document.getElementById("confirmMoveBtn")?.addEventListener("click", confirmMoveData);

    document.getElementById("addHeaderBtn")?.addEventListener("click", openHeaderModal);
    document.getElementById("addDataBtn")?.addEventListener("click", openDataModal);

    document.getElementById("backToMainBtn")?.addEventListener("click", goBack);

    document.getElementById("searchBtn")?.addEventListener("click", toggleSearch);
    document.getElementById("clearSearch")?.addEventListener("click", clearSearch);
    document.getElementById("searchInput")?.addEventListener("input", () => {
        if (currentCategoryId) renderCategoryDetails();
        else renderCategories();
    });

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
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
   CATEGORY & SUB-CATEGORY CRUD
========================================= */

function openCategoryModal(isSubCategory = false) {
    if (window.currentUserRole !== "admin") return;

    const modalTitle = document.getElementById("categoryModalTitle");
    if (modalTitle) modalTitle.textContent = isSubCategory ? "নতুন Sub-Category" : "নতুন Category";

    const input = document.getElementById("categoryNameInput");
    if (input) input.value = "";

    openModal("categoryModal");
    setTimeout(() => input?.focus(), 100);
}

async function saveCategory() {
    if (window.currentUserRole !== "admin") return;

    const input = document.getElementById("categoryNameInput");
    const name = input?.value.trim();

    if (!name) {
        showToast("Category Name লিখুন");
        return;
    }

    database.categories.push({
        id: generateId("cat"),
        name: name,
        parentId: currentCategoryId ? currentCategoryId : null,
        pinned: false,
        createdAt: Date.now()
    });

    await saveDatabase();
    closeModal("categoryModal");

    if (currentCategoryId) renderCategoryDetails();
    else renderCategories();
    
    showToast("Category সেভ করা হয়েছে");
}

async function editCategory(id) {
    if (window.currentUserRole !== "admin") return;

    const cat = database.categories.find(c => c.id === id);
    if (!cat) return;

    const newName = prompt("নতুন Category Name দিন:", cat.name);
    if (newName && newName.trim() !== "") {
        cat.name = newName.trim();
        await saveDatabase();
        if (currentCategoryId) renderCategoryDetails();
        else renderCategories();
        showToast("Category এডিট করা হয়েছে");
    }
}

async function deleteCategory(id) {
    if (window.currentUserRole !== "admin") return;

    if (!confirm("আপনি কি নিশ্চিত এই Category ডিলিট করতে চান? এর ভেতরের সব ডাটা মুছে যাবে!")) return;

    function removeCategoryRecursively(catId) {
        const subCats = database.categories.filter(c => c.parentId === catId);
        subCats.forEach(sc => removeCategoryRecursively(sc.id));

        database.categories = database.categories.filter(c => c.id !== catId);
        database.headers = database.headers.filter(h => h.categoryId !== catId);
        database.data = database.data.filter(d => d.categoryId !== catId);
    }

    removeCategoryRecursively(id);
    await saveDatabase();

    if (currentCategoryId === id) goBack();
    else if (currentCategoryId) renderCategoryDetails();
    else renderCategories();

    showToast("Category ডিলিট করা হয়েছে");
}

/* =========================================
   RENDER LOGIC (MAIN DASHBOARD)
========================================= */

function renderCategories() {
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    const countElement = document.getElementById("categoryCount");
    const searchVal = document.getElementById("searchInput")?.value.trim().toLowerCase();
    const isAdmin = window.currentUserRole === "admin";

    if (!list || !emptyState) return;

    let categoriesToShow = database.categories.filter(cat => !cat.parentId);

    if (searchVal) {
        categoriesToShow = database.categories.filter(cat => 
            cat.name.toLowerCase().includes(searchVal)
        );
    }

    categoriesToShow = getSortedItems(categoriesToShow); // Pin sorting

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
        card.style.cssText = "padding: 15px; border-radius: 8px; background: var(--card-bg, #fff); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(0,0,0,0.1);";
        
        const subCount = database.categories.filter(c => c.parentId === category.id).length;
        const dataCount = database.data.filter(d => d.categoryId === category.id).length;
        const pinIcon = category.pinned ? "📌" : "📍";

        let actionButtonsHTML = "";
        if (isAdmin) {
            actionButtonsHTML = `
                <div style="display: flex; gap: 8px;">
                    <button class="btn-pin-cat secondary-btn" style="padding: 4px 8px;">${pinIcon}</button>
                    <button class="btn-edit-cat secondary-btn" style="padding: 4px 8px;">✏️</button>
                    <button class="btn-del-cat secondary-btn" style="padding: 4px 8px; color: red;">🗑️</button>
                </div>
            `;
        }

        card.innerHTML = `
            <div style="flex-grow: 1; cursor: pointer;" class="cat-click">
                <h3 style="margin:0; font-size:16px;">${category.pinned ? "📌 " : ""}📁 ${escapeHTML(category.name)}</h3>
                <small style="color:gray;">${subCount} Sub-Categories • ${dataCount} Data</small>
            </div>
            ${actionButtonsHTML}
        `;

        card.querySelector(".cat-click").addEventListener("click", () => openCategory(category.id));

        if (isAdmin) {
            card.querySelector(".btn-pin-cat")?.addEventListener("click", (e) => { e.stopPropagation(); togglePin("category", category.id); });
            card.querySelector(".btn-edit-cat")?.addEventListener("click", (e) => { e.stopPropagation(); editCategory(category.id); });
            card.querySelector(".btn-del-cat")?.addEventListener("click", (e) => { e.stopPropagation(); deleteCategory(category.id); });
        }

        list.appendChild(card);
    });
}

/* =========================================
   RENDER LOGIC (CATEGORY DETAILS)
========================================= */

function renderCategoryDetails() {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";
    const isAdmin = window.currentUserRole === "admin";
    const searchVal = document.getElementById("searchInput")?.value.trim().toLowerCase();

    // Render Sub-Categories
    let subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);
    if (searchVal) subCategories = subCategories.filter(c => c.name.toLowerCase().includes(searchVal));
    subCategories = getSortedItems(subCategories);

    if (subCategories.length > 0) {
        const subWrapper = document.createElement("div");
        subWrapper.style.marginBottom = "20px";
        subWrapper.innerHTML = `<h4 style="margin-bottom:10px;">📂 Sub-Categories</h4>`;

        subCategories.forEach(sub => {
            const item = document.createElement("div");
            item.style.cssText = "padding: 12px 15px; background: rgba(0,0,0,0.04); border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; font-weight: 500;";
            const pinIcon = sub.pinned ? "📌" : "📍";

            let subActionsHTML = "";
            if (isAdmin) {
                subActionsHTML = `
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-pin-sub secondary-btn" style="padding: 2px 6px;">${pinIcon}</button>
                        <button class="btn-edit-sub secondary-btn" style="padding: 2px 6px;">✏️</button>
                        <button class="btn-del-sub secondary-btn" style="padding: 2px 6px; color: red;">🗑️</button>
                    </div>
                `;
            }

            item.innerHTML = `
                <span style="cursor:pointer; flex-grow:1;" class="sub-click">${sub.pinned ? "📌 " : ""}📁 ${escapeHTML(sub.name)}</span>
                ${subActionsHTML}
            `;
            item.querySelector(".sub-click").addEventListener("click", () => openCategory(sub.id));

            if (isAdmin) {
                item.querySelector(".btn-pin-sub")?.addEventListener("click", () => togglePin("category", sub.id));
                item.querySelector(".btn-edit-sub")?.addEventListener("click", () => editCategory(sub.id));
                item.querySelector(".btn-del-sub")?.addEventListener("click", () => deleteCategory(sub.id));
            }

            subWrapper.appendChild(item);
        });
        container.appendChild(subWrapper);
    }

    // Render Headers & Data
    let headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    headers = getSortedItems(headers);

    let categoryData = database.data.filter(d => d.categoryId === currentCategoryId);
    if (searchVal) {
        categoryData = categoryData.filter(d => 
            d.title.toLowerCase().includes(searchVal) || 
            (d.description && d.description.toLowerCase().includes(searchVal))
        );
    }

    headers.forEach(header => {
        const headerBox = document.createElement("div");
        headerBox.style.cssText = "margin-bottom: 15px; padding: 12px; border: 1px dashed #ccc; border-radius: 6px;";
        const pinIcon = header.pinned ? "📌" : "📍";

        let headActionsHTML = "";
        if (isAdmin) {
            headActionsHTML = `
                <div style="display:flex; gap:6px;">
                    <button class="btn-pin-head secondary-btn" style="padding:2px 6px;">${pinIcon}</button>
                    <button class="btn-edit-head secondary-btn" style="padding:2px 6px;">✏️</button>
                    <button class="btn-del-head secondary-btn" style="padding:2px 6px; color:red;">🗑️</button>
                </div>
            `;
        }

        headerBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h5 style="margin:0; font-size: 15px;">${header.pinned ? "📌 " : ""}🏷️ ${escapeHTML(header.title)}</h5>
                ${headActionsHTML}
            </div>
        `;

        if (isAdmin) {
            headerBox.querySelector(".btn-pin-head")?.addEventListener("click", () => togglePin("header", header.id));
            headerBox.querySelector(".btn-edit-head")?.addEventListener("click", () => editHeader(header.id));
            headerBox.querySelector(".btn-del-head")?.addEventListener("click", () => deleteHeader(header.id));
        }

        let headerItems = categoryData.filter(d => d.headerId === header.id);
        headerItems = getSortedItems(headerItems);

        headerItems.forEach(item => {
            headerBox.appendChild(createDataCardElement(item));
        });

        container.appendChild(headerBox);
    });

    let noHeaderData = categoryData.filter(d => !d.headerId);
    noHeaderData = getSortedItems(noHeaderData);

    if (noHeaderData.length > 0) {
        const noHeaderBox = document.createElement("div");
        noHeaderBox.innerHTML = `<h5 style="margin: 10px 0;">📄 সাধারণ Data</h5>`;
        noHeaderData.forEach(item => {
            noHeaderBox.appendChild(createDataCardElement(item));
        });
        container.appendChild(noHeaderBox);
    }

    if (subCategories.length === 0 && headers.length === 0 && categoryData.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:gray; margin-top:30px;">কোনো তথ্য পাওয়া যায়নি।</p>`;
    }
}

function createDataCardElement(item) {
    const dataEl = document.createElement("div");
    const isAdmin = window.currentUserRole === "admin";
    const pinIcon = item.pinned ? "📌" : "📍";

    dataEl.style.cssText = "padding:10px; background:var(--card-bg, #fff); margin-bottom:6px; border-radius:4px; border:1px solid #eee; display:flex; justify-content:space-between; align-items:flex-start;";

    let actionButtonsHTML = "";
    if (isAdmin) {
        actionButtonsHTML = `
            <div style="display:flex; gap:6px;">
                <button class="btn-pin-data secondary-btn" style="padding:2px 6px;">${pinIcon}</button>
                <button class="btn-move-data secondary-btn" style="padding:2px 6px;">📦 Move</button>
                <button class="btn-edit-data secondary-btn" style="padding:2px 6px;">✏️</button>
                <button class="btn-del-data secondary-btn" style="padding:2px 6px; color:red;">🗑️</button>
            </div>
        `;
    }

    dataEl.innerHTML = `
        <div>
            <strong>${item.pinned ? "📌 " : ""}${escapeHTML(item.title)}</strong>
            <p style="margin:4px 0 0 0; font-size:13px; color:#555;">${escapeHTML(item.description)}</p>
        </div>
        ${actionButtonsHTML}
    `;

    if (isAdmin) {
        dataEl.querySelector(".btn-pin-data")?.addEventListener("click", () => togglePin("data", item.id));
        dataEl.querySelector(".btn-move-data")?.addEventListener("click", () => openMoveModal(item.id));
        dataEl.querySelector(".btn-edit-data")?.addEventListener("click", () => editData(item.id));
        dataEl.querySelector(".btn-del-data")?.addEventListener("click", () => deleteData(item.id));
    }

    return dataEl;
}

/* =========================================
   HEADER & DATA CRUD + MOVE LOGIC
========================================= */

function openHeaderModal() {
    if (window.currentUserRole !== "admin") return;
    const input = document.getElementById("headerNameInput");
    if (input) input.value = "";
    openModal("headerModal");
}

async function saveHeader() {
    if (window.currentUserRole !== "admin") return;
    const input = document.getElementById("headerNameInput");
    const title = input?.value.trim();

    if (!title || !currentCategoryId) return;

    database.headers.push({
        id: generateId("header"),
        categoryId: currentCategoryId,
        title: title,
        pinned: false
    });

    await saveDatabase();
    closeModal("headerModal");
    renderCategoryDetails();
    showToast("Header সেভ করা হয়েছে");
}

async function editHeader(id) {
    if (window.currentUserRole !== "admin") return;
    const header = database.headers.find(h => h.id === id);
    if (!header) return;

    const newTitle = prompt("নতুন Header Name দিন:", header.title);
    if (newTitle && newTitle.trim() !== "") {
        header.title = newTitle.trim();
        await saveDatabase();
        renderCategoryDetails();
        showToast("Header এডিট করা হয়েছে");
    }
}

async function deleteHeader(id) {
    if (window.currentUserRole !== "admin") return;
    if (!confirm("আপনি কি নিশ্চিত এই Header ডিলিট করতে চান? এর ভেতরের ডাটা সাধারণ ডাটাতে চলে যাবে।")) return;

    database.headers = database.headers.filter(h => h.id !== id);
    database.data.forEach(d => {
        if (d.headerId === id) d.headerId = null;
    });

    await saveDatabase();
    renderCategoryDetails();
    showToast("Header ডিলিট করা হয়েছে");
}

function openDataModal() {
    if (window.currentUserRole !== "admin") return;
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
    if (window.currentUserRole !== "admin") return;
    const title = document.getElementById("dataTitleInput")?.value.trim();
    const desc = document.getElementById("dataDescriptionInput")?.value.trim();
    const headerId = document.getElementById("dataHeaderSelect")?.value;

    if (!title || !currentCategoryId) return;

    database.data.push({
        id: generateId("data"),
        categoryId: currentCategoryId,
        headerId: headerId || null,
        title: title,
        description: desc,
        pinned: false
    });

    await saveDatabase();
    closeModal("dataModal");
    renderCategoryDetails();
    showToast("Data সেভ করা হয়েছে");
}

async function editData(id) {
    if (window.currentUserRole !== "admin") return;
    const item = database.data.find(d => d.id === id);
    if (!item) return;

    const newTitle = prompt("নতুন Title দিন:", item.title);
    if (newTitle === null) return;
    const newDesc = prompt("নতুন বিবরণ দিন:", item.description);
    if (newDesc === null) return;

    item.title = newTitle.trim();
    item.description = newDesc.trim();

    await saveDatabase();
    renderCategoryDetails();
    showToast("Data এডিট করা হয়েছে");
}

async function deleteData(id) {
    if (window.currentUserRole !== "admin") return;
    if (!confirm("আপনি কি নিশ্চিত এই Data ডিলিট করতে চান?")) return;

    database.data = database.data.filter(d => d.id !== id);
    await saveDatabase();
    renderCategoryDetails();
    showToast("Data ডিলিট করা হয়েছে");
}

/* =========================================
   MODAL BASED FAST MOVE DATA
========================================= */

function openMoveModal(dataId) {
    if (window.currentUserRole !== "admin") return;
    targetMoveDataId = dataId;
    const item = database.data.find(d => d.id === dataId);
    if (!item) return;

    const catSelect = document.getElementById("moveCategorySelect");
    const headSelect = document.getElementById("moveHeaderSelect");
    if (!catSelect || !headSelect) return;

    catSelect.innerHTML = "";
    database.categories.forEach(cat => {
        const selected = cat.id === item.categoryId ? "selected" : "";
        catSelect.innerHTML += `<option value="${cat.id}" ${selected}>📁 ${escapeHTML(cat.name)}</option>`;
    });

    const updateHeaderOptions = (selectedCatId) => {
        headSelect.innerHTML = `<option value="">📄 সাধারণ Data (Header ছাড়া)</option>`;
        const headers = database.headers.filter(h => h.categoryId === selectedCatId);
        headers.forEach(h => {
            const selected = (h.id === item.headerId && selectedCatId === item.categoryId) ? "selected" : "";
            headSelect.innerHTML += `<option value="${h.id}" ${selected}>🏷️ ${escapeHTML(h.title)}</option>`;
        });
    };

    updateHeaderOptions(catSelect.value);

    catSelect.onchange = (e) => {
        updateHeaderOptions(e.target.value);
    };

    openModal("moveDataModal");
}

async function confirmMoveData() {
    if (window.currentUserRole !== "admin" || !targetMoveDataId) return;

    const item = database.data.find(d => d.id === targetMoveDataId);
    const selectedCatId = document.getElementById("moveCategorySelect")?.value;
    const selectedHeadId = document.getElementById("moveHeaderSelect")?.value;

    if (item && selectedCatId) {
        item.categoryId = selectedCatId;
        item.headerId = selectedHeadId || null;

        await saveDatabase();
        closeModal("moveDataModal");
        renderCategoryDetails();
        showToast("Data সফলভাবে স্থানান্তর করা হয়েছে");
    }
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
    if (currentCategoryId) renderCategoryDetails();
    else renderCategories();
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
