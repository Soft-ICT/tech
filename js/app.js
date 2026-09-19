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
            adminContainer.classList.remove("flex");
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

document.addEventListener("DOMContentLoaded", () => {
    initOfflineLanguageSystem();
    setupEvents();
    initTheme();
    updateAdminUI();

    checkDeviceVerificationStatus();
    loadLocalCache();
    checkOnlineStatus();
    initNotificationSystem();

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
        showMainDashboardView(false);
    } else if (state.page === "allSearch") {
        isFavoriteActive = false;
        currentDataId = null;
        currentCategoryId = null;
        document.getElementById("dataDetailsView")?.classList.add("hidden");
        document.getElementById("categoryDetailsView")?.classList.add("hidden");
        document.getElementById("mainDashboardView")?.classList.remove("hidden");
        activateAllSearchUI();
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
        showToast("ক্লাউডে সিঙ্ক করতে সমস্যা হয়েছে");
    });
}

function initNotificationSystem() {
    const notificationBtn = document.getElementById("notificationBtn");
    
    if (notificationBtn) {
        notificationBtn.addEventListener("click", () => {
            showToast("নোটিফিকেশন প্যানেল ওপেন করা হয়েছে");
        });
    }

    const publishSlidingBtn = document.getElementById("publishSlidingNoticeBtn");
    if (publishSlidingBtn) {
        publishSlidingBtn.addEventListener("click", async () => {
            if (window.currentUserRole !== "admin") {
                return showToast("শুধুমাত্র অ্যাডমিন নোটিশ প্রকাশ করতে পারবেন");
            }

            const title = document.getElementById("slidingTitleInput")?.value.trim();
            const message = document.getElementById("slidingMessageInput")?.value.trim();

            if (!title || !message) {
                return showToast("শিরোনাম এবং বিস্তারিত উভয়ই পূরণ করুন");
            }

            try {
                const noticesRef = ref(db, "webapp/notices");
                await push(noticesRef, {
                    type: "sliding",
                    title: title,
                    message: message,
                    time: Date.now()
                });
                
                showToast("✅ স্লাইডিং নোটিশ সফলভাবে সেভ হয়েছে!");
                document.getElementById("slidingTitleInput").value = "";
                document.getElementById("slidingMessageInput").value = "";
            } catch (error) {
                console.error("Notice save error:", error);
                showToast("❌ নোটিশ সেভ করতে ব্যর্থ হয়েছে");
            }
        });
    }
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

        if (pinA && pinB) {
            return (a.pinnedAt || a.pinnedOrder || 0) - (b.pinnedAt || b.pinnedOrder || 0);
        }

        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        
        return timeA - timeB;
    });
}

function sortContactData(items) {
    return items.sort((a, b) => {
        const pinA = a.isPinned || a.pinned ? 1 : 0;
        const pinB = b.isPinned || b.pinned ? 1 : 0;
        
        if (pinA && !pinB) return -1;
        if (!pinA && pinB) return 1;

        if (pinA && pinB) {
            return (a.pinnedAt || a.pinnedOrder || 0) - (b.pinnedAt || b.pinnedOrder || 0);
        }

        let nameA = String(a.name || "").trim();
        let nameB = String(b.name || "").trim();

        return nameA.localeCompare(nameB, 'bn', { numeric: true, sensitivity: 'base' });
    });
}

function setupEvents() {
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);

    document.getElementById("navToggleBtn")?.addEventListener("click", (e) => {
        const searchBox = document.getElementById("searchBox");
        const isSearchOpen = searchBox && !searchBox.classList.contains("hidden");

        if (isSearchOpen && !currentDataId && !isAllSearchActive) {
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

    document.getElementById("searchBtn")?.addEventListener("click", () => {
        openHeaderSearch();
    });

    document.getElementById("searchInput")?.addEventListener("input", handleSearch);

    document.getElementById("allSearchBtn")?.addEventListener("click", () => {
        history.pushState({ page: "allSearch" }, "");
        activateAllSearchUI();
    });

    document.getElementById("adminLoginBtn")?.addEventListener("click", () => openModal("loginModal"));

    setupAdminButtonLongPress();

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

function setupAdminButtonLongPress() {
    const adminLoginBtn = document.getElementById("adminLoginBtn");
    if (!adminLoginBtn) return;

    let adminHoldTimer = null;

    const startAdminHold = (e) => {
        if (window.currentUserRole !== "admin") return;
        e.preventDefault();
        adminLoginBtn.classList.add("holding");

        adminHoldTimer = setTimeout(() => {
            clearAdminHold();
            if (navigator.vibrate) navigator.vibrate(60);
            openAdminVerifyRequestsModal();
        }, 600);
    };

    const clearAdminHold = () => {
        if (adminHoldTimer) {
            clearTimeout(adminHoldTimer);
            adminHoldTimer = null;
        }
        adminLoginBtn.classList.remove("holding");
    };

    adminLoginBtn.addEventListener("mousedown", startAdminHold);
    adminLoginBtn.addEventListener("touchstart", startAdminHold, { passive: false });
    adminLoginBtn.addEventListener("mouseup", clearAdminHold);
    adminLoginBtn.addEventListener("mouseleave", clearAdminHold);
    adminLoginBtn.addEventListener("touchend", clearAdminHold);
    adminLoginBtn.addEventListener("touchcancel", clearAdminHold);
}

function openAdminVerifyRequestsModal() {
    if (window.currentUserRole !== "admin") return;
    openModal("adminVerifyRequestsModal");
    loadVerificationRequests();
}

async function loadVerificationRequests() {
    const listContainer = document.getElementById("verifyRequestsList");
    if (!listContainer) return;

    listContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">লোড হচ্ছে...</p>`;

    try {
        const reqRef = ref(db, "webapp/verification_requests");
        const snapshot = await get(reqRef);

        if (!snapshot.exists()) {
            listContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">কোনো নতুন ভেরিফিকেশন রিকোয়েস্ট নেই</p>`;
            return;
        }

        listContainer.innerHTML = "";
        const requests = snapshot.val();

        Object.keys(requests).forEach(devId => {
            const req = requests[devId];
            const itemDiv = document.createElement("div");
            itemDiv.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-color);";

            itemDiv.innerHTML = `
                <div>
                    <strong>${escapeHTML(req.name)}</strong><br>
                    <small style="color: var(--text-muted);">${escapeHTML(req.designation)}</small>
                </div>
                <div>
                    <button class="btn-approve-req" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Approve</button>
                    <button class="btn-reject-req" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-left: 5px;">Delete</button>
                </div>
            `;

            itemDiv.querySelector(".btn-approve-req").addEventListener("click", async () => {
                await approveDevice(devId, req);
            });

            itemDiv.querySelector(".btn-reject-req").addEventListener("click", async () => {
                await rejectDeviceRequest(devId);
            });

            listContainer.appendChild(itemDiv);
        });

    } catch (error) {
        console.error("Error loading verification requests:", error);
        listContainer.innerHTML = `<p style="text-align: center; color: #ef4444;">ডাটা লোড করতে সমস্যা হয়েছে</p>`;
    }
}

async function approveDevice(devId, reqData) {
    if (window.currentUserRole !== "admin") return;

    try {
        await set(ref(db, `webapp/approved_devices/${devId}`), {
            status: "approved",
            name: reqData.name,
            designation: reqData.designation,
            approvedAt: Date.now()
        });

        await remove(ref(db, `webapp/verification_requests/${devId}`));
        showToast("✅ ডিভাইস সফলভাবে অ্যাপ্রুভ করা হয়েছে!");
        loadVerificationRequests();
    } catch (e) {
        showToast("অ্যাপ্রুভ করতে ব্যর্থ হয়েছে");
    }
}

async function rejectDeviceRequest(devId) {
    if (window.currentUserRole !== "admin") return;

    const isConfirmed = await customConfirm("আপনি কি এই রিকোয়েস্টটি ডিলিট করতে চান?");
    if (!isConfirmed) return;

    try {
        await remove(ref(db, `webapp/verification_requests/${devId}`));
        showToast("রিকোয়েস্ট ডিলিট করা হয়েছে");
        loadVerificationRequests();
    } catch (e) {
        showToast("ডিলিট করতে ব্যর্থ হয়েছে");
    }
}

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
    const adminContainer = document.getElementById("adminActionContainer");

    allSearchBtn?.classList.add("hidden");
    list?.classList.add("hidden");
    emptyState?.classList.add("hidden");
    container?.classList.remove("hidden");
    
    if (adminContainer) {
        adminContainer.classList.add("hidden");
        adminContainer.style.display = "none";
    }

    document.getElementById("verifiedBadge")?.classList.add("hidden");

    openHeaderSearch();
    renderAllSearch();
}

function closeAllSearchUI() {
    isAllSearchActive = false;
    const container = document.getElementById("allSearchContainer");
    const allSearchBtn = document.getElementById("allSearchBtn");

    allSearchBtn?.classList.remove("hidden");
    container?.classList.add("hidden");
    updateAdminUI();
    
    renderCategories(document.getElementById("searchInput")?.value.trim().toLowerCase());
}

// সার্বজনীন ফ্লেক্সিবল ম্যাচিং ফাংশনটি নিচের BILINGUAL/OFFLINE SEARCH অংশে সংজ্ঞায়িত করা হয়েছে।

function renderAllSearch() {
    const container = document.getElementById("allSearchContainer");
    if (!container) return;

    const rawVal = document.getElementById("searchInput")?.value.trim();
    const searchVal = rawVal ? rawVal.toLowerCase() : "";
    container.innerHTML = "";

    let allData = database.data || [];

    if (searchVal && searchVal !== "admin@jr") {
        allData = allData.filter(d => isDataMatch(d, searchVal));
    }

    allData = sortContactData(allData);

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
        categoriesToShow = categoriesToShow.filter(cat => isMatch(cat.name, searchVal));
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
                e.preventDefault();
                deleteCategory(category.id);
            });
        }

        list.appendChild(card);
    });

    updateAdminUI();
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

    closeModal("categoryModal");
    await saveDatabase();
    showToast("সেভ করা হয়েছে");
}

async function togglePinCategory(id) {
    const cat = database.categories.find(c => c.id === id);
    if (cat) {
        cat.pinned = !cat.pinned;
        cat.pinnedAt = cat.pinned ? Date.now() : 0;
        await saveDatabase();
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
    showToast("ডিলিট করা হয়েছে");
}

function openHeaderModal(editObj = null) {
    if (window.currentUserRole !== "admin") return;
    editingItem = editObj;
    const input = document.getElementById("headerNameInput");
    if (input) input.value = editObj ? editObj.title : "";
    openModal("headerModal");
}

async function saveHeader() {
    if (window.currentUserRole !== "admin") return;
    const title = document.getElementById("headerNameInput")?.value.trim();

    if (!title || !currentCategoryId) return showToast("হেডার নাম লিখুন");

    if (editingItem) {
        editingItem.title = title;
        editingItem = null;
    } else {
        database.headers.push({
            id: generateId("header"),
            categoryId: currentCategoryId,
            title: title,
            pinned: false,
            pinnedAt: 0,
            createdAt: Date.now()
        });
    }

    closeModal("headerModal");
    await saveDatabase();
    showToast("Header সেভ করা হয়েছে");
}

async function togglePinHeader(id) {
    const header = database.headers.find(h => h.id === id);
    if (header) {
        header.pinned = !header.pinned;
        header.pinnedAt = header.pinned ? Date.now() : 0;
        await saveDatabase();
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
    showToast("Header ডিলিট করা হয়েছে");
}

function getFavoriteIds() {
    try {
        const favs = localStorage.getItem("police_pb_favorites");
        return favs ? JSON.parse(favs) : [];
    } catch (e) {
        return [];
    }
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
    if (typeof refreshCurrentView === 'function') refreshCurrentView();
}

function isFavorite(dataId) {
    return getFavoriteIds().includes(dataId);
}

function renderFavoriteView(pushHistory = true) {
    if (pushHistory) history.pushState({ page: "favorite" }, "");
    isFavoriteActive = true;
    currentCategoryId = null;
    currentDataId = null;
    isAllSearchActive = false;

    const appTitle = document.getElementById("appTitle");
    if (appTitle) {
        const titleText = appTitle.querySelector(".app-title-text") || appTitle;
        titleText.textContent = "Favorite Numbers";
    }

    document.getElementById("verifiedBadge")?.classList.add("hidden");
    setNavState(true);

    const subToolbar = document.querySelector(".sub-toolbar") || document.getElementById("subToolbar") || document.getElementById("allSearchBtn");
    if (subToolbar) subToolbar.classList.add("hidden");

    document.getElementById("mainDashboardView")?.classList.remove("hidden");
    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("allSearchContainer")?.classList.add("hidden");

    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    
    if (list) list.innerHTML = "";
    
    const favIds = getFavoriteIds();
    const rawVal = document.getElementById("searchInput")?.value.trim();
    const searchVal = rawVal ? rawVal.toLowerCase() : "";

    let favData = (database.data || []).filter(d => favIds.includes(d.id));

    if (searchVal && searchVal !== "admin@jr") {
        favData = favData.filter(d => isDataMatch(d, searchVal));
    }

    if (favData.length === 0) {
        if (emptyState) {
            emptyState.classList.remove("hidden");
            emptyState.querySelector("h2").textContent = "কোনো ফেভারিট নাম্বার নেই";
            emptyState.querySelector("p").textContent = "হার্ট আইকনে ক্লিক করে ফেভারিটে যুক্ত করুন।";
        }
        if (list) list.classList.add("hidden");
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    if (list) {
        list.classList.remove("hidden");
        favData.forEach(item => {
            list.appendChild(createDataCardElement(item));
        });
    }
    updateAdminUI();
}

window.renderFavoriteView = renderFavoriteView;

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
    const favIcon = isFavorite(item.id) ? "❤️" : "🤍";

    const favButtonHtml = !isAdmin ? `<button class="btn-fav-item custom-action-btn" title="ফেভারিট">${favIcon}</button>` : "";

    const adminActions = isAdmin
        ? `
            <div class="card-admin-actions" style="display:flex;gap:4px; align-items:center;">
                <button class="btn-pin-data custom-action-btn" title="পিন">${pinIcon}</button>
                <button class="btn-move-data custom-action-btn" title="মুভ">📦</button>
                <button class="btn-edit-data custom-action-btn" title="এডিট">✏️</button>
                <button class="btn-del-data custom-action-btn" style="color:#ef4444" title="ডিলিট">🗑️</button>
            </div>
        `
        : `
            <div class="card-admin-actions" style="display:flex;gap:4px; align-items:center;">
                ${favButtonHtml}
            </div>
        `;

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

    const actionGroup = dataEl.querySelector(".card-admin-actions");
    if (actionGroup) actionGroup.addEventListener("click", e => e.stopPropagation());

    dataEl.querySelector(".btn-fav-item")?.addEventListener("click", e => {
        e.stopPropagation();
        toggleFavorite(item.id, e);
    });

    if (isAdmin) {
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

function openDataModal(editObj = null) {
    if (window.currentUserRole !== "admin") return;
    editingItem = editObj;

    const title = document.getElementById("dataModalTitle");
    if (title) title.textContent = editObj ? "Data এডিট করুন" : "Data যোগ করুন";

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
    if (!currentCategoryId && !editingItem) return showToast("ক্যাটাগরি সিলেক্ট করা নেই");

    const name = document.getElementById("dataName")?.value.trim() || "";
    const mobile = document.getElementById("dataMobile")?.value.trim() || "";
    const phone = document.getElementById("dataPhone")?.value.trim() || "";
    const email = document.getElementById("dataEmail")?.value.trim() || "";

    if (!name) return showToast("নাম প্রদান করুন");

    if (mobile.length !== 11) {
        return showToast("মোবাইল নাম্বার অবশ্যই ১১ ডিজিটের হতে হবে!");
    }

    if (!mobile && !phone && !email) {
        return showToast("মোবাইল, টেলিফোন অথবা ইমেইল এড্রেস ফাঁকা রাখা যাবে না!");
    }

    const payload = {
        photo: document.getElementById("dataPhoto")?.value.trim() || "",
        name: name,
        mobile: mobile,
        phone: phone,
        designation: document.getElementById("dataDesignation")?.value.trim() || "",
        email: email,
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
            pinnedAt: 0,
            createdAt: Date.now()
        });
    }

    closeModal("dataModal");
    await saveDatabase();
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
    showToast("ডাটা ডিলিট করা হয়েছে");
}

async function togglePinData(id) {
    const item = database.data.find(d => d.id === id);
    if (item) {
        item.pinned = !item.pinned;
        item.pinnedAt = item.pinned ? Date.now() : 0;
        await saveDatabase();
        showToast(item.pinned ? "ডাটা পিন করা হয়েছে" : "ডাটা আনপিন করা হয়েছে");
    }
}

function openMoveDataModal(id) {
    movingDataId = id;
    const catSelect = document.getElementById("moveCategorySelect");

    if (catSelect) {
        catSelect.innerHTML = "";
        database.categories.forEach(c => {
            catSelect.innerHTML += `<option value="${c.id}">${escapeHTML(c.name)}</option>`;
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
                headSelect.innerHTML += `<option value="${h.id}">${escapeHTML(h.title)}</option>`;
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
        closeModal("moveDataModal");
        await saveDatabase();
        showToast("ডাটা সফলভাবে মুভ করা হয়েছে!");
    }
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

    const appTitle = document.getElementById("appTitle");
    if (appTitle) {
        const titleText = appTitle.querySelector(".app-title-text") || appTitle;
        titleText.textContent = category.name;
    }

    document.getElementById("verifiedBadge")?.classList.add("hidden");
    setNavState(true);

    const subToolbar = document.querySelector(".sub-toolbar") || document.getElementById("subToolbar") || document.getElementById("allSearchBtn");
    if (subToolbar) subToolbar.classList.add("hidden");

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    const detailsTitle = document.getElementById("detailsTitle");
    if (detailsTitle) detailsTitle.style.display = "none";

    updateAdminUI();
    renderCategoryDetails(document.getElementById("searchInput")?.value.trim().toLowerCase());
}

function showMainDashboardView() {
    currentCategoryId = null;
    currentDataId = null;
    isFavoriteActive = false;

    const appTitle = document.getElementById("appTitle");
    if (appTitle) {
        const titleText = appTitle.querySelector(".app-title-text") || appTitle;
        titleText.textContent = "Police Phonebook";
    }

    const verifiedBadge = document.getElementById("verifiedBadge");
    if (verifiedBadge && isDeviceVerified) verifiedBadge.classList.remove("hidden");

    setNavState(false);

    const subToolbar = document.querySelector(".sub-toolbar") || document.getElementById("subToolbar") || document.getElementById("allSearchBtn");
    if (subToolbar) subToolbar.classList.remove("hidden");

    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("mainDashboardView")?.classList.remove("hidden");

    updateAdminUI();

    if (isAllSearchActive) {
        renderAllSearch();
    } else {
        renderCategories(document.getElementById("searchInput")?.value.trim().toLowerCase());
    }
}

function refreshCurrentView() {
    if (currentDataId) {
        showDataPage(currentDataId, false);
    } else if (currentCategoryId) {
        showCategoryView(currentCategoryId);
    } else if (isAllSearchActive) {
        renderAllSearch();
    } else if (isFavoriteActive) {
        renderFavoriteView(false);
    } else {
        showMainDashboardView(false);
    }
}

function renderCategoryDetails(searchVal = "") {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";
    const isAdmin = window.currentUserRole === "admin";
    const filterText = searchVal === "admin@jr" ? "" : searchVal;

    let subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);
    if (filterText) {
        subCategories = subCategories.filter(sub => isMatch(sub.name, filterText));
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

            const subPinBadge = (isAdmin && sub.pinned) ? '<span class="pinned-badge">Pinned</span>' : "";

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
    categoryData = sortContactData(categoryData);

    let noHeaderData = categoryData.filter(d => !d.headerId);
    if (filterText) {
        noHeaderData = noHeaderData.filter(d => isDataMatch(d, filterText));
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
        const isHeaderMatched = filterText && isMatch(header.title, filterText);

        let matchedData = headerAllData;
        if (filterText && !isHeaderMatched) {
            matchedData = headerAllData.filter(d => isDataMatch(d, filterText));
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

function openDataPage(dataId, pushHistory = true) {
    if (pushHistory) history.pushState({ page: "data", dataId: dataId }, "");
    showDataPage(dataId);
}

function showDataPage(dataId) {
    const item = database.data.find(d => d.id === dataId);
    if (!item) return;

    currentDataId = dataId;
    isFavoriteActive = false;
    document.getElementById("verifiedBadge")?.classList.add("hidden");
    setNavState(true);

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.remove("hidden");

    updateAdminUI();

    if (!navigator.onLine) {
        renderDataDetailsContent(item);
        return;
    }

    renderDataDetailsContent(item);

    const devId = getDeviceId();
    const approvedRef = ref(db, `webapp/approved_devices/${devId}`);

    get(approvedRef).then((snapshot) => {
        if (snapshot.exists() && snapshot.val().status === "approved") {
            isDeviceVerified = true;
        }

        renderDataDetailsContent(item);

    }).catch(() => {
        renderDataDetailsContent(item);
    });
}

function renderDataDetailsContent(item) {
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

    const isAuthorized = isDeviceVerified || isAdmin;
    const showAdminInfoBox = isAuthorized && adminInfo;
    const showPermanentAddressBox = isAuthorized && permanentAddress;
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
            <button id="btnEmailSend" class="action-btn-round btn-email-round">✉️ ইমেইল</button>
            <button id="btnShareContact" class="action-btn-round btn-share-round">🔗 শেয়ার কন্টাক্ট</button>
        </div>

        <div class="details-info-list">
            <div class="details-info-box"><div class="info-label">📱 মোবাইল</div><div class="info-value">${mobile}</div></div>
            <div class="details-info-box"><div class="info-label">☎️ টেলিফোন</div><div class="info-value">${phone}</div></div>
            <div class="details-info-box"><div class="info-label">💼 পদবী</div><div class="info-value">${designation}</div></div>
            <div class="details-info-box"><div class="info-label">✉️ ই-মেইল</div><div class="info-value">${email}</div></div>
            ${currentOffice ? `<div class="details-info-box"><div class="info-label">🏢 বর্তমান ঠিকানা</div><div class="info-value">${currentOffice}</div></div>` : ""}
            ${showPermanentAddressBox ? `<div class="details-info-box"><div class="info-label">🏠 স্থায়ী ঠিকানা</div><div class="info-value">${permanentAddress}</div></div>` : ""}
            ${showAdminInfoBox ? `<div class="details-info-box" style="border-left:4px solid #f59e0b;"><div class="info-label">📝 প্রশাসনিক তথ্য</div><div class="info-value">${adminInfo}</div></div>` : ""}
            ${showVerifyBtnInDetails ? `<div style="text-align: right; margin-top: 5px;"><button class="btn-get-verify" id="detailsVerifyBtn">Get VIP</button></div>` : ""}
        </div>
    `;

    setupSmartCallAndWhatsApp(document.getElementById("btnMobileCall"), item.mobile, "মোবাইল");
    setupSmartCallAndWhatsApp(document.getElementById("btnPhoneCall"), item.phone, "টেলিফোন");
    setupEmailAction(document.getElementById("btnEmailSend"), item.email);

    const detailsVerifyBtn = document.getElementById("detailsVerifyBtn");
    if (detailsVerifyBtn) setupHoldToVerify(detailsVerifyBtn);

    document.getElementById("btnShareContact")?.addEventListener("click", () => {
        const shareText = `👤 নাম: ${item.name || ""}\n📱 মোবাইল: ${item.mobile || ""}\n☎️ টেলিফোন: ${item.phone || ""}\n✉️ ইমেইল: ${item.email || ""}\n💼 পদবী: ${item.designation || ""}`;
        if (navigator.share) {
            navigator.share({ title: item.name, text: shareText }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareText);
            showToast("কন্টাক্ট কপি করা হয়েছে!");
        }
    });
}

function setupHoldToVerify(button) {
    let holdTimer = null;

    const startHold = (e) => {
        e.preventDefault();
        button.style.transform = "scale(0.95)";
        button.style.opacity = "0.8";

        holdTimer = setTimeout(() => {
            clearHold();
            if (navigator.vibrate) navigator.vibrate(60);
            openModal("verifyModal");
        }, 10000);
    };

    const clearHold = () => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
        button.style.transform = "scale(1)";
        button.style.opacity = "1";
    };

    button.addEventListener("mousedown", startHold);
    button.addEventListener("touchstart", startHold, { passive: false });
    button.addEventListener("mouseup", clearHold);
    button.addEventListener("mouseleave", clearHold);
    button.addEventListener("touchend", clearHold);
    button.addEventListener("touchcancel", clearHold);

    button.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("⚠️ 'Get VIP' বাটনটি কমপক্ষে ১০ সেকেন্ড চেপে ধরে রাখুন!");
    });
}

function setupSmartCallAndWhatsApp(element, rawNumber, typeName) {
    if (!element) return;

    if (!rawNumber || rawNumber === "মোবাইল নেই" || rawNumber === "টেলিফোন নেই" || rawNumber.toLowerCase().includes("নেই")) {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            showToast(`⚠️ কোনো ${typeName} নাম্বার নেই!`);
        });
        return;
    }

    let pressTimer = null;
    let isLongPress = false;

    const startPress = () => {
        isLongPress = false;
        pressTimer = setTimeout(() => {
            isLongPress = true;
            if (navigator.vibrate) navigator.vibrate(60);
            let cleanNumber = rawNumber.replace(/\D/g, '');
            if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) cleanNumber = '88' + cleanNumber;
            if (cleanNumber) {
                window.open(`https://wa.me/${cleanNumber}`, '_blank');
            } else {
                showToast(`⚠️ কোনো বৈধ ${typeName} নাম্বার নেই!`);
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
                setTimeout(() => callLink.remove(), 1000);
            } else {
                showToast(`⚠️ কোনো বৈধ ${typeName} নাম্বার নেই!`);
            }
        }
        isLongPress = false;
    });
}

function setupEmailAction(element, rawEmail) {
    if (!element) return;

    if (!rawEmail || rawEmail === "ইমেইল নেই" || rawEmail.toLowerCase().includes("নেই")) {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            showToast("⚠️ কোনো ইমেইল অ্যাড্রেস নেই!");
        });
        return;
    }

    element.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `mailto:${rawEmail}`;
    });
}

function openModal(id) {
    document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id)?.classList.add("hidden");
}

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

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ============================================================
   BILINGUAL / OFFLINE LANGUAGE + SEARCH SUPPORT - FINAL
   ------------------------------------------------------------
   • Language selection is stored locally and does NOT depend on
     Google Translate for the basic English/Bengali UI.
   • English search can match Bengali Firebase records offline.
   • Dynamic UI created later by render functions is translated too.
   • Firebase data is never changed by the language engine.
   • A page reload is used after changing language so switching
     English <-> Bengali works reliably even without internet.
   ============================================================ */

const APP_LANGUAGE_KEY = "selected_app_language";

const OFFLINE_TRANSLATIONS = {
    "Police Phonebook": "Police Phonebook",
    "নাম পাওয়া যায়নি": "Name not found",
    "মোবাইল নেই": "Mobile unavailable",
    "টেলিফোন নেই": "Telephone unavailable",
    "পদবী নেই": "Designation unavailable",
    "পদবি নেই": "Designation unavailable",
    "ইমেইল নেই": "Email unavailable",
    "মোবাইল": "Mobile",
    "টেলিফোন": "Telephone",
    "ফোন": "Phone",
    "পদবী": "Designation",
    "পদবি": "Designation",
    "ইমেইল": "Email",
    "ই-মেইল": "Email",
    "বর্তমান ঠিকানা": "Current Office",
    "বর্তমান অফিস": "Current Office",
    "বর্তমান কার্যালয়": "Current Office",
    "বর্তমান কার্যালয়": "Current Office",
    "স্থায়ী ঠিকানা": "Permanent Address",
    "স্থায়ী ঠিকানা": "Permanent Address",
    "প্রশাসনিক তথ্য": "Administrative Information",
    "অ্যাডমিন তথ্য": "Admin Information",
    "Header ছাড়া": "Without Header",
    "Header ছাড়া": "Without Header",
    "হেডার ছাড়া": "Without Header",
    "হেডার ছাড়া": "Without Header",
    "কোনো তথ্য পাওয়া যায়নি": "No information found",
    "কোনো তথ্য পাওয়া যায়নি": "No information found",
    "কোনো ফেভারিট নাম্বার নেই": "No favorite numbers",
    "হার্ট আইকনে ক্লিক করে ফেভারিটে যুক্ত করুন।": "Tap the heart icon to add a favorite.",
    "নতুন Category": "New Category",
    "নতুন Sub-Category": "New Sub-Category",
    "Category এডিট করুন": "Edit Category",
    "Data এডিট করুন": "Edit Data",
    "Data যোগ করুন": "Add Data",
    "Header সেভ করা হয়েছে": "Header saved",
    "Header সেভ করা হয়েছে": "Header saved",
    "ডাটা সেভ হয়েছে": "Data saved",
    "ডাটা সেভ হয়েছে": "Data saved",
    "ডাটা ডিলিট করা হয়েছে": "Data deleted",
    "ডাটা ডিলিট করা হয়েছে": "Data deleted",
    "ডাটা সফলভাবে মুভ করা হয়েছে!": "Data moved successfully!",
    "ডাটা সফলভাবে মুভ করা হয়েছে!": "Data moved successfully!",
    "পিন করা হয়েছে": "Pinned",
    "পিন করা হয়েছে": "Pinned",
    "আনপিন করা হয়েছে": "Unpinned",
    "আনপিন করা হয়েছে": "Unpinned",
    "হেডার পিন করা হয়েছে": "Header pinned",
    "হেডার পিন করা হয়েছে": "Header pinned",
    "হেডার আনপিন করা হয়েছে": "Header unpinned",
    "হেডার আনপিন করা হয়েছে": "Header unpinned",
    "সেভ করা হয়েছে": "Saved",
    "সেভ করা হয়েছে": "Saved",
    "ডিলিট করা হয়েছে": "Deleted",
    "ডিলিট করা হয়েছে": "Deleted",
    "Header ডিলিট করা হয়েছে": "Header deleted",
    "Header ডিলিট করা হয়েছে": "Header deleted",
    "পিন": "Pin",
    "আনপিন": "Unpin",
    "এডিট": "Edit",
    "ডিলিট": "Delete",
    "মুভ": "Move",
    "ফেভারিট": "Favorite",
    "ফেভারিটে যোগ করা হয়েছে": "Added to favorites",
    "ফেভারিটে যোগ করা হয়েছে": "Added to favorites",
    "ফেভারিট থেকে সরানো হয়েছে": "Removed from favorites",
    "ফেভারিট থেকে সরানো হয়েছে": "Removed from favorites",
    "নিশ্চিতকরণ": "Confirmation",
    "হ্যাঁ, মুছুন": "Yes, Delete",
    "বাতিল": "Cancel",
    "লোড হচ্ছে...": "Loading...",
    "কোনো নতুন ভেরিফিকেশন রিকোয়েস্ট নেই": "No new verification requests",
    "কোনো নতুন ভেরিফিকেশন রিকোয়েস্ট নেই": "No new verification requests",
    "ডাটা লোড করতে সমস্যা হয়েছে": "Could not load data",
    "ডাটা লোড করতে সমস্যা হয়েছে": "Could not load data",
    "অ্যাডমিন লগইন সফল হয়েছে!": "Admin login successful!",
    "অ্যাডমিন লগইন সফল হয়েছে!": "Admin login successful!",
    "লগআউট করা হয়েছে": "Logged out",
    "লগআউট করা হয়েছে": "Logged out",
    "লগইন করার জন্য ইন্টারনেট সংযোগ আবশ্যক!": "Internet connection is required for admin login!",
    "ইমেইল এবং পাসওয়ার্ড দিন": "Enter email and password",
    "ইমেইল এবং পাসওয়ার্ড দিন": "Enter email and password",
    "শুধুমাত্র Admin পরিবর্তন সেভ করতে পারবেন": "Only Admin can save changes",
    "অফলাইনে সেভ হয়েছে! ইন্টারনেট এলে ডাটাবেজে যুক্ত হবে।": "Saved offline. It will sync when internet is available.",
    "অফলাইনে সেভ হয়েছে! ইন্টারনেট এলে ডাটাবেজে যুক্ত হবে।": "Saved offline. It will sync when internet is available.",
    "ক্লাউডে সিঙ্ক করতে সমস্যা হয়েছে": "Cloud sync failed",
    "ক্লাউডে সিঙ্ক করতে সমস্যা হয়েছে": "Cloud sync failed",
    "ইন্টারনেট সংযোগ নেই!": "No internet connection!",
    "🟢 অনলাইন মোডে আছেন ": "🟢 You are online ",
    "স্লাইডিং নোটিশ সফলভাবে সেভ হয়েছে!": "Sliding notice saved successfully!",
    "স্লাইডিং নোটিশ সফলভাবে সেভ হয়েছে!": "Sliding notice saved successfully!",
    "নোটিফিকেশন প্যানেল ওপেন করা হয়েছে": "Notification panel opened",
    "নোটিফিকেশন প্যানেল ওপেন করা হয়েছে": "Notification panel opened",
    "শুধুমাত্র অ্যাডমিন নোটিশ প্রকাশ করতে পারবেন": "Only Admin can publish notices",
    "শিরোনাম এবং বিস্তারিত উভয়ই পূরণ করুন": "Please fill in both title and details",
    "শিরোনাম এবং বিস্তারিত উভয়ই পূরণ করুন": "Please fill in both title and details",
    "নাম প্রদান করুন": "Enter a name",
    "মোবাইল নাম্বার অবশ্যই ১১ ডিজিটের হতে হবে!": "Mobile number must contain 11 digits!",
    "মোবাইল, টেলিফোন অথবা ইমেইল এড্রেস ফাঁকা রাখা যাবে না!": "Mobile, telephone or email cannot all be empty",
    "ক্যাটাগরি সিলেক্ট করা নেই": "No category selected",
    "হেডার নাম লিখুন": "Enter header name",
    "Category Name লিখুন": "Enter Category Name",
    "আপনি কি নিশ্চিত এই Category মুছে ফেলতে চান?": "Are you sure you want to delete this Category?",
    "এই Header ডিলিট করতে চান? ডাটাগুলো সরানো হবে না।": "Delete this Header? The data will not be removed.",
    "আপনি কি এই Data মুছে ফেলতে চান?": "Are you sure you want to delete this Data?",
    "আপনি কি এই রিকোয়েস্টটি ডিলিট করতে চান?": "Do you want to delete this request?",
    "আপনি কি এই রিকোয়েস্টটি ডিলিট করতে চান?": "Do you want to delete this request?",
    "রিকোয়েস্ট ডিলিট করা হয়েছে": "Request deleted",
    "রিকোয়েস্ট ডিলিট করা হয়েছে": "Request deleted",
    "অ্যাপ্রুভ করতে ব্যর্থ হয়েছে": "Approval failed",
    "অ্যাপ্রুভ করতে ব্যর্থ হয়েছে": "Approval failed",
    "রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে": "Failed to send request",
    "রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে": "Failed to send request",
    "দয়া করে নাম এবং পদবী পূরণ করুন": "Please enter name and designation",
    "দয়া করে নাম এবং পদবী পূরণ করুন": "Please enter name and designation",
    "রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!": "Request sent successfully!",
    "রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!": "Request sent successfully!",
    "অ্যাডমিন অপশন অন করা হয়েছে": "Admin option enabled",
    "অ্যাডমিন অপশন অন করা হয়েছে": "Admin option enabled",
    "সার্চ": "Search",
    "ফোনবুক": "Phonebook",
    "নাইট মোড অন করা হয়েছে": "Night mode enabled",
    "নাইট মোড অন করা হয়েছে": "Night mode enabled",
    "ডে মোড অন করা হয়েছে": "Day mode enabled",
    "ডে মোড অন করা হয়েছে": "Day mode enabled",
    "শেয়ার কন্টাক্ট": "Share Contact",
    "শেয়ার কন্টাক্ট": "Share Contact",
    "Get VIP": "Get VIP",
    "ভেরিফাইড": "Verified",
    "অ্যাডমিন": "Admin",
    "নাম": "Name",
    "লগইন ব্যর্থ হয়েছে:": "Login failed:",
    "নোটিশ সেভ করতে ব্যর্থ হয়েছে": "Failed to save notice",
    "ডিভাইস সফলভাবে অ্যাপ্রুভ করা হয়েছে!": "Device approved successfully!",
    "ডিলিট করতে ব্যর্থ হয়েছে": "Failed to delete",
    "অনলাইন মোডে আছেন": "You are online",
    "কন্টাক্ট কপি করা হয়েছে!": "Contact copied!",
    "'Get VIP' বাটনটি কমপক্ষে ১০ সেকেন্ড চেপে ধরে রাখুন!": "Press and hold the 'Get VIP' button for at least 10 seconds!",
    "কোনো বৈধ মোবাইল নাম্বার নেই!": "No valid mobile number!",
    "কোনো বৈধ টেলিফোন নাম্বার নেই!": "No valid telephone number!",
    "কোনো মোবাইল নাম্বার নেই!": "No mobile number!",
    "কোনো টেলিফোন নাম্বার নেই!": "No telephone number!",
    "কোনো ইমেইল অ্যাড্রেস নেই!": "No email address!",
    "ডাটা আনপিন করা হয়েছে": "Data unpinned",
    "ডাটা পিন করা হয়েছে": "Data pinned",
    "পিন করুন": "Pin",
    "নাম্বার": "number"
};

/* English -> Bengali aliases used ONLY by the search engine. */
const OFFLINE_SEARCH_ALIASES = {
    "constable": ["কনস্টেবল"],
    "female constable": ["মহিলা কনস্টেবল", "ফিমেল কনস্টেবল"],
    "driver constable": ["ড্রাইভার কনস্টেবল"],
    "inspector": ["ইন্সপেক্টর", "ইন্সপেক্টর"],
    "assistant superintendent": ["সহকারী সুপারিনটেনডেন্ট", "সহকারী সুপারিনটেন্ডেন্ট"],
    "superintendent": ["সুপারিনটেনডেন্ট", "সুপারিনটেন্ডেন্ট"],
    "commandant": ["কমান্ড্যান্ট", "কমান্ডেন্ট"],
    "additional commandant": ["অতিরিক্ত কমান্ড্যান্ট"],
    "deputy commandant": ["ডেপুটি কমান্ড্যান্ট"],
    "assistant commandant": ["সহকারী কমান্ড্যান্ট"],
    "si": ["এসআই", "সাব-ইন্সপেক্টর", "উপ-পরিদর্শক"],
    "sub inspector": ["সাব-ইন্সপেক্টর", "এসআই", "উপ-পরিদর্শক"],
    "asi": ["এএসআই", "সহকারী উপ-পরিদর্শক"],
    "sergeant": ["সার্জেন্ট"],
    "driver": ["ড্রাইভার", "চালক"],
    "office": ["অফিস", "কার্যালয়", "কার্যালয়"],
    "current office": ["বর্তমান অফিস", "বর্তমান কার্যালয়", "বর্তমান কার্যালয়", "বর্তমান ঠিকানা"],
    "permanent address": ["স্থায়ী ঠিকানা", "স্থায়ী ঠিকানা"],
    "address": ["ঠিকানা", "ঠিকানা"],
    "mobile": ["মোবাইল", "মোবাইল নম্বর", "মোবাইল নাম্বার"],
    "phone": ["ফোন", "টেলিফোন"],
    "telephone": ["টেলিফোন", "ফোন"],
    "email": ["ইমেইল", "ই-মেইল"],
    "name": ["নাম"],
    "designation": ["পদবী", "পদবি"],
    "police": ["পুলিশ"],
    "phonebook": ["ফোনবুক", "ফোন বুক"],
    "favorite": ["ফেভারিট"],
    "header": ["হেডার"],
    "category": ["ক্যাটাগরি", "বিভাগ"],
    "sub category": ["সাব-ক্যাটাগরি", "সাব ক্যাটাগরি"],
    "admin": ["অ্যাডমিন", "এডমিন"],
    "verified": ["ভেরিফাইড", "অনুমোদিত"],
    "verification": ["ভেরিফিকেশন", "যাচাই"],
    "notice": ["নোটিশ", "বিজ্ঞপ্তি"],
    "notification": ["নোটিফিকেশন", "বিজ্ঞপ্তি"]
};

/* Common Bengali name/word aliases. This also makes Latin-name searches
   useful when the stored Firebase name is Bengali. */
const BENGALI_LATIN_ALIASES = {
    "জুয়েল": "jewel", "জুয়েল": "jewel", "রানা": "rana",
    "রহমান": "rahman", "হোসেন": "hossain", "হোসাইন": "hossain",
    "আহমেদ": "ahmed", "আলী": "ali", "আলম": "alam", "ইসলাম": "islam",
    "খান": "khan", "মিয়া": "mia", "মিয়া": "mia", "চৌধুরী": "chowdhury",
    "সাহা": "saha", "দাস": "das", "সরকার": "sarkar"
};

function getCurrentLanguage() {
    return localStorage.getItem(APP_LANGUAGE_KEY) === "en" ? "en" : "bn";
}

function setLanguageCookie(lang) {
    const value = `/bn/${lang}`;
    document.cookie = `googtrans=${value};path=/;max-age=31536000`;
    try {
        document.cookie = `googtrans=${value};domain=${document.domain};path=/;max-age=31536000`;
    } catch (_) {}
}

function setLanguage(lang) {
    lang = lang === "en" ? "en" : "bn";
    localStorage.setItem(APP_LANGUAGE_KEY, lang);
    setLanguageCookie(lang);

    /* IMPORTANT: reload in BOTH online and offline modes.
       This prevents translated English text from being mixed with
       newly-rendered Bengali text and makes BN <-> EN reversible. */
    try {
        document.documentElement.lang = lang === "en" ? "en" : "bn";
    } catch (_) {}

    location.reload();
}

function replaceKnownTranslations(text) {
    let result = String(text ?? "");
    const keys = Object.keys(OFFLINE_TRANSLATIONS)
        .filter(k => k && k !== OFFLINE_TRANSLATIONS[k])
        .sort((a, b) => b.length - a.length);

    for (const key of keys) {
        result = result.split(key).join(OFFLINE_TRANSLATIONS[key]);
    }
    return result;
}

function applyOfflineLanguage(root = document.body) {
    if (!root || getCurrentLanguage() !== "en") return;

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(parent.tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(textNode => {
        const oldText = textNode.nodeValue;
        const newText = replaceKnownTranslations(oldText);
        if (newText !== oldText) textNode.nodeValue = newText;
    });

    root.querySelectorAll?.("[placeholder], [title], [aria-label]").forEach(el => {
        ["placeholder", "title", "aria-label"].forEach(attr => {
            if (!el.hasAttribute(attr)) return;
            const oldValue = el.getAttribute(attr);
            const newValue = replaceKnownTranslations(oldValue);
            if (newValue !== oldValue) el.setAttribute(attr, newValue);
        });
    });
}

function getSearchVariants(query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];

    const variants = new Set([q]);
    const compact = q.replace(/[\s_-]+/g, " ").trim();
    variants.add(compact);

    Object.entries(OFFLINE_SEARCH_ALIASES).forEach(([english, bengaliList]) => {
        if (english === q || english.includes(q) || q.includes(english)) {
            bengaliList.forEach(v => variants.add(String(v).toLowerCase()));
        }
        bengaliList.forEach(v => {
            if (String(v).toLowerCase() === q) variants.add(english);
        });
    });

    /* For multi-word English queries, also add aliases for each token. */
    q.split(/\s+/).filter(Boolean).forEach(token => {
        if (OFFLINE_SEARCH_ALIASES[token]) {
            OFFLINE_SEARCH_ALIASES[token].forEach(v => variants.add(String(v).toLowerCase()));
        }
    });

    return [...variants];
}

function bengaliToSearchLatin(text) {
    let result = String(text || "").toLowerCase();
    Object.entries(BENGALI_LATIN_ALIASES)
        .sort((a, b) => b[0].length - a[0].length)
        .forEach(([bn, en]) => {
            result = result.split(bn).join(en);
        });
    return result;
}

function isMatch(sourceText, query) {
    if (sourceText === null || sourceText === undefined || query === null || query === undefined) {
        return false;
    }

    const source = String(sourceText).trim();
    const q = String(query).trim().toLowerCase();
    if (!source || !q) return false;

    const sourceLower = source.toLowerCase();
    const sourceLatin = bengaliToSearchLatin(sourceLower);
    const variants = getSearchVariants(q);

    /* Direct phrase match first. */
    if (variants.some(v => v && (sourceLower.includes(v) || sourceLatin.includes(v)))) {
        return true;
    }

    /* Multi-word search: every meaningful word must be found.
       This fixes searches such as "jewel rana" against Bengali data. */
    const words = q.split(/\s+/).filter(w => w.length > 1);
    if (words.length > 1) {
        return words.every(word => {
            const wordVariants = getSearchVariants(word);
            return wordVariants.some(v => sourceLower.includes(v) || sourceLatin.includes(v));
        });
    }

    return false;
}

function getDataSearchText(item) {
    if (!item) return "";
    const category = (database.categories || []).find(c => c.id === item.categoryId);
    const header = (database.headers || []).find(h => h.id === item.headerId);

    return [
        item.name, item.mobile, item.phone, item.designation, item.email,
        item.currentOffice, item.permanentAddress, item.adminInfo,
        item.enName, item.enDesignation, item.enCurrentOffice,
        item.enPermanentAddress, category?.name, header?.title
    ].filter(v => v !== null && v !== undefined && String(v).trim() !== "").join(" ");
}

function isDataMatch(item, query) {
    if (!query) return true;
    return isMatch(getDataSearchText(item), query);
}

function initOfflineLanguageSystem() {
    const savedLang = getCurrentLanguage();

    try {
        document.documentElement.lang = savedLang === "en" ? "en" : "bn";
    } catch (_) {}

    const radioEn = document.getElementById("langEn");
    const radioBn = document.getElementById("langBn");
    if (radioEn) radioEn.checked = savedLang === "en";
    if (radioBn) radioBn.checked = savedLang !== "en";

    document.querySelectorAll('input[name="appLanguage"]').forEach(input => {
        /* Avoid duplicate listeners if this function is ever called again. */
        if (input.dataset.offlineLangBound === "1") return;
        input.dataset.offlineLangBound = "1";
        input.addEventListener("change", () => setLanguage(input.value));
    });

    if (savedLang === "en") {
        applyOfflineLanguage(document.body);

        if (!window.__offlineLanguageObserver) {
            let timer = null;
            window.__offlineLanguageObserver = new MutationObserver(() => {
                if (getCurrentLanguage() !== "en") return;
                clearTimeout(timer);
                timer = setTimeout(() => applyOfflineLanguage(document.body), 0);
            });

            window.__offlineLanguageObserver.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }
}

