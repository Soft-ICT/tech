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
    remove,
    push
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import {
    db
} from "./firebase.js";

"use strict";

const DEFAULT_CATEGORY_IMAGE = "https://cdn-icons-png.flaticon.com/512/3541/3541850.png";

// বর্তমান ভাষা ট্র্যাক করার গ্লোবাল ভেরিয়েবল (ডিফল্ট বাংলা 'bn')
window.currentAppLang = localStorage.getItem("police_pb_lang") || "bn";

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
let isFavoriteActive = false;

window.currentUserRole = "guest";
let isDeviceVerified = false;

function getDeviceId() {
    let devId = localStorage.getItem("police_pb_device_id");
    if (!devId) {
        devId = "DEV_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
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
            if (!currentCategoryId && !currentDataId && !isAllSearchActive && !isFavoriteActive) {
                document.getElementById("verifiedBadge")?.classList.remove("hidden");
            }
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
    showToast("🟢 অনলাইন মোডে আছেন ");
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

function isAllSupportOrSearchActive() {
    return isAllSearchActive || currentCategoryId !== null || currentDataId !== null || isFavoriteActive;
}

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

    const adminContainer = document.getElementById("adminActionContainer");
    if (adminContainer) {
        if (isAdmin && !isAllSupportOrSearchActive()) {
            adminContainer.style.display = "flex";
        } else {
            adminContainer.classList.add("hidden");
            adminContainer.style.display = "none";
        }
    }

    document.querySelectorAll(".admin-only").forEach(el => {
        if (isAdmin) {
            if (el.id === "addCategoryBtn" && (isAllSearchActive || isFavoriteActive)) {
                el.classList.add("hidden");
            } else {
                el.classList.remove("hidden");
            }
        } else {
            el.classList.add("hidden");
        }
    });

    const loginForm = document.getElementById("loginFormContainer");
    const logoutContainer = document.getElementById("logoutContainer");

    if (loginForm) loginForm.style.display = isAdmin ? "none" : "block";
    if (logoutContainer) {
        if (isAdmin) logoutContainer.classList.remove("hidden");
        else logoutContainer.classList.add("hidden");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    initTheme();
    updateAdminUI();

    // রেডিও বাটনের সঠিক স্টেট সেট করা
    const radioEl = document.querySelector(`input[name="appLangRadio"][value="${window.currentAppLang}"]`);
    if (radioEl) radioEl.checked = true;

    checkDeviceVerificationStatus();
    loadLocalCache();
    checkOnlineStatus();
    
    history.replaceState({ page: "home" }, "");
    window.addEventListener("popstate", handlePopState);
});

// ভাষা পরিবর্তনের মূল ফাংশন (ডাইনামিক টেক্সট হ্যান্ডেল করার জন্য)
window.changeAppLanguage = function(lang) {
    window.currentAppLang = lang;
    localStorage.setItem("police_pb_lang", lang);
    showToast(lang === 'en' ? "Language switched to English" : "ভাষা বাংলায় পরিবর্তন করা হয়েছে");
    refreshCurrentView();
};

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
        
        if (!currentCategoryId && !currentDataId && !isAllSearchActive && !isFavoriteActive) {
            setNavState(false);
        }
        handleSearch();
    }
}

function handlePopState(event) {
    closeHeaderSearch();
    const state = event.state;

    if (!state || state.page === "home") {
        isFavoriteActive = false;
        closeAllSearchUI();
        showMainDashboardView();
    } else if (state.page === "allSearch") {
        isFavoriteActive = false;
        if (!isAllSearchActive) activateAllSearchUI();
    } else if (state.page === "favorite") {
        isFavoriteActive = true;
        closeAllSearchUI();
        renderFavoriteView(false);
    } else if (state.page === "category") {
        isFavoriteActive = false;
        closeAllSearchUI();
        showCategoryView(state.categoryId, false);
    } else if (state.page === "data") {
        isFavoriteActive = false;
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
    refreshCurrentView();

    if (!navigator.onLine) {
        showToast("অফলাইনে সেভ হয়েছে! ইন্টারনেট এলে ডাটাবেজে যুক্ত হবে।");
        return;
    }

    set(ref(db, "webapp/public_data"), database).catch((error) => {
        console.error("Database background save error:", error);
    });
}

function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
}

function sortItemsByPin(items) {
    return items.sort((a, b) => {
        const pinA = a.isPinned || a.pinned ? 1 : 0;
        const pinB = b.isPinned || b.pinned ? 1 : 0;
        if (pinA && !pinB) return -1;
        if (!pinA && pinB) return 1;
        if (pinA && pinB) return (a.pinnedAt || a.pinnedOrder || 0) - (b.pinnedAt || b.pinnedOrder || 0);
        return (a.createdAt || 0) - (b.createdAt || 0);
    });
}

function sortContactData(items) {
    return items.sort((a, b) => {
        const pinA = a.isPinned || a.pinned ? 1 : 0;
        const pinB = b.isPinned || b.pinned ? 1 : 0;
        if (pinA && !pinB) return -1;
        if (!pinA && pinB) return 1;
        if (pinA && pinB) return (a.pinnedAt || a.pinnedOrder || 0) - (b.pinnedAt || b.pinnedOrder || 0);

        let nameA = String(getLocalizedField(a, 'name') || "").trim();
        let nameB = String(getLocalizedField(b, 'name') || "").trim();
        return nameA.localeCompare(nameB, window.currentAppLang === 'en' ? 'en' : 'bn', { numeric: true, sensitivity: 'base' });
    });
}

// ডাইনামিক ফিল্ড সহায়ক ফাংশন (বাংলা ও ইংরেজি আলাদা প্রপার্টি যেমন nameEn, nameBn বা একই ফিল্ড হ্যান্ডেল করতে)
function getLocalizedField(item, fieldName) {
    if (!item) return "";
    const langSuffix = window.currentAppLang === 'en' ? 'En' : 'Bn';
    const specificField = fieldName + langSuffix;
    if (item[specificField]) {
        return item[specificField];
    }
    return item[fieldName] || "";
}

function setupEvents() {
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);
    document.getElementById("navToggleBtn")?.addEventListener("click", (e) => {
        const searchBox = document.getElementById("searchBox");
        const isSearchOpen = searchBox && !searchBox.classList.contains("hidden");

        if (isSearchOpen) {
            e.stopImmediatePropagation();
            e.preventDefault();
            closeHeaderSearch();
            return;
        }

        if (currentCategoryId || currentDataId || isAllSearchActive || isFavoriteActive) {
            history.back();
            return;
        }
    }, true);

    document.getElementById("searchBtn")?.addEventListener("click", openHeaderSearch);
    document.getElementById("searchInput")?.addEventListener("input", handleSearch);
    document.getElementById("allSearchBtn")?.addEventListener("click", () => {
        history.pushState({ page: "allSearch" }, "");
        activateAllSearchUI();
    });

    document.getElementById("adminLoginBtn")?.addEventListener("click", () => openModal("loginModal"));
    document.getElementById("addCategoryBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("emptyAddBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("addSubCategoryBtn")?.addEventListener("click", () => openCategoryModal(true));
    document.getElementById("saveCategoryBtn")?.addEventListener("click", saveCategory);
    document.getElementById("saveHeaderBtn")?.addEventListener("click", saveHeader);
    document.getElementById("saveDataBtn")?.addEventListener("click", saveData);
    document.getElementById("addHeaderBtn")?.addEventListener("click", () => openHeaderModal());
    document.getElementById("addDataBtn")?.addEventListener("click", () => openDataModal());

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
}

function handleSearch() {
    const rawVal = document.getElementById("searchInput")?.value.trim();
    const searchVal = rawVal ? rawVal.toLowerCase() : "";

    if (isAllSearchActive) {
        renderAllSearch();
    } else if (isFavoriteActive) {
        renderFavoriteView(false);
    } else if (currentCategoryId) {
        renderCategoryDetails(searchVal);
    } else {
        renderCategories(searchVal);
    }
}

function activateAllSearchUI() {
    isAllSearchActive = true;
    isFavoriteActive = false;
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
    if (searchVal) {
        allData = allData.filter(d => {
            const name = String(getLocalizedField(d, 'name')).toLowerCase();
            const mobile = String(d.mobile || "").toLowerCase();
            const desig = String(getLocalizedField(d, 'designation')).toLowerCase();
            return name.includes(searchVal) || mobile.includes(searchVal) || desig.includes(searchVal);
        });
    }

    allData = sortContactData(allData);
    if (allData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted); font-size: 16px;">🔍 কোনো তথ্য পাওয়া যায়নি</div>`;
        return;
    }

    allData.forEach(item => {
        container.appendChild(createDataCardElement(item));
    });
}

function renderCategories(searchVal = "") {
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    if (!list || !emptyState) return;

    let categoriesToShow = database.categories.filter(cat => !cat.parentId);
    if (searchVal) {
        categoriesToShow = categoriesToShow.filter(cat => String(getLocalizedField(cat, 'name')).toLowerCase().includes(searchVal));
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
        const catName = escapeHTML(getLocalizedField(category, 'name'));
        const imgSrc = category.image ? escapeHTML(category.image) : DEFAULT_CATEGORY_IMAGE;

        card.innerHTML = `
            <div class="cat-click" style="display:flex; align-items:center; width:100%;">
                <img src="${imgSrc}" class="cat-card-img" onerror="this.src='${DEFAULT_CATEGORY_IMAGE}'">
                <h3>${catName}</h3>
            </div>
        `;
        card.querySelector(".cat-click").addEventListener("click", () => openCategory(category.id));
        list.appendChild(card);
    });
}

function openCategoryModal(isSubCategory = false, editObj = null) {
    if (window.currentUserRole !== "admin") return;
    editingItem = editObj;
    document.getElementById("categoryModalTitle").textContent = editObj ? "Category এডিট করুন" : (isSubCategory ? "নতুন Sub-Category" : "নতুন Category");
    document.getElementById("categoryNameInput").value = editObj ? getLocalizedField(editObj, 'name') : "";
    document.getElementById("categoryImageInput").value = editObj?.image || "";
    openModal("categoryModal");
}

async function saveCategory() {
    if (window.currentUserRole !== "admin") return;
    const nameVal = document.getElementById("categoryNameInput")?.value.trim();
    const image = document.getElementById("categoryImageInput")?.value.trim() || "";
    if (!nameVal) return showToast("Category Name লিখুন");

    if (editingItem) {
        if (window.currentAppLang === 'en') editingItem.nameEn = nameVal;
        else editingItem.nameBn = nameVal;
        editingItem.image = image;
        editingItem = null;
    } else {
        const newCat = {
            id: generateId("cat"),
            parentId: currentCategoryId ? currentCategoryId : null,
            image: image,
            pinned: false,
            createdAt: Date.now()
        };
        if (window.currentAppLang === 'en') newCat.nameEn = nameVal;
        else newCat.nameBn = nameVal;
        database.categories.push(newCat);
    }
    closeModal("categoryModal");
    await saveDatabase();
    showToast("সেভ করা হয়েছে");
}

function openHeaderModal(editObj = null) {
    if (window.currentUserRole !== "admin") return;
    editingItem = editObj;
    document.getElementById("headerNameInput").value = editObj ? getLocalizedField(editObj, 'title') : "";
    openModal("headerModal");
}

async function saveHeader() {
    if (window.currentUserRole !== "admin") return;
    const titleVal = document.getElementById("headerNameInput")?.value.trim();
    if (!titleVal || !currentCategoryId) return showToast("হেডার নাম লিখুন");

    if (editingItem) {
        if (window.currentAppLang === 'en') editingItem.titleEn = titleVal;
        else editingItem.titleBn = titleVal;
        editingItem = null;
    } else {
        const newHead = {
            id: generateId("header"),
            categoryId: currentCategoryId,
            pinned: false,
            createdAt: Date.now()
        };
        if (window.currentAppLang === 'en') newHead.titleEn = titleVal;
        else newHead.titleBn = titleVal;
        database.headers.push(newHead);
    }
    closeModal("headerModal");
    await saveDatabase();
    showToast("Header সেভ করা হয়েছে");
}

function getFavoriteIds() {
    try {
        const favs = localStorage.getItem("police_pb_favorites");
        return favs ? JSON.parse(favs) : [];
    } catch (e) { return []; }
}

function toggleFavorite(dataId, event) {
    if (event) event.stopPropagation();
    let favs = getFavoriteIds();
    const index = favs.indexOf(dataId);
    if (index > -1) {
        favs.splice(index, 1);
        showToast("ফেভারিট থেকে সরানো হয়েছে");
    } else {
        favs.push(dataId);
        showToast("ফেভারিটে যোগ করা হয়েছে");
    }
    localStorage.setItem("police_pb_favorites", JSON.stringify(favs));
    refreshCurrentView();
}

function isFavorite(dataId) { return getFavoriteIds().includes(dataId); }

function renderFavoriteView(pushHistory = true) {
    if (pushHistory) history.pushState({ page: "favorite" }, "");
    isFavoriteActive = true;
    currentCategoryId = null;
    currentDataId = null;
    isAllSearchActive = false;

    document.getElementById("mainDashboardView")?.classList.remove("hidden");
    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("allSearchContainer")?.classList.add("hidden");

    const list = document.getElementById("categoryList");
    if (list) list.innerHTML = "";
    
    const favIds = getFavoriteIds();
    let favData = (database.data || []).filter(d => favIds.includes(d.id));
    favData = sortContactData(favData);

    if (favData.length === 0) {
        document.getElementById("emptyState")?.classList.remove("hidden");
        list?.classList.add("hidden");
        return;
    }

    document.getElementById("emptyState")?.classList.add("hidden");
    list?.classList.remove("hidden");
    favData.forEach(item => list.appendChild(createDataCardElement(item)));
}
window.renderFavoriteView = renderFavoriteView;

function createDataCardElement(item) {
    const isAdmin = window.currentUserRole === "admin";
    const dataEl = document.createElement("div");
    dataEl.className = "data-card-item";

    const name = escapeHTML(getLocalizedField(item, 'name') || "নাম পাওয়া যায়নি");
    const mobile = escapeHTML(item.mobile || "মোবাইল নেই");
    const phone = escapeHTML(item.phone || "টেলিফোন নেই");
    const designation = escapeHTML(getLocalizedField(item, 'designation') || "পদবী নেই");
    const photo = item.photo ? escapeHTML(item.photo) : null;

    const avatarHtml = photo ? `<img src="${photo}" class="data-card-avatar" onerror="this.outerHTML='<div class=\\'data-card-avatar\\'>👤</div>'">` : `<div class="data-card-avatar">👤</div>`;
    const favIcon = isFavorite(item.id) ? "❤️" : "🤍";

    dataEl.innerHTML = `
        ${avatarHtml}
        <div class="data-card-info">
            <div class="data-card-name">${name}</div>
            <div class="data-card-detail">📱 ${mobile}</div>
            <div class="data-card-detail">💼 ${designation}</div>
        </div>
        <button class="btn-fav-item custom-action-btn" title="ফেভারিট">${favIcon}</button>
    `;

    dataEl.addEventListener("click", () => openDataPage(item.id));
    dataEl.querySelector(".btn-fav-item")?.addEventListener("click", e => toggleFavorite(item.id, e));
    return dataEl;
}

function openDataModal(editObj = null) {
    if (window.currentUserRole !== "admin") return;
    editingItem = editObj;
    document.getElementById("dataModalTitle").textContent = editObj ? "Data এডিট করুন" : "Data যোগ করুন";

    document.getElementById("dataPhoto").value = editObj?.photo || "";
    document.getElementById("dataName").value = editObj ? getLocalizedField(editObj, 'name') : "";
    document.getElementById("dataMobile").value = editObj?.mobile || "";
    document.getElementById("dataPhone").value = editObj?.phone || "";
    document.getElementById("dataDesignation").value = editObj ? getLocalizedField(editObj, 'designation') : "";
    document.getElementById("dataEmail").value = editObj?.email || "";
    document.getElementById("dataCurrentOffice").value = editObj ? getLocalizedField(editObj, 'currentOffice') : "";
    document.getElementById("dataPermanentAddress").value = editObj ? getLocalizedField(editObj, 'permanentAddress') : "";
    document.getElementById("dataAdminInfo").value = editObj ? getLocalizedField(editObj, 'adminInfo') : "";

    const select = document.getElementById("dataHeaderSelect");
    if (select) {
        select.innerHTML = `<option value="">Header ছাড়া</option>`;
        database.headers.filter(h => h.categoryId === currentCategoryId).forEach(h => {
            select.innerHTML += `<option value="${h.id}" ${editObj?.headerId === h.id ? "selected" : ""}>${escapeHTML(getLocalizedField(h, 'title'))}</option>`;
        });
    }
    openModal("dataModal");
}

async function saveData() {
    if (window.currentUserRole !== "admin") return;
    if (!currentCategoryId && !editingItem) return showToast("ক্যাটাগরি সিলেক্ট করা নেই");

    const nameVal = document.getElementById("dataName")?.value.trim() || "";
    const mobile = document.getElementById("dataMobile")?.value.trim() || "";
    const desigVal = document.getElementById("dataDesignation")?.value.trim() || "";
    const currentOfficeVal = document.getElementById("dataCurrentOffice")?.value.trim() || "";
    const permanentAddressVal = document.getElementById("dataPermanentAddress")?.value.trim() || "";
    const adminInfoVal = document.getElementById("dataAdminInfo")?.value.trim() || "";

    if (!nameVal) return showToast("নাম প্রদান করুন");

    const payload = {
        photo: document.getElementById("dataPhoto")?.value.trim() || "",
        mobile: mobile,
        phone: document.getElementById("dataPhone")?.value.trim() || "",
        email: document.getElementById("dataEmail")?.value.trim() || "",
        headerId: document.getElementById("dataHeaderSelect")?.value || null
    };

    const langSuffix = window.currentAppLang === 'en' ? 'En' : 'Bn';
    payload['name' + langSuffix] = nameVal;
    payload['designation' + langSuffix] = desigVal;
    payload['currentOffice' + langSuffix] = currentOfficeVal;
    payload['permanentAddress' + langSuffix] = permanentAddressVal;
    payload['adminInfo' + langSuffix] = adminInfoVal;

    if (editingItem) {
        Object.assign(editingItem, payload);
        editingItem = null;
    } else {
        database.data.push({
            id: generateId("data"),
            categoryId: currentCategoryId,
            ...payload,
            pinned: false,
            createdAt: Date.now()
        });
    }

    closeModal("dataModal");
    await saveDatabase();
    showToast("ডাটা সেভ হয়েছে");
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
    isFavoriteActive = false;

    const titleText = document.querySelector(".app-title-text");
    if (titleText) titleText.textContent = getLocalizedField(category, 'name');

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    renderCategoryDetails();
}

function showMainDashboardView() {
    currentCategoryId = null;
    currentDataId = null;
    isFavoriteActive = false;

    const titleText = document.querySelector(".app-title-text");
    if (titleText) titleText.textContent = "Police Phonebook";

    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("mainDashboardView")?.classList.remove("hidden");

    if (isAllSearchActive) renderAllSearch();
    else renderCategories();
}

function refreshCurrentView() {
    if (currentDataId) showDataPage(currentDataId, false);
    else if (currentCategoryId) showCategoryView(currentCategoryId);
    else if (isAllSearchActive) renderAllSearch();
    else if (isFavoriteActive) renderFavoriteView(false);
    else showMainDashboardView();
}

function renderCategoryDetails() {
    const container = document.getElementById("detailsContent");
    if (!container) return;
    container.innerHTML = "";

    let categoryData = database.data.filter(d => d.categoryId === currentCategoryId);
    categoryData = sortContactData(categoryData);

    let noHeaderData = categoryData.filter(d => !d.headerId);
    if (noHeaderData.length > 0) {
        const noHeaderWrapper = document.createElement("div");
        noHeaderWrapper.style.marginBottom = "15px";
        noHeaderData.forEach(item => noHeaderWrapper.appendChild(createDataCardElement(item)));
        container.appendChild(noHeaderWrapper);
    }

    let headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    headers.forEach(header => {
        const headerData = categoryData.filter(d => d.headerId === header.id);
        if (headerData.length > 0) {
            const headerBox = document.createElement("div");
            headerBox.className = "header-box";
            headerBox.innerHTML = `<div class="header-banner"><span>${escapeHTML(getLocalizedField(header, 'title'))}</span></div>`;
            headerData.forEach(item => headerBox.appendChild(createDataCardElement(item)));
            container.appendChild(headerBox);
        }
    });
}

function openDataPage(dataId, pushHistory = true) {
    if (pushHistory) history.pushState({ page: "data", dataId: dataId }, "");
    showDataPage(dataId);
}

function showDataPage(dataId) {
    const item = database.data.find(d => d.id === dataId);
    if (!item) return;

    currentDataId = dataId;
    isFavoriteActive = false;
    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.remove("hidden");

    renderDataDetailsContent(item);
}

function renderDataDetailsContent(item) {
    const container = document.getElementById("dataPageContent");
    if (!container) return;

    const name = escapeHTML(getLocalizedField(item, 'name') || "নাম পাওয়া যায়নি");
    const designation = escapeHTML(getLocalizedField(item, 'designation') || "পদবী নেই");
    const mobile = escapeHTML(item.mobile || "মোবাইল নেই");
    const phone = escapeHTML(item.phone || "টেলিফোন নেই");
    const email = escapeHTML(item.email || "ইমেইল নেই");
    const currentOffice = escapeHTML(getLocalizedField(item, 'currentOffice') || "");
    const permanentAddress = escapeHTML(getLocalizedField(item, 'permanentAddress') || "");
    const adminInfo = escapeHTML(getLocalizedField(item, 'adminInfo') || "");
    const photo = item.photo ? escapeHTML(item.photo) : null;

    const avatarHtml = photo ? `<img src="${photo}" class="details-avatar-large" onerror="this.outerHTML='<div class=\\'details-avatar-large\\'>👤</div>'">` : `<div class="details-avatar-large">👤</div>`;

    container.innerHTML = `
        <div class="details-header-section">
            <div class="avatar-wrapper">${avatarHtml}</div>
            <h2 style="font-size:22px;font-weight:700;">${name}</h2>
            <p style="color:var(--text-muted);font-size:15px;">${designation}</p>
        </div>
        <div class="details-info-list">
            <div class="details-info-box"><div class="info-label">📱 মোবাইল</div><div class="info-value">${mobile}</div></div>
            <div class="details-info-box"><div class="info-label">☎️ টেলিফোন</div><div class="info-value">${phone}</div></div>
            <div class="details-info-box"><div class="info-label">💼 পদবী</div><div class="info-value">${designation}</div></div>
            <div class="details-info-box"><div class="info-label">✉️ ই-মেইল</div><div class="info-value">${email}</div></div>
            ${currentOffice ? `<div class="details-info-box"><div class="info-label">🏢 বর্তমান ঠিকানা</div><div class="info-value">${currentOffice}</div></div>` : ""}
            ${permanentAddress ? `<div class="details-info-box"><div class="info-label">🏠 স্থায়ী ঠিকানা</div><div class="info-value">${permanentAddress}</div></div>` : ""}
            ${adminInfo ? `<div class="details-info-box" style="border-left:4px solid #f59e0b;"><div class="info-label">📝 প্রশাসনিক তথ্য</div><div class="info-value">${adminInfo}</div></div>` : ""}
        </div>
    `;
}

function openModal(id) { document.getElementById(id)?.classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id)?.classList.add("hidden"); }

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}
