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
    initTheme();
});

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
        showToast("ডাটা সেভ করতে সমস্যা হয়েছে");
    }
}

function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
}

/* =========================================
   EVENTS SETUP
========================================= */

function setupEvents() {
    // Night Mode Toggle
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);

    document.getElementById("addCategoryBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("emptyAddBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("addSubCategoryBtn")?.addEventListener("click", () => openCategoryModal(true));

    document.getElementById("saveCategoryBtn")?.addEventListener("click", saveCategory);
    document.getElementById("saveHeaderBtn")?.addEventListener("click", saveHeader);
    document.getElementById("saveDataBtn")?.addEventListener("click", saveData);

    document.getElementById("addHeaderBtn")?.addEventListener("click", openHeaderModal);
    document.getElementById("addDataBtn")?.addEventListener("click", openDataModal);

    // Navigation Back Button
    document.getElementById("backToMainBtn")?.addEventListener("click", goBack);

    document.getElementById("searchBtn")?.addEventListener("click", toggleSearch);
    document.getElementById("clearSearch")?.addEventListener("click", clearSearch);
    document.getElementById("searchInput")?.addEventListener("input", renderCategories);

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
    const modalTitle = document.getElementById("categoryModalTitle");
    if (modalTitle) modalTitle.textContent = isSubCategory ? "নতুন Sub-Category" : "নতুন Category";

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

    database.categories.push({
        id: generateId("cat"),
        name: name,
        parentId: currentCategoryId ? currentCategoryId : null,
        createdAt: Date.now()
    });

    await saveDatabase();
    closeModal("categoryModal");

    if (currentCategoryId) renderCategoryDetails();
    else renderCategories();
    
    showToast("Category সেভ করা হয়েছে");
}

async function editCategory(id) {
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
    if (!confirm("আপনি কি নিশ্চিত এই Category ডিলিট করতে চান? এর ভেতরের সব ডাটা মুছে যাবে!")) return;

    // Recursive deletion function
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
        card.style.cssText = "padding: 15px; border-radius: 8px; background: var(--card-bg, #fff); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(0,0,0,0.1);";
        
        const subCount = database.categories.filter(c => c.parentId === category.id).length;
        const dataCount = database.data.filter(d => d.categoryId === category.id).length;

        card.innerHTML = `
            <div style="flex-grow: 1; cursor: pointer;" class="cat-click">
                <h3 style="margin:0; font-size:16px;">📁 ${escapeHTML(category.name)}</h3>
                <small style="color:gray;">${subCount} Sub-Categories • ${dataCount} Data</small>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn-edit-cat secondary-btn" style="padding: 4px 8px;">✏️</button>
                <button class="btn-del-cat secondary-btn" style="padding: 4px 8px; color: red;">🗑️</button>
            </div>
        `;

        card.querySelector(".cat-click").addEventListener("click", () => openCategory(category.id));
        card.querySelector(".btn-edit-cat").addEventListener("click", (e) => { e.stopPropagation(); editCategory(category.id); });
        card.querySelector(".btn-del-cat").addEventListener("click", (e) => { e.stopPropagation(); deleteCategory(category.id); });

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

    // Render Sub-Categories
    const subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);
    if (subCategories.length > 0) {
        const subWrapper = document.createElement("div");
        subWrapper.style.marginBottom = "20px";
        subWrapper.innerHTML = `<h4 style="margin-bottom:10px;">📂 Sub-Categories</h4>`;

        subCategories.forEach(sub => {
            const item = document.createElement("div");
            item.style.cssText = "padding: 12px 15px; background: rgba(0,0,0,0.04); border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; font-weight: 500;";
            item.innerHTML = `
                <span style="cursor:pointer; flex-grow:1;" class="sub-click">📁 ${escapeHTML(sub.name)}</span>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-edit-sub secondary-btn" style="padding: 2px 6px;">✏️</button>
                    <button class="btn-del-sub secondary-btn" style="padding: 2px 6px; color: red;">🗑️</button>
                </div>
            `;
            item.querySelector(".sub-click").addEventListener("click", () => openCategory(sub.id));
            item.querySelector(".btn-edit-sub").addEventListener("click", () => editCategory(sub.id));
            item.querySelector(".btn-del-sub").addEventListener("click", () => deleteCategory(sub.id));

            subWrapper.appendChild(item);
        });
        container.appendChild(subWrapper);
    }

    // Render Headers & Data
    const headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    const categoryData = database.data.filter(d => d.categoryId === currentCategoryId);

    headers.forEach(header => {
        const headerBox = document.createElement("div");
        headerBox.style.cssText = "margin-bottom: 15px; padding: 12px; border: 1px dashed #ccc; border-radius: 6px;";
        headerBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h5 style="margin:0; font-size: 15px;">🏷️ ${escapeHTML(header.title)}</h5>
                <div style="display:flex; gap:6px;">
                    <button class="btn-edit-head secondary-btn" style="padding:2px 6px;">✏️</button>
                    <button class="btn-del-head secondary-btn" style="padding:2px 6px; color:red;">🗑️</button>
                </div>
            </div>
        `;

        headerBox.querySelector(".btn-edit-head").addEventListener("click", () => editHeader(header.id));
        headerBox.querySelector(".btn-del-head").addEventListener("click", () => deleteHeader(header.id));

        const headerItems = categoryData.filter(d => d.headerId === header.id);
        headerItems.forEach(item => {
            headerBox.appendChild(createDataCardElement(item));
        });

        container.appendChild(headerBox);
    });

    const noHeaderData = categoryData.filter(d => !d.headerId);
    if (noHeaderData.length > 0) {
        const noHeaderBox = document.createElement("div");
        noHeaderBox.innerHTML = `<h5 style="margin: 10px 0;">📄 সাধারণ Data</h5>`;
        noHeaderData.forEach(item => {
            noHeaderBox.appendChild(createDataCardElement(item));
        });
        container.appendChild(noHeaderBox);
    }

    if (subCategories.length === 0 && headers.length === 0 && categoryData.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:gray; margin-top:30px;">এটি একটি খালি ক্যাটাগরি। সাব-ক্যাটাগরি, হেডার অথবা ডাটা যোগ করুন।</p>`;
    }
}

function createDataCardElement(item) {
    const dataEl = document.createElement("div");
    dataEl.style.cssText = "padding:10px; background:var(--card-bg, #fff); margin-bottom:6px; border-radius:4px; border:1px solid #eee; display:flex; justify-content:space-between; align-items:flex-start;";
    dataEl.innerHTML = `
        <div>
            <strong>${escapeHTML(item.title)}</strong>
            <p style="margin:4px 0 0 0; font-size:13px; color:#555;">${escapeHTML(item.description)}</p>
        </div>
        <div style="display:flex; gap:6px;">
            <button class="btn-move-data secondary-btn" style="padding:2px 6px;">📦 Move</button>
            <button class="btn-edit-data secondary-btn" style="padding:2px 6px;">✏️</button>
            <button class="btn-del-data secondary-btn" style="padding:2px 6px; color:red;">🗑️</button>
        </div>
    `;

    dataEl.querySelector(".btn-move-data").addEventListener("click", () => moveData(item.id));
    dataEl.querySelector(".btn-edit-data").addEventListener("click", () => editData(item.id));
    dataEl.querySelector(".btn-del-data").addEventListener("click", () => deleteData(item.id));

    return dataEl;
}

/* =========================================
   HEADER & DATA CRUD + MOVE LOGIC
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

async function editHeader(id) {
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
    if (!confirm("আপনি কি নিশ্চিত এই Header ডিলিট করতে চান? এর ভেতরের ডাটা সাধারণ ডাটাতে চলে যাবে।")) return;

    database.headers = database.headers.filter(h => h.id !== id);
    // Move associated data to no-header
    database.data.forEach(d => {
        if (d.headerId === id) d.headerId = null;
    });

    await saveDatabase();
    renderCategoryDetails();
    showToast("Header ডিলিট করা হয়েছে");
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

async function editData(id) {
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
    if (!confirm("আপনি কি নিশ্চিত এই Data ডিলিট করতে চান?")) return;

    database.data = database.data.filter(d => d.id !== id);
    await saveDatabase();
    renderCategoryDetails();
    showToast("Data ডিলিট করা হয়েছে");
}

/* =========================================
   UPDATED MOVE DATA LOGIC
========================================= */

async function moveData(id) {
    const item = database.data.find(d => d.id === id);
    if (!item) return;

    // ১. অন্য সব ক্যাটাগরি ফিল্টার করা (বর্তমান ক্যাটাগরি বাদে)
    const availableCategories = database.categories.filter(c => c.id !== currentCategoryId);
    if (availableCategories.length === 0) {
        showToast("অন্য কোনো Category নেই ডাটা সরানোর জন্য");
        return;
    }

    // ২. টার্গেট ক্যাটাগরি সিলেক্ট করা
    let categoryListText = availableCategories.map((c, index) => `${index + 1}. ${c.name}`).join("\n");
    const catChoice = prompt(`কোন Category তে সরাতে চান সংখ্যাটি লিখুন:\n\n${categoryListText}`);

    if (!catChoice) return; // ক্যানসেল করলে বের হয়ে যাবে

    const selectedCatIndex = parseInt(catChoice) - 1;
    const targetCategory = availableCategories[selectedCatIndex];

    if (!targetCategory) {
        showToast("সঠিক Category নির্বাচন করেননি");
        return;
    }

    // ৩. সিলেক্ট করা ক্যাটাগরির অন্তর্ভুক্ত হেডারগুলো খুঁজে বের করা
    const targetHeaders = database.headers.filter(h => h.categoryId === targetCategory.id);

    let chosenHeaderId = null;

    if (targetHeaders.length > 0) {
        // ৪. হেডার থাকলে হেডার বেছে নেওয়ার অপশন দেওয়া
        let headerListText = "0. সাধারণ ডাটা (কোনো Header ছাড়া)\n";
        headerListText += targetHeaders.map((h, index) => `${index + 1}. ${h.title}`).join("\n");

        const headChoice = prompt(`"${targetCategory.name}" Category-এর কোন Header এ ডাটাটি রাখবেন?\n\n${headerListText}`);

        if (headChoice === null) return; // ক্যানসেল করলে অপশন বাতিল

        const selectedHeadIndex = parseInt(headChoice);
        
        if (selectedHeadIndex > 0 && selectedHeadIndex <= targetHeaders.length) {
            chosenHeaderId = targetHeaders[selectedHeadIndex - 1].id;
        } else {
            chosenHeaderId = null; // ০ চাপলে বা ভুল ইনপুট দিলে সাধারণ ডাটা হিসেবে যাবে
        }
    }

    // ৫. ডাটার ক্যাটাগরি এবং হেডার আইডি আপডেট ও ফায়ারবেসে সেভ
    item.categoryId = targetCategory.id;
    item.headerId = chosenHeaderId;

    await saveDatabase();
    renderCategoryDetails();
    
    showToast(`Data সফলভাবে "${targetCategory.name}" এ সরিয়ে নেওয়া হয়েছে`);
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
