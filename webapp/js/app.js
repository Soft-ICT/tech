import {
    watchAuth,
    loginAdmin,
    logoutAdmin
} from "./auth.js";

import {
    ref,
    set,
    get,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import {
    db
} from "./firebase.js";

"use strict";

/* =========================================
   Default Category Image
========================================= */
const DEFAULT_CATEGORY_IMAGE = "https://cdn-icons-png.flaticon.com/512/3541/3541850.png";

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
let isDeviceVerified = false;

/* =========================================
   Device ID & On-Demand Fingerprinting
========================================= */
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

    checkDeviceVerificationStatus();
    loadLocalCache();
    checkOnlineStatus();

    history.replaceState({ page: "home" }, "");
    window.addEventListener("popstate", handlePopState);
});

/* =========================================
   Search Toggle & Navigation Icons
========================================= */
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

/* =========================================
   Verification Requests (User)
========================================= */
async function submitVerificationRequest() {
    const name = document.getElementById("applicantName")?.value.trim();
    const desig = document.getElementById("applicantDesignation")?.value.trim();

    if (!name || !desig) {
        return showToast("দয়া করে নাম এবং পদবী পূরণ করুন");
    }

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

/* =========================================
   Hold to Verify Handler (10s Long Press)
========================================= */
function setupHoldToVerify(btnElement) {
    if (!btnElement) return;

    let holdTimer = null;
    let secondsCounter = 0;

    const startHold = (e) => {
        e.preventDefault();
        secondsCounter = 0;
        btnElement.classList.add("holding");

        holdTimer = setInterval(() => {
            secondsCounter++;
            if (secondsCounter >= 10) {
                clearHold();
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                openModal("verifyModal");
            }
        }, 1000);
    };

    const clearHold = () => {
        if (holdTimer) {
            clearInterval(holdTimer);
            holdTimer = null;
        }
        btnElement.classList.remove("holding");
    };

    btnElement.addEventListener("mousedown", startHold);
    btnElement.addEventListener("touchstart", startHold, { passive: false });

    btnElement.addEventListener("mouseup", clearHold);
    btnElement.addEventListener("mouseleave", clearHold);
    btnElement.addEventListener("touchend", clearHold);
    btnElement.addEventListener("touchcancel", clearHold);
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

        const pinBadge = (isAdmin && category.pinned)
            ? '<span class="pinned-badge">Pinned</span>'
            : "";

        card.innerHTML = `
            <div class="cat-click">
                ${imageHtml}
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

    if (!name) {
        return showToast("Category Name লিখুন");
    }

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

    if (!currentCategoryId && !editingItem) {
        return showToast("ক্যাটাগরি সিলেক্ট করা নেই");
    }

    const name = document.getElementById("dataName")?.value.trim() || "";
    if (!name) {
        return showToast("নাম প্রদান করুন");
    }

    const payload = {
        photo: document.getElementById("dataPhoto")?.value.trim() || "",
        name: name,
        mobile: document.getElementById("dataMobile")?.value.trim() || "",
        phone: document.getElementById("dataPhone")?.value.trim() || "",
        designation: document.getElementById("dataDesignation")?.value.trim() || "",
        email: document.getElementById("dataEmail")?.value.trim() || "",
        currentOffice: document.getElementById("dataCurrentOffice")?.value.trim() || "",
        permanentAddress: document.getElementById("dataPermanentAddress")?.value.trim() || "",
        adminInfo: document.getElementById("dataAdminInfo")?.value.trim() || "",
        headerId: document.getElementById("dataHeaderSelect")?.value || null
    };

    if (editingItem) {
        Object.assign(editingItem, payload);
        editingItem = null;
    } else {
        database.data.push({
            id: generateId("data"),
            categoryId: currentCategoryId,
            ...payload,
            pinned: false,
            pinnedAt: 0
        });
    }

    await saveDatabase();
    closeModal("dataModal");
    refreshCurrentView();
    showToast("ডাটা সেভ হয়েছে");
}

function editData(id) {
    const item = database.data.find(d => d.id === id);
    if (item) openDataModal(item);
}

async function deleteData(id) {
    const isConfirmed = await customConfirm("আপনি কি এই Data মুছে ফেলতে চান?");
    if (!isConfirmed) return;

    database.data = database.data.filter(d => d.id !== id);

    await saveDatabase();
    refreshCurrentView();
    showToast("ডাটা ডিলিট করা হয়েছে");
}

async function togglePinData(id) {
    const item = database.data.find(d => d.id === id);

    if (item) {
        item.pinned = !item.pinned;
        item.pinnedAt = item.pinned ? Date.now() : 0;

        await saveDatabase();
        refreshCurrentView();
        showToast(item.pinned ? "ডাটা পিন করা হয়েছে" : "ডাটা আনপিন করা হয়েছে");
    }
}

/* =========================================
   Move Data
========================================= */
function openMoveDataModal(id) {
    movingDataId = id;

    const catSelect = document.getElementById("moveCategorySelect");

    if (catSelect) {
        catSelect.innerHTML = "";
        database.categories.forEach(c => {
            catSelect.innerHTML += `
                <option value="${c.id}">
                    ${escapeHTML(c.name)}
                </option>
            `;
        });
        catSelect.value = currentCategoryId;
    }

    updateMoveHeaderOptions();
    catSelect?.addEventListener("change", updateMoveHeaderOptions);

    openModal("moveDataModal");
}

function updateMoveHeaderOptions() {
    const catId = document.getElementById("moveCategorySelect")?.value;
    const headSelect = document.getElementById("moveHeaderSelect");

    if (headSelect) {
        headSelect.innerHTML = `<option value="">Header ছাড়া</option>`;
        database.headers
            .filter(h => h.categoryId === catId)
            .forEach(h => {
                headSelect.innerHTML += `
                    <option value="${h.id}">
                        ${escapeHTML(h.title)}
                    </option>
                `;
            });
    }
}

async function confirmMoveData() {
    const catId = document.getElementById("moveCategorySelect")?.value;
    const headId = document.getElementById("moveHeaderSelect")?.value || null;

    const item = database.data.find(d => d.id === movingDataId);

    if (item && catId) {
        item.categoryId = catId;
        item.headerId = headId;

        await saveDatabase();
        closeModal("moveDataModal");
        refreshCurrentView();
        showToast("ডাটা সফলভাবে মুভ করা হয়েছে!");
    }
}

/* =========================================
   Navigation
========================================= */
function openCategory(id, pushHistory = true) {
    if (pushHistory) {
        history.pushState({ page: "category", categoryId: id }, "");
    }
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

    const subToolbar = document.querySelector(".sub-toolbar") || document.getElementById("subToolbar") || document.getElementById("allSearchBtn");
    if (subToolbar) {
        subToolbar.classList.add("hidden");
    }

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    const detailsTitle = document.getElementById("detailsTitle");
    if (detailsTitle) {
        detailsTitle.style.display = "none";
    }

    renderCategoryDetails(
        document.getElementById("searchInput")?.value.trim().toLowerCase()
    );
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

    const subToolbar = document.querySelector(".sub-toolbar") || document.getElementById("subToolbar") || document.getElementById("allSearchBtn");
    if (subToolbar) {
        subToolbar.classList.remove("hidden");
    }

    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("mainDashboardView")?.classList.remove("hidden");

    if (isAllSearchActive) {
        renderAllSearch();
    } else {
        renderCategories(
            document.getElementById("searchInput")?.value.trim().toLowerCase()
        );
    }
}

function refreshCurrentView() {
    if (currentDataId) {
        showDataPage(currentDataId, false);
    } else if (currentCategoryId) {
        showCategoryView(currentCategoryId);
    } else if (isAllSearchActive) {
        renderAllSearch();
    } else {
        showMainDashboardView(false);
    }
}

/* =========================================
   Render Category Details
========================================= */
function renderCategoryDetails(searchVal = "") {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";
    const isAdmin = window.currentUserRole === "admin";
    const filterText = searchVal === "admin@jr" ? "" : searchVal;

    let subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);

    if (filterText) {
        subCategories = subCategories.filter(sub =>
            sub.name.toLowerCase().includes(filterText)
        );
    }

    subCategories = sortItemsByPin(subCategories);

    if (subCategories.length > 0) {
        const subWrapper = document.createElement("div");
        subWrapper.style.marginBottom = "20px";

        subCategories.forEach(sub => {
            const item = document.createElement("div");
            item.className = "subcategory-card";

            const pinIcon = sub.pinned ? "📌" : "📍";
            const subImgSrc = sub.image ? escapeHTML(sub.image) : DEFAULT_CATEGORY_IMAGE;
            const imageHtml = `<img src="${subImgSrc}" alt="${escapeHTML(sub.name)}" class="cat-card-img" onerror="this.src='${DEFAULT_CATEGORY_IMAGE}'">`;

            const adminActions = isAdmin
                ? `
                    <div>
                        <button class="btn-pin-sub custom-action-btn" title="পিন">${pinIcon}</button>
                        <button class="btn-edit-sub custom-action-btn">✏️</button>
                        <button class="btn-del-sub custom-action-btn" style="color:#ef4444">🗑️</button>
                    </div>
                `
                : "";

            const subPinBadge = (isAdmin && sub.pinned)
                ? '<span class="pinned-badge">Pinned</span>'
                : "";

            item.innerHTML = `
                <div class="sub-click">
                    ${imageHtml}
                    <h3>${escapeHTML(sub.name)} ${subPinBadge}</h3>
                </div>
                ${adminActions}
            `;

            item.querySelector(".sub-click").addEventListener("click", () => openCategory(sub.id));

            if (isAdmin) {
                item.querySelector(".btn-pin-sub")?.addEventListener("click", e => {
                    e.stopPropagation();
                    togglePinCategory(sub.id);
                });
                item.querySelector(".btn-edit-sub")?.addEventListener("click", e => {
                    e.stopPropagation();
                    editCategory(sub.id);
                });
                item.querySelector(".btn-del-sub")?.addEventListener("click", e => {
                    e.stopPropagation();
                    e.preventDefault();
                    deleteCategory(sub.id);
                });
            }

            subWrapper.appendChild(item);
        });

        container.appendChild(subWrapper);
    }

    let categoryData = database.data.filter(d => d.categoryId === currentCategoryId);
    categoryData = sortItemsByPin(categoryData);

    let noHeaderData = categoryData.filter(d => !d.headerId);

    if (filterText) {
        noHeaderData = noHeaderData.filter(d =>
            (d.name && d.name.toLowerCase().includes(filterText)) ||
            (d.mobile && d.mobile.toLowerCase().includes(filterText)) ||
            (d.phone && d.phone.toLowerCase().includes(filterText)) ||
            (d.designation && d.designation.toLowerCase().includes(filterText))
        );
    }

    if (noHeaderData.length > 0) {
        const noHeaderWrapper = document.createElement("div");
        noHeaderWrapper.style.marginBottom = "15px";

        noHeaderData.forEach(item => {
            noHeaderWrapper.appendChild(createDataCardElement(item));
        });

        container.appendChild(noHeaderWrapper);
    }

    let headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    headers = sortItemsByPin(headers);

    headers.forEach(header => {
        const headerAllData = categoryData.filter(d => d.headerId === header.id);
        
        const isHeaderMatched = filterText && header.title.toLowerCase().includes(filterText);

        let matchedData = headerAllData;
        if (filterText && !isHeaderMatched) {
            matchedData = headerAllData.filter(d =>
                (d.name && d.name.toLowerCase().includes(filterText)) ||
                (d.mobile && d.mobile.toLowerCase().includes(filterText)) ||
                (d.phone && d.phone.toLowerCase().includes(filterText)) ||
                (d.designation && d.designation.toLowerCase().includes(filterText))
            );
        }

        if (!filterText || isHeaderMatched || matchedData.length > 0) {
            const displayData = isHeaderMatched ? headerAllData : matchedData;

            const headerBox = document.createElement("div");
            headerBox.className = "header-box";

            const pinIcon = header.pinned ? "📌" : "📍";

            const adminActions = isAdmin
                ? `
                    <div>
                        <button class="btn-pin-head custom-action-btn" title="পিন">${pinIcon}</button>
                        <button class="btn-edit-head custom-action-btn">✏️</button>
                        <button class="btn-del-head custom-action-btn" style="color:#ef4444">🗑️</button>
                    </div>
                `
                : "";

            const headerPinMark = (isAdmin && header.pinned) ? "📌" : "";

            headerBox.innerHTML = `
                <div class="header-banner">
                    <span>${escapeHTML(header.title)} ${headerPinMark}</span>
                    ${adminActions}
                </div>
            `;

            if (isAdmin) {
                headerBox.querySelector(".btn-pin-head")?.addEventListener("click", e => {
                    e.stopPropagation();
                    togglePinHeader(header.id);
                });
                headerBox.querySelector(".btn-edit-head")?.addEventListener("click", e => {
                    e.stopPropagation();
                    editHeader(header.id);
                });
                headerBox.querySelector(".btn-del-head")?.addEventListener("click", e => {
                    e.stopPropagation();
                    e.preventDefault();
                    deleteHeader(header.id);
                });
            }

            displayData.forEach(item => {
                headerBox.appendChild(createDataCardElement(item));
            });

            container.appendChild(headerBox);
        }
    });

    updateAdminUI();
}

/* =========================================
   Open Data Page
========================================= */
function openDataPage(dataId, pushHistory = true) {
    if (pushHistory) {
        history.pushState({ page: "data", dataId: dataId }, "");
    }
    showDataPage(dataId);
}

/* =========================================
   Data Details Page
========================================= */
function showDataPage(dataId) {
    const item = database.data.find(d => d.id === dataId);
    if (!item) return;

    currentDataId = dataId;
    setNavState(true);

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.remove("hidden");

    const container = document.getElementById("dataPageContent");
    if (!container) return;

    const isAdmin = window.currentUserRole === "admin";
    const name = escapeHTML(item.name || "নাম পাওয়া যায়নি");
    const designation = escapeHTML(item.designation || "পদবী নেই");
    const mobile = escapeHTML(item.mobile || "মোবাইল নেই");
    const phone = escapeHTML(item.phone || "টেলিফোন নেই");
    const email = escapeHTML(item.email || "ইমেইল নেই");
    const currentOffice = escapeHTML(item.currentOffice || "");
    const permanentAddress = escapeHTML(item.permanentAddress || "");
    const adminInfo = escapeHTML(item.adminInfo || "");
    const photo = item.photo ? escapeHTML(item.photo) : null;

    const avatarHtml = photo
        ? `<img src="${photo}" alt="${name}" class="details-avatar-large" onerror="this.outerHTML='<div class=\\'details-avatar-large\\'>👤</div>'">`
        : `<div class="details-avatar-large">👤</div>`;

    const showAdminInfoBox = (isDeviceVerified || isAdmin) && adminInfo;
    const showVerifyBtnInDetails = (!isDeviceVerified && !isAdmin);

    container.innerHTML = `
        <div class="details-header-section">
            <div class="avatar-wrapper">${avatarHtml}</div>
            <h2 style="font-size:22px;font-weight:700;">${name}</h2>
            <p style="color:var(--text-muted);font-size:15px;">${designation}</p>
        </div>

        <div class="quick-action-grid">
            <button id="btnMobileCall" class="action-btn-round btn-call-round">📱 মোবাইল</button>
            <button id="btnPhoneCall" class="action-btn-round btn-phone-round">☎️ টেলিফোন</button>
            <a href="${item.email ? "mailto:" + item.email : "#"}" class="action-btn-round btn-email-round">✉️ ইমেইল</a>
            <button id="btnShareContact" class="action-btn-round btn-share-round">🔗 শেয়ার কন্টাক্ট</button>
        </div>

        <div class="details-info-list">
            <div class="details-info-box">
                <div class="info-label">📱 মোবাইল</div>
                <div class="info-value">${mobile}</div>
            </div>
            <div class="details-info-box">
                <div class="info-label">☎️ টেলিফোন</div>
                <div class="info-value">${phone}</div>
            </div>
            <div class="details-info-box">
                <div class="info-label">💼 পদবী</div>
                <div class="info-value">${designation}</div>
            </div>
            <div class="details-info-box">
                <div class="info-label">✉️ ই-মেইল</div>
                <div class="info-value">${email}</div>
            </div>
            ${currentOffice ? `
                <div class="details-info-box">
                    <div class="info-label">🏢 বর্তমান ঠিকানা</div>
                    <div class="info-value">${currentOffice}</div>
                </div>` : ""
            }
            ${permanentAddress ? `
                <div class="details-info-box">
                    <div class="info-label">🏠 স্থায়ী ঠিকানা</div>
                    <div class="info-value">${permanentAddress}</div>
                </div>` : ""
            }
            ${showAdminInfoBox ? `
                <div class="details-info-box" style="border-left:4px solid #f59e0b;">
                    <div class="info-label">📝 প্রশাসনিক তথ্য</div>
                    <div class="info-value">${adminInfo}</div>
                </div>` : ""
            }
            ${showVerifyBtnInDetails ? `
                <div style="text-align: right; margin-top: 5px;">
                    <button class="btn-get-verify" id="detailsVerifyBtn" title="প্রশাসনিক ডাটা ভেরিফিকেশনের জন্য ১০ সে. চেপে রাখুন">Get Verify</button>
                </div>` : ""
            }
        </div>
    `;

    setupSmartCallAndWhatsApp(document.getElementById("btnMobileCall"), item.mobile);
    setupSmartCallAndWhatsApp(document.getElementById("btnPhoneCall"), item.phone);

    const detailsVerifyBtn = document.getElementById("detailsVerifyBtn");
    if (detailsVerifyBtn) {
        setupHoldToVerify(detailsVerifyBtn);
    }

    document.getElementById("btnShareContact")?.addEventListener("click", () => {
        const shareText =
            `👤 নাম: ${item.name || ""}\n` +
            `📱 মোবাইল: ${item.mobile || ""}\n` +
            `☎️ টেলিফোন: ${item.phone || ""}\n` +
            `✉️ ইমেইল: ${item.email || ""}\n` +
            `💼 পদবী: ${item.designation || ""}`;

        if (navigator.share) {
            navigator.share({ title: item.name, text: shareText }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareText);
            showToast("কন্টাক্ট কপি করা হয়েছে!");
        }
    });
}

/* =========================================
   Smart Dial & Long Press WhatsApp Handler
========================================= */
function setupSmartCallAndWhatsApp(element, rawNumber) {
    if (!element || !rawNumber || rawNumber === "মোবাইল নেই" || rawNumber === "টেলিফোন নেই") {
        if (element) {
            element.style.opacity = "0.5";
            element.style.cursor = "not-allowed";
        }
        return;
    }

    let pressTimer = null;
    let isLongPress = false;

    const startPress = () => {
        isLongPress = false;

        pressTimer = setTimeout(() => {
            isLongPress = true;

            if (navigator.vibrate) {
                navigator.vibrate(60);
            }

            let cleanNumber = rawNumber.replace(/\D/g, '');
            if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
                cleanNumber = '88' + cleanNumber;
            }

            if (cleanNumber) {
                window.open(`https://wa.me/${cleanNumber}`, '_blank');
            } else {
                showToast("সঠিক নাম্বার পাওয়া যায়নি!");
            }
        }, 600);
    };

    const cancelPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    element.addEventListener('mousedown', startPress);
    element.addEventListener('touchstart', startPress, { passive: true });

    element.addEventListener('mouseup', cancelPress);
    element.addEventListener('mouseleave', cancelPress);
    element.addEventListener('touchend', cancelPress);
    element.addEventListener('touchcancel', cancelPress);

    element.addEventListener('click', (e) => {
        e.preventDefault();

        if (!isLongPress) {
            let cleanNumber = rawNumber.replace(/[^\d+]/g, '');

            if (cleanNumber) {
                const callLink = document.createElement('a');
                callLink.href = `tel:${cleanNumber}`;
                callLink.style.display = 'none';
                document.body.appendChild(callLink);
                callLink.click();

                setTimeout(() => {
                    if (callLink.parentNode) {
                        callLink.parentNode.removeChild(callLink);
                    }
                }, 1000);
            }
        }
        isLongPress = false;
    });
}

/* =========================================
   Modal Helpers
========================================= */
function openModal(id) {
    document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id)?.classList.add("hidden");
}

/* =========================================
   Custom Confirm Promise Helper
========================================= */
function customConfirm(message, title = "নিশ্চিতকরণ", confirmText = "হ্যাঁ, মুছুন") {
    return new Promise((resolve) => {
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
