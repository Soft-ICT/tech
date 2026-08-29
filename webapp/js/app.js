import {
    watchAuth,
    loginAdmin,
    logoutAdmin
} from "./auth.js";

import {
    ref,
    set,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

"use strict";

const DEFAULT_CATEGORY_IMAGE = "https://cdn-icons-png.flaticon.com/512/3541/3541850.png";

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
let isDeviceVerified = false;

function getDeviceId() {
    let devId = localStorage.getItem("police_pb_device_id");
    if (!devId) {
        devId = "DEV_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("police_pb_device_id", devId);
    }
    return devId;
}

function checkDeviceVerificationStatus() {
    const devId = getDeviceId();
    const approvedRef = ref(db, `webapp/approved_devices/${devId}`);
    
    onValue(approvedRef, (snapshot) => {
        if (snapshot.exists() && snapshot.val().status === "approved") {
            isDeviceVerified = true;
            document.getElementById("verifiedBadge")?.classList.remove("hidden");
        } else {
            isDeviceVerified = false;
            document.getElementById("verifiedBadge")?.classList.add("hidden");
        }
        refreshCurrentView();
    });
}

function checkOnlineStatus() {
    if (!navigator.onLine) {
        showToast("⚠️ ইন্টারনেট সংযোগ নেই!");
        loadLocalCache();
    }
}

window.addEventListener('online', () => {
    showToast("🟢 অনলাইন মোডে আছেন");
    loadDatabase();
});

window.addEventListener('offline', checkOnlineStatus);

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

function updateAdminUI() {
    const isAdmin = window.currentUserRole === "admin";
    const topbar = document.querySelector(".topbar");

    if (topbar) {
        topbar.classList.toggle("admin-header", isAdmin);
        topbar.classList.toggle("user-header", !isAdmin);
    }

    document.querySelectorAll(".admin-only").forEach(el => {
        el.classList.toggle("hidden", !isAdmin);
    });

    const loginForm = document.getElementById("loginFormContainer");
    const logoutContainer = document.getElementById("logoutContainer");

    if (loginForm) loginForm.style.display = isAdmin ? "none" : "block";
    if (logoutContainer) logoutContainer.classList.toggle("hidden", !isAdmin);
}

document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    initTheme();
    updateAdminUI();

    checkDeviceVerificationStatus();
    loadLocalCache();
    checkOnlineStatus();

    history.replaceState({ page: "home" }, "");
    window.addEventListener("popstate", handlePopState);
});

function setNavState(searchOrSubPageActive) {
    isSearchMode = searchOrSubPageActive;
    const menuIcon = document.getElementById("menuIcon");
    const backIcon = document.getElementById("backIcon");

    if (searchOrSubPageActive) {
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
        
        if (!currentCategoryId && !currentDataId && !isAllSearchActive) {
            setNavState(false);
        }
        handleSearch();
    }
}

function handlePopState(event) {
    closeHeaderSearch();
    const state = event.state;

    if (!state || state.page === "home") {
        closeAllSearchUI();
        showMainDashboardView(false);
    } else if (state.page === "allSearch") {
        if (!isAllSearchActive) activateAllSearchUI();
    } else if (state.page === "category") {
        closeAllSearchUI();
        showCategoryView(state.categoryId);
    } else if (state.page === "data") {
        closeAllSearchUI();
        showDataPage(state.dataId, false);
    }
}

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

function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
}

function sortItemsByPin(items) {
    return items.sort((a, b) => {
        if (a.pinned && b.pinned) return (a.pinnedAt || 0) - (b.pinnedAt || 0);
        if (a.pinned) return -1;
        if (b.pinned) return 1;
        return 0;
    });
}

function setupEvents() {
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);

    document.getElementById("navToggleBtn")?.addEventListener("click", () => {
        const searchBox = document.getElementById("searchBox");
        const isSearchOpen = searchBox && !searchBox.classList.contains("hidden");

        if (isSearchOpen) {
            closeHeaderSearch();
        } else if (currentCategoryId || currentDataId || isAllSearchActive) {
            history.back();
        } else {
            showToast("মেনু ওপেন করা হয়েছে");
        }
    });

    document.getElementById("searchBtn")?.addEventListener("click", openHeaderSearch);
    document.getElementById("searchInput")?.addEventListener("input", handleSearch);

    document.getElementById("allSearchBtn")?.addEventListener("click", () => {
        history.pushState({ page: "allSearch" }, "");
        activateAllSearchUI();
    });

    document.getElementById("adminLoginBtn")?.addEventListener("click", () => openModal("loginModal"));

    document.getElementById("submitLoginBtn")?.addEventListener("click", async () => {
        if (!navigator.onLine) return showToast("লগইন করার জন্য ইন্টারনেট সংযোগ আবশ্যক!");

        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document.getElementById("loginPassword")?.value.trim();

        if (!email || !password) return showToast("ইমেইল এবং পাসওয়ার্ড দিন");

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

    document.getElementById("submitVerifyBtn")?.addEventListener("click", submitVerificationRequest);
    document.getElementById("addCategoryBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("emptyAddBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("addSubCategoryBtn")?.addEventListener("click", () => openCategoryModal(true));
    document.getElementById("saveCategoryBtn")?.addEventListener("click", saveCategory);

    document.getElementById("saveHeaderBtn")?.addEventListener("click", saveHeader);
    document.getElementById("saveDataBtn")?.addEventListener("click", saveData);
    document.getElementById("confirmMoveBtn")?.addEventListener("click", confirmMoveData);

    document.getElementById("addHeaderBtn")?.addEventListener("click", () => openHeaderModal());
    document.getElementById("addDataBtn")?.addEventListener("click", () => openDataModal());

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
}

async function submitVerificationRequest() {
    const name = document.getElementById("applicantName")?.value.trim();
    const desig = document.getElementById("applicantDesignation")?.value.trim();

    if (!name || !desig) return showToast("দয়া করে নাম এবং পদবী পূরণ করুন");

    const devId = getDeviceId();
    try {
        await set(ref(db, `webapp/verification_requests/${devId}`), {
            deviceId: devId,
            name: name,
            designation: desig,
            requestedAt: Date.now()
        });
        closeModal("verifyModal");
        showToast("✅ রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!");
    } catch (e) {
        showToast("রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে");
    }
}

function handleSearch() {
    const rawVal = document.getElementById("searchInput")?.value.trim();
    const searchVal = rawVal ? rawVal.toLowerCase() : "";
    const adminBtn = document.getElementById("adminLoginBtn");

    if (searchVal === "admin@jr") {
        if (adminBtn) {
            adminBtn.classList.remove("hidden");
            showToast("🔑 অ্যাডমিন অপশন অন করা হয়েছে");
        }
    } else if (window.currentUserRole !== "admin" && adminBtn) {
        adminBtn.classList.add("hidden");
    }

    if (isAllSearchActive) {
        renderAllSearch();
    } else if (currentCategoryId) {
        renderCategoryDetails(searchVal);
    } else {
        renderCategories(searchVal);
    }
}

function activateAllSearchUI() {
    isAllSearchActive = true;
    document.getElementById("allSearchBtn")?.classList.add("hidden");
    document.getElementById("categoryList")?.classList.add("hidden");
    document.getElementById("emptyState")?.classList.add("hidden");
    document.getElementById("allSearchContainer")?.classList.remove("hidden");

    openHeaderSearch();
    renderAllSearch();
}

function closeAllSearchUI() {
    isAllSearchActive = false;
    document.getElementById("allSearchBtn")?.classList.remove("hidden");
    document.getElementById("allSearchContainer")?.classList.add("hidden");
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
        const imgSrc = category.image ? escapeHTML(category.image) : DEFAULT_CATEGORY_IMAGE;
        const imageHtml = `<img src="${imgSrc}" alt="${escapeHTML(category.name)}" class="cat-card-img" onerror="this.src='${DEFAULT_CATEGORY_IMAGE}'">`;

        const adminActions = isAdmin
            ? `
                <div class="action-btn-group">
                    <button class="btn-pin-cat custom-action-btn" title="পিন করুন">${pinIcon}</button>
                    <button class="btn-edit-cat custom-action-btn">✏️</button>
                    <button class="btn-del-cat custom-action-btn" style="color:#ef4444">🗑️</button>
                </div>
            `
            : "";

        const pinBadge = (isAdmin && category.pinned) ? '<span class="pinned-badge">Pinned</span>' : "";

        card.innerHTML = `
            <div class="cat-click">
                ${imageHtml}
                <h3>${escapeHTML(category.name)} ${pinBadge}</h3>
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
                deleteCategory(category.id);
            });
        }

        list.appendChild(card);
    });

    updateAdminUI();
}

function createDataCardElement(item) {
    const isAdmin = window.currentUserRole === "admin";
    const dataEl = document.createElement("div");
    dataEl.className = "data-card-item";

    const name = escapeHTML(item.name || "নাম পাওয়া যায়নি");
    const mobile = escapeHTML(item.mobile || "মোবাইল নেই");
    const phone = escapeHTML(item.phone || "টেলিফোন নেই");
    const designation = escapeHTML(item.designation || "পদবী নেই");
    const photo = item.photo ? escapeHTML(item.photo) : null;

    // ডিভাইস অ্যাপ্রুভড অথবা অ্যাডমিন হলে প্রশাসনিক তথ্য ও স্থায়ী ঠিকানা প্রদর্শন করবে
    const showRestrictedData = isDeviceVerified || isAdmin;
    const currentOffice = showRestrictedData ? escapeHTML(item.currentOffice || "প্রশাসনিক তথ্য নেই") : "🔒 ডিভাইসের অনুমতি প্রয়োজন";
    const permanentAddress = showRestrictedData ? escapeHTML(item.permanentAddress || "স্থায়ী ঠিকানা নেই") : "🔒 ডিভাইসের অনুমতি প্রয়োজন";

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
            <div class="data-card-detail">🏢 প্রশাসনিক অফিস: ${currentOffice}</div>
            <div class="data-card-detail">🏠 স্থায়ী ঠিকানা: ${permanentAddress}</div>
        </div>
        ${adminActions}
    `;

    dataEl.addEventListener("click", () => openDataPage(item.id));

    if (isAdmin) {
        dataEl.querySelector(".card-admin-actions")?.addEventListener("click", e => e.stopPropagation());
        dataEl.querySelector(".btn-pin-data")?.addEventListener("click", e => { e.stopPropagation(); togglePinData(item.id); });
        dataEl.querySelector(".btn-move-data")?.addEventListener("click", e => { e.stopPropagation(); openMoveDataModal(item.id); });
        dataEl.querySelector(".btn-edit-data")?.addEventListener("click", e => { e.stopPropagation(); editData(item.id); });
        dataEl.querySelector(".btn-del-data")?.addEventListener("click", e => { e.stopPropagation(); deleteData(item.id); });
    }

    return dataEl;
}

function showDataPage(dataId, pushHistory = true) {
    const item = database.data.find(d => d.id === dataId);
    if (!item) return;

    currentDataId = dataId;
    if (pushHistory) history.pushState({ page: "data", dataId: dataId }, "");

    const showRestrictedData = isDeviceVerified || window.currentUserRole === "admin";
    const detailsContainer = document.getElementById("dataDetailsContainer");

    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="data-details-card" style="padding: 16px; background: var(--card-bg); border-radius: 8px;">
                <h2 style="margin-bottom: 12px; color: var(--text-color);">${escapeHTML(item.name || "")}</h2>
                <p style="margin: 6px 0;"><strong>পদবী:</strong> ${escapeHTML(item.designation || "N/A")}</p>
                <p style="margin: 6px 0;"><strong>মোবাইল:</strong> ${escapeHTML(item.mobile || "N/A")}</p>
                <p style="margin: 6px 0;"><strong>টেলিফোন:</strong> ${escapeHTML(item.phone || "N/A")}</p>
                <hr style="margin: 12px 0; border: 0; border-top: 1px solid var(--border-color);">
                <p style="margin: 6px 0;"><strong>প্রশাসনিক তথ্য (অফিস):</strong> ${showRestrictedData ? escapeHTML(item.currentOffice || "তথ্য উপলব্ধ নয়") : "🔒 অনুমোদিত ডিভাইস ব্যতীত দৃশ্যমান নয়"}</p>
                <p style="margin: 6px 0;"><strong>স্থায়ী ঠিকানা:</strong> ${showRestrictedData ? escapeHTML(item.permanentAddress || "তথ্য উপলব্ধ নয়") : "🔒 অনুমোদিত ডিভাইস ব্যতীত দৃশ্যমান নয়"}</p>
            </div>
        `;
    }

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.remove("hidden");
    setNavState(true);
}

function openCategoryModal(isSubCategory = false, editObj = null) {
    if (window.currentUserRole !== "admin") return;

    editingItem = editObj;
    const title = document.getElementById("categoryModalTitle");
    const inputName = document.getElementById("categoryNameInput");
    const inputImage = document.getElementById("categoryImageInput");

    if (editObj) {
        title.textContent = "Category এডিট করুন";
        inputName.value = editObj.name || "";
        if (inputImage) inputImage.value = editObj.image || "";
    } else {
        title.textContent = isSubCategory ? "নতুন Sub-Category" : "নতুন Category";
        inputName.value = "";
        if (inputImage) inputImage.value = "";
    }

    openModal("categoryModal");
}

async function saveCategory() {
    if (window.currentUserRole !== "admin") return;

    const name = document.getElementById("categoryNameInput")?.value.trim();
    const image = document.getElementById("categoryImageInput")?.value.trim() || "";

    if (!name) return showToast("Category Name লিখুন");

    if (editingItem) {
        editingItem.name = name;
        editingItem.image = image;
        editingItem = null;
    } else {
        database.categories.push({
            id: generateId("cat"),
            name: name,
            image: image,
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
    const isConfirmed = confirm("আপনি কি নিশ্চিত এই Category মুছে ফেলতে চান?");
    if (!isConfirmed) return;

    database.categories = database.categories.filter(c => c.id !== id && c.parentId !== id);
    database.headers = database.headers.filter(h => h.categoryId !== id);
    database.data = database.data.filter(d => d.categoryId !== id);

    await saveDatabase();
    refreshCurrentView();
    showToast("ডিলিট করা হয়েছে");
}

function openCategory(id, pushHistory = true) {
    if (pushHistory) history.pushState({ page: "category", categoryId: id }, "");
    showCategoryView(id);
}

function showCategoryView(id) {
    const category = database.categories.find(item => item.id === id);
    if (!category) return;

    currentCategoryId = id;
    currentDataId = null;

    const appTitle = document.getElementById("appTitle");
    if (appTitle) {
        const titleText = appTitle.querySelector(".app-title-text");
        if (titleText) titleText.textContent = category.name;
    }

    setNavState(true);
    document.querySelector(".sub-toolbar")?.classList.add("hidden");

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    renderCategoryDetails(document.getElementById("searchInput")?.value.trim().toLowerCase());
}

function renderCategoryDetails(searchVal = "") {
    const container = document.getElementById("categoryDetailsView");
    if (!container) return;

    let categoryData = database.data.filter(d => d.categoryId === currentCategoryId);

    if (searchVal && searchVal !== "admin@jr") {
        categoryData = categoryData.filter(d =>
            (d.name && d.name.toLowerCase().includes(searchVal)) ||
            (d.mobile && d.mobile.toLowerCase().includes(searchVal)) ||
            (d.phone && d.phone.toLowerCase().includes(searchVal)) ||
            (d.designation && d.designation.toLowerCase().includes(searchVal))
        );
    }

    categoryData = sortItemsByPin(categoryData);
    container.innerHTML = "";

    if (categoryData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">🔍 ক্যাটাগরিতে কোনো তথ্য পাওয়া যায়নি</div>`;
        return;
    }

    categoryData.forEach(item => {
        container.appendChild(createDataCardElement(item));
    });
}

function showMainDashboardView(updateHistory = true) {
    currentCategoryId = null;
    currentDataId = null;

    const appTitle = document.getElementById("appTitle");
    if (appTitle) {
        const titleText = appTitle.querySelector(".app-title-text");
        if (titleText) titleText.textContent = "Police Phonebook";
    }

    setNavState(false);
    document.querySelector(".sub-toolbar")?.classList.remove("hidden");

    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("mainDashboardView")?.classList.remove("hidden");

    if (isAllSearchActive) renderAllSearch();
    else renderCategories(document.getElementById("searchInput")?.value.trim().toLowerCase());
}

function refreshCurrentView() {
    if (currentDataId) showDataPage(currentDataId, false);
    else if (currentCategoryId) showCategoryView(currentCategoryId);
    else if (isAllSearchActive) renderAllSearch();
    else showMainDashboardView(false);
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
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}
