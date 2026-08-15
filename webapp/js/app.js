import {
    watchAuth,
    logoutUser
} from "./auth.js";

import {
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

"use strict";

/* =========================================
   DATABASE & STATE
========================================= */

let database = {
    categories: [],
    headers: [],
    data: []
};

let currentCategoryId = null;
let editingCategoryId = null;

/* =========================================
   AUTH WATCHER & LOAD
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
        console.log("Firebase-এ ডাটা সেভ সফল হয়েছে");
    } catch (error) {
        console.error("Database save error:", error);
        showToast("ফায়ারবেসে ডাটা সেভ করতে সমস্যা হয়েছে");
    }
}

/* =========================================
   ID GENERATOR
========================================= */

function generateId(prefix) {
    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}

/* =========================================
   EVENTS
========================================= */

function setupEvents() {

    /* Logout Event */
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await logoutUser();
            window.location.href = "login.html";
        });
    }

    /* Add Category */
    document
        .getElementById("addCategoryBtn")
        .addEventListener("click", openAddCategory);

    document
        .getElementById("emptyAddBtn")
        .addEventListener("click", openAddCategory);

    /* Add Sub-Category */
    document
        .getElementById("addSubCategoryBtn")
        ?.addEventListener("click", openAddCategory);

    /* Save Category */
    document
        .getElementById("saveCategoryBtn")
        .addEventListener("click", saveCategory);

    /* Save Header */
    document
        .getElementById("saveHeaderBtn")
        .addEventListener("click", saveHeader);

    /* Save Data */
    document
        .getElementById("saveDataBtn")
        .addEventListener("click", saveData);

    /* Add Header */
    document
        .getElementById("addHeaderBtn")
        .addEventListener("click", openHeaderModal);

    /* Add Data */
    document
        .getElementById("addDataBtn")
        .addEventListener("click", openDataModal);

    /* Search */
    document
        .getElementById("searchBtn")
        .addEventListener("click", toggleSearch);

    document
        .getElementById("searchInput")
        .addEventListener("input", renderCategories);

    document
        .getElementById("clearSearch")
        .addEventListener("click", () => {
            document.getElementById("searchInput").value = "";
            renderCategories();
        });

    /* Theme */
    document
        .getElementById("themeBtn")
        .addEventListener("click", toggleTheme);

    /* Close buttons */
    document
        .querySelectorAll("[data-close]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const modalId = button.dataset.close;
                closeModal(modalId);
            });
        });

    /* Close modal by background */
    document
        .querySelectorAll(".modal")
        .forEach(modal => {
            modal.addEventListener("click", event => {
                if (event.target === modal) {
                    closeModal(modal.id);
                }
            });
        });

    /* Escape Key */
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document
                .querySelectorAll(".modal")
                .forEach(modal => {
                    modal.classList.add("hidden");
                });
        }
    });
}

/* =========================================
   CATEGORY LOGIC
========================================= */

function openAddCategory() {
    editingCategoryId = null;

    document.getElementById("categoryModalTitle").textContent = currentCategoryId ? "নতুন Sub-Category" : "নতুন Category";
    document.getElementById("categoryNameInput").value = "";

    openModal("categoryModal");

    setTimeout(() => {
        document.getElementById("categoryNameInput").focus();
    }, 100);
}

function openEditCategory(id) {
    const category = database.categories.find(item => item.id === id);
    if (!category) return;

    editingCategoryId = id;

    document.getElementById("categoryModalTitle").textContent = "Category Edit";
    document.getElementById("categoryNameInput").value = category.name;

    openModal("categoryModal");
}

async function saveCategory() {
    const input = document.getElementById("categoryNameInput");
    const name = input.value.trim();

    if (!name) {
        showToast("Category Name লিখুন");
        input.focus();
        return;
    }

    if (editingCategoryId) {
        const category = database.categories.find(item => item.id === editingCategoryId);
        if (category) {
            category.name = name;
            category.updatedAt = Date.now();
        }
        showToast("Category আপডেট হয়েছে");
    } else {
        database.categories.push({
            id: generateId("cat"),
            name: name,
            parentId: currentCategoryId ? currentCategoryId : null,
            order: database.categories.length,
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        showToast("Category তৈরি হয়েছে");
    }

    await saveDatabase();
    closeModal("categoryModal");

    if (currentCategoryId) {
        renderCategoryDetails();
    } else {
        renderCategories();
    }
}

async function deleteCategory(id) {
    const category = database.categories.find(item => item.id === id);
    if (!category) return;

    const confirmed = confirm(`"${category.name}" Category মুছে ফেলবেন?`);
    if (!confirmed) return;

    function removeCategoryAndChildren(catId) {
        const children = database.categories.filter(item => item.parentId === catId);
        children.forEach(child => removeCategoryAndChildren(child.id));

        database.categories = database.categories.filter(item => item.id !== catId);
        database.headers = database.headers.filter(item => item.categoryId !== catId);
        database.data = database.data.filter(item => item.categoryId !== catId);
    }

    removeCategoryAndChildren(id);

    await saveDatabase();

    if (currentCategoryId === id) {
        closeModal("detailsModal");
        currentCategoryId = null;
    } else if (currentCategoryId) {
        renderCategoryDetails();
    }
    
    renderCategories();
    showToast("Category মুছে ফেলা হয়েছে");
}

/* =========================================
   CATEGORY RENDER (Root Level Only)
========================================= */

function renderCategories() {
    const list = document.getElementById("categoryList");
    const empty = document.getElementById("emptyState");

    const search = document.getElementById("searchInput").value.trim().toLowerCase();

    let categories = [...database.categories];

    // সার্চ না থাকলে মেইন স্ক্রিনে কেবল Root Category দেখাবে
    if (!search) {
        categories = categories.filter(category => !category.parentId);
    }

    categories.sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return b.pinned - a.pinned;
        }
        return a.order - b.order;
    });

    if (search) {
        categories = categories.filter(category => {
            const categoryMatch = category.name.toLowerCase().includes(search);
            const headerMatch = database.headers.some(
                header => header.categoryId === category.id && header.title.toLowerCase().includes(search)
            );
            const dataMatch = database.data.some(
                data =>
                    data.categoryId === category.id &&
                    (data.title.toLowerCase().includes(search) || data.description.toLowerCase().includes(search))
            );
            return categoryMatch || headerMatch || dataMatch;
        });
    }

    list.innerHTML = "";
    document.getElementById("categoryCount").textContent = `${database.categories.length}টি Category`;

    if (database.categories.length === 0) {
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    if (categories.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔎</div>
                <h2>কোনো ফলাফল পাওয়া যায়নি</h2>
                <p>অন্য কিছু লিখে আবার চেষ্টা করুন।</p>
            </div>
        `;
        return;
    }

    categories.forEach(category => {
        const headerCount = database.headers.filter(item => item.categoryId === category.id).length;
        const dataCount = database.data.filter(item => item.categoryId === category.id).length;

        const card = document.createElement("div");
        card.className = "category-card";

        card.innerHTML = `
            <div class="category-top">
                <div class="category-icon">📁</div>
                <div class="category-info">
                    <div class="category-name">${escapeHTML(category.name)}</div>
                    <div class="category-meta">${headerCount} Header • ${dataCount} Data</div>
                </div>
                <div class="category-menu">
                    <button class="small-btn" title="Edit" data-action="edit">✏️</button>
                    <button class="small-btn" title="Delete" data-action="delete">🗑️</button>
                </div>
            </div>
        `;

        card.addEventListener("click", event => {
            const action = event.target.dataset.action;

            if (action === "edit") {
                openEditCategory(category.id);
                return;
            }

            if (action === "delete") {
                deleteCategory(category.id);
                return;
            }

            openCategory(category.id);
        });

        list.appendChild(card);
    });
}

/* =========================================
   CATEGORY DETAILS & SUB-CATEGORIES
========================================= */

function openCategory(id) {
    const category = database.categories.find(item => item.id === id);
    if (!category) return;

    currentCategoryId = id;

    // ব্যাক বাটনের ব্যবস্থা (যদি কোনো Parent Category থাকে)
    const titleContainer = document.getElementById("detailsTitle");
    if (category.parentId) {
        titleContainer.innerHTML = `
            <span id="backCatBtn" style="cursor:pointer; margin-right:8px;" title="Back">⬅️</span>
            ${escapeHTML(category.name)}
        `;
        setTimeout(() => {
            document.getElementById("backCatBtn")?.addEventListener("click", (e) => {
                e.stopPropagation();
                openCategory(category.parentId);
            });
        }, 50);
    } else {
        titleContainer.textContent = category.name;
    }

    const headers = database.headers.filter(item => item.categoryId === id);
    const data = database.data.filter(item => item.categoryId === id);

    document.getElementById("detailsSubtitle").textContent = `${headers.length} Header • ${data.length} Data`;

    renderCategoryDetails();

    const detailsModal = document.getElementById("detailsModal");
    if (detailsModal.classList.contains("hidden")) {
        openModal("detailsModal");
    }
}

function renderCategoryDetails() {
    const container = document.getElementById("detailsContent");

    // ১. বর্তমান ক্যাটাগরির অধীনে থাকা Sub-categories
    const subCategories = database.categories.filter(
        item => item.parentId === currentCategoryId
    );

    // ২. বর্তমান ক্যাটাগরির অধীনে থাকা Headers
    const headers = database.headers
        .filter(item => item.categoryId === currentCategoryId)
        .sort((a, b) => a.order - b.order);

    // ৩. বর্তমান ক্যাটাগরির অধীনে থাকা Data
    const data = database.data
        .filter(item => item.categoryId === currentCategoryId)
        .sort((a, b) => a.order - b.order);

    container.innerHTML = "";

    /* Sub-categories Render */
    if (subCategories.length > 0) {
        const subSec = document.createElement("div");
        subSec.className = "subcategory-section";
        subSec.style.marginBottom = "20px";
        subSec.innerHTML = `<h3 style="margin-bottom:10px; font-size:16px;">📂 Sub-Categories</h3>`;

        const subList = document.createElement("div");
        subList.className = "category-list";

        subCategories.forEach(sub => {
            const card = document.createElement("div");
            card.className = "category-card";
            card.innerHTML = `
                <div class="category-top">
                    <div class="category-icon">📁</div>
                    <div class="category-info">
                        <div class="category-name">${escapeHTML(sub.name)}</div>
                    </div>
                    <div class="category-menu">
                        <button class="small-btn" title="Edit" data-action="edit">✏️</button>
                        <button class="small-btn" title="Delete" data-action="delete">🗑️</button>
                    </div>
                </div>
            `;

            card.addEventListener("click", event => {
                const action = event.target.dataset.action;
                if (action === "edit") {
                    openEditCategory(sub.id);
                    return;
                }
                if (action === "delete") {
                    deleteCategory(sub.id);
                    return;
                }
                // পর্যায়ক্রমে গভীরে ঢোকার জন্য
                openCategory(sub.id);
            });

            subList.appendChild(card);
        });

        subSec.appendChild(subList);
        container.appendChild(subSec);
    }

    /* Headers Section */
    headers.forEach(header => {
        const section = document.createElement("div");
        section.className = "header-section";
        const headerData = data.filter(item => item.headerId === header.id);

        section.innerHTML = `
            <div class="header-title">
                <span>🏷️ ${escapeHTML(header.title)}</span>
                <button class="small-btn" title="Delete Header">🗑️</button>
            </div>
            <div class="header-data"></div>
        `;

        section.querySelector("button").addEventListener("click", () => {
            deleteHeader(header.id);
        });

        const dataContainer = section.querySelector(".header-data");

        if (headerData.length === 0) {
            dataContainer.innerHTML = `
                <p style="color:var(--muted); padding:10px;">
                    এই Header-এর অধীনে এখনো কোনো Data নেই।
                </p>
            `;
        } else {
            headerData.forEach(item => {
                dataContainer.appendChild(createDataCard(item));
            });
        }

        container.appendChild(section);
    });

    /* Data without Header Section */
    const noHeaderData = data.filter(item => !item.headerId);

    if (noHeaderData.length > 0) {
        const section = document.createElement("div");
        section.className = "header-section";

        section.innerHTML = `
            <div class="header-title">
                <span>📄 সাধারণ Data</span>
            </div>
            <div class="header-data"></div>
        `;

        const dataContainer = section.querySelector(".header-data");

        noHeaderData.forEach(item => {
            dataContainer.appendChild(createDataCard(item));
        });

        container.appendChild(section);
    }

    if (subCategories.length === 0 && headers.length === 0 && data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h2>এই Category এখনো খালি</h2>
                <p>নতুন Sub-Category, Header অথবা Data যোগ করতে উপরের বাটন ব্যবহার করুন।</p>
            </div>
        `;
    }
}

/* =========================================
   HEADER LOGIC
========================================= */

function openHeaderModal() {
    if (!currentCategoryId) {
        showToast("আগে একটি Category নির্বাচন করুন");
        return;
    }

    document.getElementById("headerNameInput").value = "";
    openModal("headerModal");

    setTimeout(() => {
        document.getElementById("headerNameInput").focus();
    }, 100);
}

async function saveHeader() {
    const input = document.getElementById("headerNameInput");
    const title = input.value.trim();

    if (!title) {
        showToast("Header Name লিখুন");
        return;
    }

    database.headers.push({
        id: generateId("header"),
        categoryId: currentCategoryId,
        title: title,
        order: database.headers.filter(item => item.categoryId === currentCategoryId).length,
        createdAt: Date.now()
    });

    await saveDatabase();
    closeModal("headerModal");
    renderCategoryDetails();
    renderCategories();
    showToast("Header তৈরি হয়েছে");
}

async function deleteHeader(id) {
    const header = database.headers.find(item => item.id === id);
    if (!header) return;

    const confirmed = confirm(`"${header.title}" Header মুছে ফেলবেন?`);
    if (!confirmed) return;

    database.headers = database.headers.filter(item => item.id !== id);

    database.data.forEach(item => {
        if (item.headerId === id) {
            item.headerId = null;
        }
    });

    await saveDatabase();
    renderCategoryDetails();
    renderCategories();
    showToast("Header মুছে ফেলা হয়েছে");
}

/* =========================================
   DATA LOGIC
========================================= */

function openDataModal() {
    if (!currentCategoryId) {
        showToast("আগে একটি Category নির্বাচন করুন");
        return;
    }

    document.getElementById("dataTitleInput").value = "";
    document.getElementById("dataDescriptionInput").value = "";

    populateHeaderSelect();
    openModal("dataModal");
}

function populateHeaderSelect() {
    const select = document.getElementById("dataHeaderSelect");
    const headers = database.headers.filter(item => item.categoryId === currentCategoryId);

    select.innerHTML = `<option value="">Header ছাড়া</option>`;

    headers.forEach(header => {
        const option = document.createElement("option");
        option.value = header.id;
        option.textContent = header.title;
        select.appendChild(option);
    });
}

async function saveData() {
    const title = document.getElementById("dataTitleInput").value.trim();
    const description = document.getElementById("dataDescriptionInput").value.trim();
    const headerId = document.getElementById("dataHeaderSelect").value;

    if (!title) {
        showToast("Data Title লিখুন");
        return;
    }

    database.data.push({
        id: generateId("data"),
        categoryId: currentCategoryId,
        headerId: headerId || null,
        title: title,
        description: description,
        order: database.data.filter(item => item.categoryId === currentCategoryId).length,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    await saveDatabase();
    closeModal("dataModal");
    renderCategoryDetails();
    renderCategories();
    showToast("Data তৈরি হয়েছে");
}

/* =========================================
   DATA CARD
========================================= */

function createDataCard(item) {
    const card = document.createElement("div");
    card.className = "data-card";

    card.innerHTML = `
        <div class="data-title">
            ${escapeHTML(item.title)}
        </div>
        ${
            item.description
                ? `<div class="data-description">${escapeHTML(item.description)}</div>`
                : ""
        }
    `;

    return card;
}

/* =========================================
   SEARCH & THEME LOGIC
========================================= */

function toggleSearch() {
    const box = document.getElementById("searchBox");
    box.classList.toggle("hidden");

    if (!box.classList.contains("hidden")) {
        document.getElementById("searchInput").focus();
    }
}

function toggleTheme() {
    const dark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
    updateThemeButton();
}

function loadTheme() {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
        document.body.classList.add("dark");
    }
    updateThemeButton();
}

function updateThemeButton() {
    const button = document.getElementById("themeBtn");
    if (button) {
        button.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    }
}

/* =========================================
   MODALS & TOAST
========================================= */

function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
    
    // মোডাল সম্পূর্ণ বন্ধ হলে স্টেট রিসেট হবে
    if (id === "detailsModal") {
        currentCategoryId = null;
        renderCategories();
    }
}

let toastTimer;

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

/* =========================================
   SECURITY / HTML ESCAPE
========================================= */

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
