import {
    watchAuth,
    loginAdmin,
    logoutAdmin
} from "./auth.js";

import {
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import {
    db
} from "./firebase.js";

"use strict";

/* =========================================
   HTML Escape
========================================= */
function escapeHTML(str) {
    return String(str || "").replace(
        /[&<>"']/g,
        match => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[match])
    );
}

/* =========================================
   Global Variables
========================================= */
let database = {
    categories: [],
    headers: [],
    data: []
};

let currentCategoryId = null;
let currentDataId = null;
let editingItem = null;
let movingDataId = null;
let isAllSearchActive = false;
let isSearchMode = false;

window.currentUserRole = "guest";

/* =========================================
   Offline Status Monitoring
========================================= */
function checkOnlineStatus() {
    if (!navigator.onLine) {
        showToast("⚠️ ইন্টারনেট সংযোগ নেই!");
        loadLocalCache();
    }
}

window.addEventListener('online', () => {
    showToast("🟢 অনলাইন মোডে আছেন ");
    loadDatabase();
});

window.addEventListener('offline', checkOnlineStatus);

/* =========================================
   Authentication
========================================= */
watchAuth((user, role) => {
    const adminBtn = document.getElementById("adminLoginBtn");

    if (!user) {
        window.currentUser = null;
        window.currentUserRole = "guest";
        if (adminBtn) {
            adminBtn.textContent = "🔑 Admin";
            adminBtn.classList.add("hidden");
        }
    } else {
        window.currentUser = user;
        window.currentUserRole = role || "admin";
        if (adminBtn) {
            adminBtn.textContent = "🟢 Admin";
            adminBtn.classList.remove("hidden");
        }
    }

    updateAdminUI();
    loadDatabase();
});

/* =========================================
   Admin / User UI
========================================= */
function updateAdminUI() {
    const isAdmin = window.currentUserRole === "admin";
    const topbar = document.querySelector(".topbar");

    if (topbar) {
        if (isAdmin) {
            topbar.classList.add("admin-header");
            topbar.classList.remove("user-header");
        } else {
            topbar.classList.add("user-header");
            topbar.classList.remove("admin-header");
        }
    }

    document.querySelectorAll(".admin-only").forEach(el => {
        if (isAdmin) {
            el.classList.remove("hidden");
        } else {
            el.classList.add("hidden");
        }
    });

    const loginForm = document.getElementById("loginFormContainer");
    const logoutContainer = document.getElementById("logoutContainer");

    if (loginForm) {
        loginForm.style.display = isAdmin ? "none" : "block";
    }

    if (logoutContainer) {
        if (isAdmin) {
            logoutContainer.classList.remove("hidden");
        } else {
            logoutContainer.classList.add("hidden");
        }
    }
}

/* =========================================
   DOM Ready
========================================= */
document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    initTheme();
    updateAdminUI();

    loadLocalCache();
    checkOnlineStatus();

    history.replaceState({ page: "home" }, "");
    window.addEventListener("popstate", handlePopState);
});

/* =========================================
   Search Toggle & Navigation Icons
========================================= */
function setNavState(searchActive) {
    isSearchMode = searchActive;
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");

    if (searchActive) {
        menuIcon?.classList.add("hidden");
        backIcon?.classList.remove("hidden");
    } else {
        menuIcon?.classList.remove("hidden");
        backIcon?.classList.add("hidden");
    }
}

function openHeaderSearch() {
    const searchBox = document.getElementById("searchBox");
    const appTitle = document.getElementById("appTitle");
    const searchBtn = document.getElementById("searchBtn");

    if (searchBox && appTitle) {
        searchBox.classList.remove("hidden");
        appTitle.classList.add("hidden");
        if (searchBtn) searchBtn.classList.add("hidden");
        setNavState(true);
        document.getElementById("searchInput")?.focus();
    }
}

function closeHeaderSearch() {
    const searchBox = document.getElementById("searchBox");
    const appTitle = document.getElementById("appTitle");
    const searchBtn = document.getElementById("searchBtn");
    const input = document.getElementById("searchInput");

    if (searchBox && appTitle) {
        searchBox.classList.add("hidden");
        appTitle.classList.remove("hidden");
        if (searchBtn) searchBtn.classList.remove("hidden");
        if (input) input.value = "";
        setNavState(false);
        handleSearch();
    }
}

/* =========================================
   Browser Back Handling
========================================= */
function handlePopState(event) {
    closeHeaderSearch();

    const state = event.state;

    if (!state || state.page === "home") {
        closeAllSearchUI();
        showMainDashboardView(false);
    } else if (state.page === "allSearch") {
        if (!isAllSearchActive) {
            activateAllSearchUI();
        }
    } else if (state.page === "category") {
        closeAllSearchUI();
        showCategoryView(state.categoryId, false);
    } else if (state.page === "data") {
        closeAllSearchUI();
        showDataPage(state.dataId, false);
    }
}

/* =========================================
   Theme
========================================= */
function initTheme() {
    if (localStorage.getItem("theme") === "dark") {
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
   Database Load & Cache
========================================= */
function loadLocalCache() {
    const cached = localStorage.getItem("police_phonebook_data");
    if (cached) {
        try {
            database = JSON.parse(cached);
            if (!database.categories) database.categories = [];
            if (!database.headers) database.headers = [];
            if (!database.data) database.data = [];
            refreshCurrentView();
        } catch (e) {
            console.error("Local Cache Error:", e);
        }
    }
}

async function loadDatabase() {
    loadLocalCache();

    if (!navigator.onLine) return;

    try {
        const snapshot = await get(ref(db, "webapp/public_data"));

        if (snapshot.exists()) {
            database = snapshot.val();
            if (!database.categories) database.categories = [];
            if (!database.headers) database.headers = [];
            if (!database.data) database.data = [];
            
            localStorage.setItem("police_phonebook_data", JSON.stringify(database));
            refreshCurrentView();
        }
    } catch (error) {
        console.error("Database load error:", error);
    }
}

/* =========================================
   Firebase Database Save
========================================= */
async function saveDatabase() {
    if (window.currentUserRole !== "admin") {
        showToast("শুধুমাত্র Admin পরিবর্তন সেভ করতে পারবেন");
        return;
    }

    localStorage.setItem("police_phonebook_data", JSON.stringify(database));

    if (!navigator.onLine) {
        showToast("অফলাইনে সেভ হয়েছে! ইন্টারনেট এলে ডাটাবেজে যুক্ত হবে।");
        return;
    }

    try {
        await set(ref(db, "webapp/public_data"), database);
    } catch (error) {
        console.error("Database save error:", error);
        showToast("ডাটা সেভ করতে সমস্যা হয়েছে");
    }
}

/* =========================================
   Generate ID & Sorting
========================================= */
function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
}

function sortItemsByPin(items) {
    return items.sort((a, b) => {
        if (a.pinned && b.pinned) {
            return (a.pinnedAt || 0) - (b.pinnedAt || 0);
        }
        if (a.pinned) return -1;
        if (b.pinned) return 1;
        return 0;
    });
}

/* =========================================
   Setup Events
========================================= */
function setupEvents() {
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);

    // Dynamic Menu & Back Button Action
    document.getElementById("navToggleBtn")?.addEventListener("click", () => {
        if (isSearchMode) {
            closeHeaderSearch();
        } else {
            // Menu Action Example
            showToast("মেনু ওপেন করা হয়েছে");
        }
    });

    document.getElementById("searchBtn")?.addEventListener("click", () => {
        openHeaderSearch();
    });

    document.getElementById("searchInput")?.addEventListener("input", handleSearch);

    document.getElementById("allSearchBtn")?.addEventListener("click", () => {
        history.pushState({ page: "allSearch" }, "");
        activateAllSearchUI();
    });

    document.getElementById("adminLoginBtn")?.addEventListener("click", () => openModal("loginModal"));

    document.getElementById("submitLoginBtn")?.addEventListener("click", async () => {
        if (!navigator.onLine) {
            return showToast("লগইন করার জন্য ইন্টারনেট সংযোগ আবশ্যক!");
        }

        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document.getElementById("loginPassword")?.value.trim();

        if (!email || !password) {
            return showToast("ইমেইল এবং পাসওয়ার্ড দিন");
        }

        const res = await loginAdmin(email, password);

        if (res.success) {
            showToast("অ্যাডমিন লগইন সফল হয়েছে!");
            closeModal("loginModal");
        } else {
            showToast("লগইন ব্যর্থ হয়েছে: " + res.error);
        }
    });

    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        const result = await logoutAdmin();
        if (result.success) {
            closeModal("loginModal");
            showToast("লগআউট করা হয়েছে");
        }
    });

    document.getElementById("addCategoryBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("emptyAddBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("addSubCategoryBtn")?.addEventListener("click", () => openCategoryModal(true));
    document.getElementById("saveCategoryBtn")?.addEventListener("click", saveCategory);

    document.getElementById("saveHeaderBtn")?.addEventListener("click", saveHeader);
    document.getElementById("saveDataBtn")?.addEventListener("click", saveData);
    document.getElementById("confirmMoveBtn")?.addEventListener("click", confirmMoveData);

    document.getElementById("addHeaderBtn")?.addEventListener("click", () => openHeaderModal());
    document.getElementById("addDataBtn")?.addEventListener("click", () => openDataModal());

    document.getElementById("backToMainBtn")?.addEventListener("click", () => history.back());
    document.getElementById("backFromDataBtn")?.addEventListener("click", () => history.back());

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
}

/* =========================================
   Search
========================================= */
function handleSearch() {
    const rawVal = document.getElementById("searchInput")?.value.trim();
    const searchVal = rawVal ? rawVal.toLowerCase() : "";
    const adminBtn = document.getElementById("adminLoginBtn");

    if (searchVal === "admin@jr") {
        if (adminBtn) {
            adminBtn.classList.remove("hidden");
            showToast("🔑 অ্যাডমিন অপশন অন করা হয়েছে");
        }
    } else {
        if (window.currentUserRole !== "admin" && adminBtn) {
            adminBtn.classList.add("hidden");
        }
    }

    if (isAllSearchActive) {
        renderAllSearch();
    } else if (currentCategoryId) {
        renderCategoryDetails(searchVal);
    } else {
        renderCategories(searchVal);
    }
}

/* =========================================
   All Search Functionality
========================================= */
function activateAllSearchUI() {
    isAllSearchActive = true;
    const container = document.getElementById("allSearchContainer");
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    const allSearchBtn = document.getElementById("allSearchBtn");

    allSearchBtn?.classList.add("hidden");
    list?.classList.add("hidden");
    emptyState?.classList.add("hidden");
    container?.classList.remove("hidden");

    openHeaderSearch();
    renderAllSearch();
}

function closeAllSearchUI() {
    isAllSearchActive = false;
    const container = document.getElementById("allSearchContainer");
    const allSearchBtn = document.getElementById("allSearchBtn");

    allSearchBtn?.classList.remove("hidden");
    container?.classList.add("hidden");
    
    renderCategories(document.getElementById("searchInput")?.value.trim().toLowerCase());
}

function renderAllSearch() {
    const container = document.getElementById("allSearchContainer");
    if (!container) return;

    const rawVal = document.getElementById("searchInput")?.value.trim();
    const searchVal = rawVal ? rawVal.toLowerCase() : "";

    container.innerHTML = "";

    let allData = database.data || [];

    if (searchVal && searchVal !== "admin@jr") {
        allData = allData.filter(d =>
            (d.name && d.name.toLowerCase().includes(searchVal)) ||
            (d.mobile && d.mobile.toLowerCase().includes(searchVal)) ||
            (d.phone && d.phone.toLowerCase().includes(searchVal)) ||
            (d.designation && d.designation.toLowerCase().includes(searchVal)) ||
            (d.email && d.email.toLowerCase().includes(searchVal)) ||
            (d.currentOffice && d.currentOffice.toLowerCase().includes(searchVal)) ||
            (d.permanentAddress && d.permanentAddress.toLowerCase().includes(searchVal))
        );
    }

    allData = sortItemsByPin(allData);

    if (allData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted); font-size: 16px;">🔍 কোনো তথ্য পাওয়া যায়নি</div>`;
        return;
    }

    allData.forEach(item => {
        container.appendChild(createDataCardElement(item));
    });

    updateAdminUI();
}

/* =========================================
   Render Categories
========================================= */
function renderCategories(searchVal = "") {
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");

    if (!list || !emptyState) return;

    let categoriesToShow = database.categories.filter(cat => !cat.parentId);

    if (searchVal && searchVal !== "admin@jr") {
        categoriesToShow = categoriesToShow.filter(cat =>
            String(cat.name).toLowerCase().includes(searchVal)
        );
    }

    categoriesToShow = sortItemsByPin(categoriesToShow);
    list.innerHTML = "";

    if (categoriesToShow.length === 0) {
        emptyState.classList.remove("hidden");
        list.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    list.classList.remove("hidden");

    const isAdmin = window.currentUserRole === "admin";

    categoriesToShow.forEach(category => {
        const card = document.createElement("div");
        card.className = "category-card";

        const pinIcon = category.pinned ? "📌" : "📍";

        const adminActions = isAdmin
            ? `
                <div class="action-btn-group">
                    <button class="btn-pin-cat custom-action-btn" title="পিন করুন">${pinIcon}</button>
                    <button class="btn-edit-cat custom-action-btn">✏️</button>
                    <button class="btn-del-cat custom-action-btn" style="color:#ef4444">🗑️</button>
                </div>
            `
            : "";

        const pinBadge = (isAdmin && category.pinned)
            ? '<span class="pinned-badge">Pinned</span>'
            : "";

        card.innerHTML = `
            <div class="cat-click">
                <h3>
                    ${escapeHTML(category.name)}
                    ${pinBadge}
                </h3>
            </div>
            ${adminActions}
        `;

        card.querySelector(".cat-click").addEventListener("click", () => openCategory(category.id));

        if (isAdmin) {
            card.querySelector(".btn-pin-cat")?.addEventListener("click", e => {
                e.stopPropagation();
                togglePinCategory(category.id);
            });

            card.querySelector(".btn-edit-cat")?.addEventListener("click", e => {
                e.stopPropagation();
                editCategory(category.id);
            });

            card.querySelector(".btn-del-cat")?.addEventListener("click", e => {
                e.stopPropagation();
                e.preventDefault();
                deleteCategory(category.id);
            });
        }

        list.appendChild(card);
    });

    updateAdminUI();
}

/* =========================================
   Category Actions
========================================= */
function openCategoryModal(isSubCategory = false, editObj = null) {
    if (window.currentUserRole !== "admin") return;

    editingItem = editObj;

    const title = document.getElementById("categoryModalTitle");
    const input = document.getElementById("categoryNameInput");

    if (editObj) {
        title.textContent = "Category এডিট করুন";
        input.value = editObj.name;
    } else {
        title.textContent = isSubCategory ? "নতুন Sub-Category" : "নতুন Category";
        input.value = "";
    }

    openModal("categoryModal");
}

async function saveCategory() {
    if (window.currentUserRole !== "admin") return;

    const name = document.getElementById("categoryNameInput")?.value.trim();

    if (!name) {
        return showToast("Category Name লিখুন");
    }

    if (editingItem) {
        editingItem.name = name;
        editingItem = null;
    } else {
        database.categories.push({
            id: generateId("cat"),
            name: name,
            parentId: currentCategoryId ? currentCategoryId : null,
            pinned: false,
            pinnedAt: 0,
            createdAt: Date.now()
        });
    }

    await saveDatabase();
    closeModal("categoryModal");
    refreshCurrentView();
    showToast("সেভ করা হয়েছে");
}

async function togglePinCategory(id) {
    const cat = database.categories.find(c => c.id === id);

    if (cat) {
        cat.pinned = !cat.pinned;
        cat.pinnedAt = cat.pinned ? Date.now() : 0;

        await saveDatabase();
        refreshCurrentView();
        showToast(cat.pinned ? "পিন করা হয়েছে" : "আনপিন করা হয়েছে");
    }
}

function editCategory(id) {
    const cat = database.categories.find(c => c.id === id);
    if (cat) openCategoryModal(false, cat);
}

async function deleteCategory(id) {
    const isConfirmed = await customConfirm("আপনি কি নিশ্চিত এই Category মুছে ফেলতে চান?");
    if (!isConfirmed) return;

    database.categories = database.categories.filter(c => c.id !== id && c.parentId !== id);
    database.headers = database.headers.filter(h => h.categoryId !== id);
    database.data = database.data.filter(d => d.categoryId !== id);

    await saveDatabase();
    refreshCurrentView();
    showToast("ডিলিট করা হয়েছে");
}

/* =========================================
   Header Actions
========================================= */
function openHeaderModal(editObj = null) {
    if (window.currentUserRole !== "admin") return;

    editingItem = editObj;

    const input = document.getElementById("headerNameInput");
    if (input) {
        input.value = editObj ? editObj.title : "";
    }

    openModal("headerModal");
}

async function saveHeader() {
    if (window.currentUserRole !== "admin") return;

    const title = document.getElementById("headerNameInput")?.value.trim();

    if (!title || !currentCategoryId) {
        return showToast("হেডার নাম লিখুন");
    }

    if (editingItem) {
        editingItem.title = title;
        editingItem = null;
    } else {
        database.headers.push({
            id: generateId("header"),
            categoryId: currentCategoryId,
            title: title,
            pinned: false,
            pinnedAt: 0
        });
    }

    await saveDatabase();
    closeModal("headerModal");
    refreshCurrentView();
    showToast("Header সেভ করা হয়েছে");
}

async function togglePinHeader(id) {
    const header = database.headers.find(h => h.id === id);

    if (header) {
        header.pinned = !header.pinned;
        header.pinnedAt = header.pinned ? Date.now() : 0;

        await saveDatabase();
        refreshCurrentView();
        showToast(header.pinned ? "হেডার পিন করা হয়েছে" : "হেডার আনপিন করা হয়েছে");
    }
}

function editHeader(id) {
    const h = database.headers.find(item => item.id === id);
    if (h) openHeaderModal(h);
}

async function deleteHeader(id) {
    const isConfirmed = await customConfirm("এই Header ডিলিট করতে চান? ডাটাগুলো সরানো হবে না।");
    if (!isConfirmed) return;

    database.headers = database.headers.filter(h => h.id !== id);
    database.data.forEach(d => {
        if (d.headerId === id) d.headerId = null;
    });

    await saveDatabase();
    refreshCurrentView();
    showToast("Header ডিলিট করা হয়েছে");
}

/* =========================================
   Create Data Card
========================================= */
function createDataCardElement(item) {
    const isAdmin = window.currentUserRole === "admin";
    const dataEl = document.createElement("div");
    dataEl.className = "data-card-item";

    const name = escapeHTML(item.name || "নাম পাওয়া যায়নি");
    const mobile = escapeHTML(item.mobile || "মোবাইল নেই");
    const phone = escapeHTML(item.phone || "টেলিফোন নেই");
    const designation = escapeHTML(item.designation || "পদবী নেই");

    const photo = item.photo ? escapeHTML(item.photo) : null;
    const avatarHtml = photo
        ? `<img src="${photo}" alt="${name}" class="data-card-avatar" onerror="this.outerHTML='<div class=\\'data-card-avatar\\'>👤</div>'">`
        : `<div class="data-card-avatar">👤</div>`;

    const pinIcon = item.pinned ? "📌" : "📍";

    const adminActions = isAdmin
        ? `
            <div class="card-admin-actions" style="display:flex;gap:4px;">
                <button class="btn-pin-data custom-action-btn" title="পিন">${pinIcon}</button>
                <button class="btn-move-data custom-action-btn" title="মুভ">📦</button>
                <button class="btn-edit-data custom-action-btn" title="এডিট">✏️</button>
                <button class="btn-del-data custom-action-btn" style="color:#ef4444" title="ডিলিট">🗑️</button>
            </div>
        `
        : "";

    const dataPinMark = (isAdmin && item.pinned) ? "📌" : "";

    dataEl.innerHTML = `
        ${avatarHtml}
        <div class="data-card-info">
            <div class="data-card-name">${name} ${dataPinMark}</div>
            <div class="data-card-detail">📱 মোবাইল: ${mobile}</div>
            <div class="data-card-detail">☎️ টেলিফোন: ${phone}</div>
            <div class="data-card-detail">💼 পদবী: ${designation}</div>
        </div>
        ${adminActions}
    `;

    dataEl.addEventListener("click", () => openDataPage(item.id));

    if (isAdmin) {
        const actionGroup = dataEl.querySelector(".card-admin-actions");
        if (actionGroup) {
            actionGroup.addEventListener("click", e => e.stopPropagation());
        }

        dataEl.querySelector(".btn-pin-data")?.addEventListener("click", e => {
            e.stopPropagation();
            togglePinData(item.id);
        });

        dataEl.querySelector(".btn-move-data")?.addEventListener("click", e => {
            e.stopPropagation();
            openMoveDataModal(item.id);
        });

        dataEl.querySelector(".btn-edit-data")?.addEventListener("click", e => {
            e.stopPropagation();
            editData(item.id);
        });

        dataEl.querySelector(".btn-del-data")?.addEventListener("click", e => {
            e.stopPropagation();
            e.preventDefault();
            deleteData(item.id);
        });
    }

    return dataEl;
}

/* =========================================
   Data Modal
========================================= */
function openDataModal(editObj = null) {
    if (window.currentUserRole !== "admin") return;

    editingItem = editObj;

    const title = document.getElementById("dataModalTitle");
    if (title) {
        title.textContent = editObj ? "Data এডিট করুন" : "Data যোগ করুন";
    }

    document.getElementById("dataPhoto").value = editObj?.photo || "";
    document.getElementById("dataName").value = editObj?.name || "";
    document.getElementById("dataMobile").value = editObj?.mobile || "";
    document.getElementById("dataPhone").value = editObj?.phone || "";
    document.getElementById("dataDesignation").value = editObj?.designation || "";
    document.getElementById("dataEmail").value = editObj?.email || "";
    document.getElementById("dataCurrentOffice").value = editObj?.currentOffice || "";
    document.getElementById("dataPermanentAddress").value = editObj?.permanentAddress || "";
    document.getElementById("dataAdminInfo").value = editObj?.adminInfo || "";

    const select = document.getElementById("dataHeaderSelect");
    if (select) {
        select.innerHTML = `<option value="">Header ছাড়া</option>`;
        database.headers
            .filter(h => h.categoryId === currentCategoryId)
            .forEach(h => {
                select.innerHTML += `
                    <option value="${h.id}" ${editObj?.headerId === h.id ? "selected" : ""}>
                        ${escapeHTML(h.title)}
                    </option>
                `;
            });
    }

    openModal("dataModal");
}

async function saveData() {
    if (window.currentUserRole !== "admin") return;

    const name = document.getElementById("dataName")?.value.trim();
    const mobile = document.getElementById("dataMobile")?.value.trim();

    if (!name || !mobile) {
        return showToast("নাম এবং মোবাইল নম্বর অবশ্যই দিতে হবে");
    }

    const itemData = {
        photo: document.getElementById("dataPhoto")?.value.trim() || "",
        name: name,
        mobile: mobile,
        phone: document.getElementById("dataPhone")?.value.trim() || "",
        designation: document.getElementById("dataDesignation")?.value.trim() || "",
        email: document.getElementById("dataEmail")?.value.trim() || "",
        currentOffice: document.getElementById("dataCurrentOffice")?.value.trim() || "",
        permanentAddress: document.getElementById("dataPermanentAddress")?.value.trim() || "",
        adminInfo: document.getElementById("dataAdminInfo")?.value.trim() || "",
        headerId: document.getElementById("dataHeaderSelect")?.value || null
    };

    if (editingItem) {
        Object.assign(editingItem, itemData);
        editingItem = null;
    } else {
        database.data.push({
            id: generateId("data"),
            categoryId: currentCategoryId,
            pinned: false,
            pinnedAt: 0,
            ...itemData
        });
    }

    await saveDatabase();
    closeModal("dataModal");
    refreshCurrentView();
    showToast("Data সেভ করা হয়েছে");
}

async function togglePinData(id) {
    const item = database.data.find(d => d.id === id);

    if (item) {
        item.pinned = !item.pinned;
        item.pinnedAt = item.pinned ? Date.now() : 0;

        await saveDatabase();
        refreshCurrentView();
        showToast(item.pinned ? "পিন করা হয়েছে" : "আনপিন করা হয়েছে");
    }
}

function editData(id) {
    const item = database.data.find(d => d.id === id);
    if (item) openDataModal(item);
}

async function deleteData(id) {
    const isConfirmed = await customConfirm("আপনি কি নিশ্চিত এই Data মুছে ফেলতে চান?");
    if (!isConfirmed) return;

    database.data = database.data.filter(d => d.id !== id);

    await saveDatabase();
    refreshCurrentView();
    showToast("Data ডিলিট করা হয়েছে");
}

/* =========================================
   Move Data Modal
========================================= */
function openMoveDataModal(id) {
    if (window.currentUserRole !== "admin") return;

    movingDataId = id;
    const catSelect = document.getElementById("moveCategorySelect");
    const headerSelect = document.getElementById("moveHeaderSelect");

    if (!catSelect || !headerSelect) return;

    catSelect.innerHTML = `<option value="">Category সিলেক্ট করুন</option>`;
    headerSelect.innerHTML = `<option value="">Header ছাড়া (ঐচ্ছিক)</option>`;

    database.categories.forEach(cat => {
        catSelect.innerHTML += `<option value="${cat.id}">${escapeHTML(cat.name)}</option>`;
    });

    catSelect.onchange = () => {
        const selectedCatId = catSelect.value;
        headerSelect.innerHTML = `<option value="">Header ছাড়া (ঐচ্ছিক)</option>`;

        if (selectedCatId) {
            database.headers
                .filter(h => h.categoryId === selectedCatId)
                .forEach(h => {
                    headerSelect.innerHTML += `<option value="${h.id}">${escapeHTML(h.title)}</option>`;
                });
        }
    };

    openModal("moveDataModal");
}

async function confirmMoveData() {
    if (!movingDataId || window.currentUserRole !== "admin") return;

    const catSelect = document.getElementById("moveCategorySelect");
    const headerSelect = document.getElementById("moveHeaderSelect");

    const targetCatId = catSelect?.value;
    const targetHeaderId = headerSelect?.value || null;

    if (!targetCatId) {
        return showToast("Category সিলেক্ট করুন");
    }

    const item = database.data.find(d => d.id === movingDataId);

    if (item) {
        item.categoryId = targetCatId;
        item.headerId = targetHeaderId;

        await saveDatabase();
        closeModal("moveDataModal");
        movingDataId = null;
        refreshCurrentView();
        showToast("Data সফলভাবে মুভ করা হয়েছে");
    }
}

/* =========================================
   Category Details View
========================================= */
function openCategory(id) {
    history.pushState({ page: "category", categoryId: id }, "");
    showCategoryView(id, false);
}

function showCategoryView(id, isBack = false) {
    currentCategoryId = id;
    currentDataId = null;

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    renderCategoryDetails(document.getElementById("searchInput")?.value.trim().toLowerCase());
}

function renderCategoryDetails(searchVal = "") {
    const cat = database.categories.find(c => c.id === currentCategoryId);
    const titleEl = document.getElementById("detailsTitle");
    const subtitleEl = document.getElementById("detailsSubtitle");
    const content = document.getElementById("detailsContent");

    if (!cat || !content) return;

    if (titleEl) titleEl.textContent = cat.name;

    const parentCat = cat.parentId ? database.categories.find(c => c.id === cat.parentId) : null;
    if (subtitleEl) {
        subtitleEl.textContent = parentCat ? `Parent: ${parentCat.name}` : "";
    }

    content.innerHTML = "";

    const isAdmin = window.currentUserRole === "admin";

    // 1. Subcategories
    let subCats = database.categories.filter(c => c.parentId === currentCategoryId);
    if (searchVal && searchVal !== "admin@jr") {
        subCats = subCats.filter(c => String(c.name).toLowerCase().includes(searchVal));
    }

    subCats = sortItemsByPin(subCats);

    if (subCats.length > 0) {
        const subSection = document.createElement("div");
        subSection.className = "subcategory-section";
        subSection.innerHTML = `<h3 style="margin-bottom:10px; font-size:16px; color:var(--text-muted);">📁 Sub Categories</h3>`;

        subCats.forEach(sub => {
            const card = document.createElement("div");
            card.className = "subcategory-card";

            const pinIcon = sub.pinned ? "📌" : "📍";

            const adminActions = isAdmin
                ? `
                    <div class="action-btn-group">
                        <button class="btn-pin-cat custom-action-btn" title="পিন করুন">${pinIcon}</button>
                        <button class="btn-edit-cat custom-action-btn">✏️</button>
                        <button class="btn-del-cat custom-action-btn" style="color:#ef4444">🗑️</button>
                    </div>
                `
                : "";

            card.innerHTML = `
                <div class="sub-click">
                    <h3>${escapeHTML(sub.name)}</h3>
                </div>
                ${adminActions}
            `;

            card.querySelector(".sub-click").addEventListener("click", () => openCategory(sub.id));

            if (isAdmin) {
                card.querySelector(".btn-pin-cat")?.addEventListener("click", e => {
                    e.stopPropagation();
                    togglePinCategory(sub.id);
                });

                card.querySelector(".btn-edit-cat")?.addEventListener("click", e => {
                    e.stopPropagation();
                    editCategory(sub.id);
                });

                card.querySelector(".btn-del-cat")?.addEventListener("click", e => {
                    e.stopPropagation();
                    e.preventDefault();
                    deleteCategory(sub.id);
                });
            }

            subSection.appendChild(card);
        });

        content.appendChild(subSection);
    }

    // 2. Headers & Data
    let catHeaders = database.headers.filter(h => h.categoryId === currentCategoryId);
    catHeaders = sortItemsByPin(catHeaders);

    let catData = database.data.filter(d => d.categoryId === currentCategoryId);
    if (searchVal && searchVal !== "admin@jr") {
        catData = catData.filter(d =>
            (d.name && d.name.toLowerCase().includes(searchVal)) ||
            (d.mobile && d.mobile.toLowerCase().includes(searchVal)) ||
            (d.phone && d.phone.toLowerCase().includes(searchVal)) ||
            (d.designation && d.designation.toLowerCase().includes(searchVal))
        );
    }

    // Render Data by Header
    catHeaders.forEach(h => {
        let headerData = catData.filter(d => d.headerId === h.id);
        headerData = sortItemsByPin(headerData);

        if (headerData.length > 0 || isAdmin) {
            const hSec = document.createElement("div");
            hSec.style.marginTop = "20px";

            const pinIcon = h.pinned ? "📌" : "📍";
            const adminHeaderActions = isAdmin
                ? `
                    <span style="font-size:14px; margin-left:8px;">
                        <button class="btn-pin-head custom-action-btn" title="পিন">${pinIcon}</button>
                        <button class="btn-edit-head custom-action-btn" title="এডিট">✏️</button>
                        <button class="btn-del-head custom-action-btn" style="color:#ef4444" title="ডিলিট">🗑️</button>
                    </span>
                `
                : "";

            hSec.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid var(--primary-color); padding-bottom:4px; margin-bottom:12px;">
                    <h2 style="font-size:18px; color:var(--primary-color);">${escapeHTML(h.title)}</h2>
                    ${adminHeaderActions}
                </div>
            `;

            if (isAdmin) {
                hSec.querySelector(".btn-pin-head")?.addEventListener("click", () => togglePinHeader(h.id));
                hSec.querySelector(".btn-edit-head")?.addEventListener("click", () => editHeader(h.id));
                hSec.querySelector(".btn-del-head")?.addEventListener("click", () => deleteHeader(h.id));
            }

            const listDiv = document.createElement("div");

            if (headerData.length === 0) {
                listDiv.innerHTML = `<div style="color:var(--text-muted); padding:10px 0; font-size:14px;">কোনো ডাটা নেই</div>`;
            } else {
                headerData.forEach(item => {
                    listDiv.appendChild(createDataCardElement(item));
                });
            }

            hSec.appendChild(listDiv);
            content.appendChild(hSec);
        }
    });

    // Data without Header
    let noHeaderData = catData.filter(d => !d.headerId);
    noHeaderData = sortItemsByPin(noHeaderData);

    if (noHeaderData.length > 0) {
        const noHSec = document.createElement("div");
        noHSec.style.marginTop = "20px";

        if (catHeaders.length > 0) {
            noHSec.innerHTML = `<h3 style="font-size:16px; color:var(--text-muted); margin-bottom:10px;">অন্যান্য ডাটা</h3>`;
        }

        noHeaderData.forEach(item => {
            noHSec.appendChild(createDataCardElement(item));
        });

        content.appendChild(noHSec);
    }

    if (subCats.length === 0 && catHeaders.length === 0 && catData.length === 0) {
        content.innerHTML += `<div style="text-align:center; padding:40px; color:var(--text-muted);">এই Category তে কোনো তথ্য নেই</div>`;
    }

    updateAdminUI();
}

/* =========================================
   Single Data Page
========================================= */
function openDataPage(id) {
    history.pushState({ page: "data", dataId: id }, "");
    showDataPage(id, false);
}

function showDataPage(id, isBack = false) {
    currentDataId = id;

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.remove("hidden");

    renderSingleDataPage();
}

function renderSingleDataPage() {
    const item = database.data.find(d => d.id === currentDataId);
    const container = document.getElementById("dataPageContent");

    if (!item || !container) return;

    const isAdmin = window.currentUserRole === "admin";

    const name = escapeHTML(item.name || "নাম পাওয়া যায়নি");
    const mobile = escapeHTML(item.mobile || "");
    const phone = escapeHTML(item.phone || "");
    const designation = escapeHTML(item.designation || "পদবী নেই");
    const email = escapeHTML(item.email || "");
    const currentOffice = escapeHTML(item.currentOffice || "তথ্য নেই");
    const permanentAddress = escapeHTML(item.permanentAddress || "তথ্য নেই");
    const adminInfo = escapeHTML(item.adminInfo || "কোনো গোপনীয় তথ্য নেই");

    const photo = item.photo ? escapeHTML(item.photo) : null;
    const avatarHtml = photo
        ? `<img src="${photo}" alt="${name}" class="details-avatar-large" onerror="this.outerHTML='<div class=\\'details-avatar-large\\'>👤</div>'">`
        : `<div class="details-avatar-large">👤</div>`;

    const adminSection = isAdmin
        ? `
            <div style="margin-top:20px; padding:15px; background:rgba(239,68,68,0.1); border-left:4px solid #ef4444; border-radius:8px;">
                <h4 style="color:#ef4444; margin-bottom:6px;">🔒 Admin Confidential Info</h4>
                <p style="font-size:14px;">${adminInfo}</p>
            </div>
        `
        : "";

    container.innerHTML = `
        <div class="details-header-section">
            <div class="avatar-wrapper">
                ${avatarHtml}
            </div>
            <h2 style="font-size:22px; font-weight:700;">${name}</h2>
            <p style="color:var(--primary-color); font-weight:600; font-size:15px; margin-top:2px;">${designation}</p>
        </div>

        <div class="quick-action-grid">
            ${mobile ? `<a href="tel:${mobile}" class="action-btn-round btn-call-round">📞 কল দিন</a>` : ""}
            ${phone ? `<a href="tel:${phone}" class="action-btn-round btn-phone-round">☎️ টেলিফোন</a>` : ""}
            ${email ? `<a href="mailto:${email}" class="action-btn-round btn-email-round">✉️ ইমেইল</a>` : ""}
            <button id="shareDataBtn" class="action-btn-round btn-share-round" type="button">🔗 শেয়ার</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; font-size:15px;">
            <div style="padding:12px; background:var(--bg-color); border-radius:12px; border:1px solid var(--border-color);">
                <strong>📱 মোবাইল:</strong> ${mobile || "নেই"}
            </div>
            <div style="padding:12px; background:var(--bg-color); border-radius:12px; border:1px solid var(--border-color);">
                <strong>☎️ টেলিফোন:</strong> ${phone || "নেই"}
            </div>
            <div style="padding:12px; background:var(--bg-color); border-radius:12px; border:1px solid var(--border-color);">
                <strong>✉️ ইমেইল:</strong> ${email || "নেই"}
            </div>
            <div style="padding:12px; background:var(--bg-color); border-radius:12px; border:1px solid var(--border-color);">
                <strong>🏢 বর্তমান কর্মস্থল:</strong> ${currentOffice}
            </div>
            <div style="padding:12px; background:var(--bg-color); border-radius:12px; border:1px solid var(--border-color);">
                <strong>🏠 স্থায়ী ঠিকানা:</strong> ${permanentAddress}
            </div>
        </div>

        ${adminSection}
    `;

    document.getElementById("shareDataBtn")?.addEventListener("click", () => {
        if (navigator.share) {
            navigator.share({
                title: name,
                text: `${name} (${designation})\nমোবাইল: ${mobile}`,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(`${name} (${designation}) - মোবাইল: ${mobile}`);
            showToast("তথ্য কপি করা হয়েছে!");
        }
    });

    updateAdminUI();
}

/* =========================================
   Show Main Dashboard
========================================= */
function showMainDashboardView(isBack = false) {
    currentCategoryId = null;
    currentDataId = null;

    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("mainDashboardView")?.classList.remove("hidden");

    renderCategories(document.getElementById("searchInput")?.value.trim().toLowerCase());
}

function refreshCurrentView() {
    if (isAllSearchActive) {
        renderAllSearch();
    } else if (currentDataId) {
        renderSingleDataPage();
    } else if (currentCategoryId) {
        renderCategoryDetails(document.getElementById("searchInput")?.value.trim().toLowerCase());
    } else {
        renderCategories(document.getElementById("searchInput")?.value.trim().toLowerCase());
    }
}

/* =========================================
   Modal Utilities
========================================= */
function openModal(id) {
    document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id)?.classList.add("hidden");
    editingItem = null;
}

function customConfirm(message, title = "নিশ্চিতকরণ", confirmText = "হ্যাঁ, মুছুন") {
    return new Promise(resolve => {
        const modal = document.getElementById("customConfirmModal");
        const msgEl = document.getElementById("confirmModalMessage");
        const titleEl = document.getElementById("confirmModalTitle");
        const okBtn = document.getElementById("okConfirmBtn");
        const cancelBtn = document.getElementById("cancelConfirmBtn");
        const closeBtn = modal?.querySelector(".close-btn");

        if (!modal) return resolve(false);

        if (msgEl) msgEl.textContent = message;
        if (titleEl) titleEl.textContent = title;
        if (okBtn) okBtn.textContent = confirmText;

        openModal("customConfirmModal");

        const cleanup = () => {
            okBtn?.removeEventListener("click", onOk);
            cancelBtn?.removeEventListener("click", onCancel);
            closeBtn?.removeEventListener("click", onCancel);
        };

        const onOk = () => {
            closeModal("customConfirmModal");
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            closeModal("customConfirmModal");
            cleanup();
            resolve(false);
        };

        okBtn?.addEventListener("click", onOk);
        cancelBtn?.addEventListener("click", onCancel);
        closeBtn?.addEventListener("click", onCancel);
    });
}

/* =========================================
   Toast
========================================= */
function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = msg;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 2500);
}
