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
   Device ID & On-Demand Fingerprinting (Fixed)
========================================= */
function getDeviceId() {
    let devId = "DEV_1787965365869_r30ezyi";
    localStorage.setItem("police_pb_device_id", devId);
    return devId;
}

function checkDeviceVerificationStatus() {
    const devId = getDeviceId();
    const approvedRef = ref(db, `webapp/approved_devices/${devId}`);

    onValue(approvedRef, (snapshot) => {
        if (snapshot.exists() && snapshot.val().status === "approved") {
            isDeviceVerified = true;

            if (!currentCategoryId && !currentDataId && !isAllSearchActive) {
                document
                    .getElementById("verifiedBadge")
                    ?.classList.remove("hidden");
            }
        } else {
            isDeviceVerified = false;

            document
                .getElementById("verifiedBadge")
                ?.classList.add("hidden");
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

window.addEventListener("online", () => {
    showToast("🟢 অনলাইন মোডে আছেন ");
    loadDatabase();
});

window.addEventListener("offline", checkOnlineStatus);

/* =========================================
   Authentication
========================================= */
watchAuth((user, role) => {

    const adminBtn =
        document.getElementById("adminLoginBtn");

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

    const isAdmin =
        window.currentUserRole === "admin";

    const topbar =
        document.querySelector(".topbar");

    if (topbar) {

        if (isAdmin) {
            topbar.classList.add("admin-header");
            topbar.classList.remove("user-header");
        } else {
            topbar.classList.add("user-header");
            topbar.classList.remove("admin-header");
        }
    }

    document
        .querySelectorAll(".admin-only")
        .forEach(el => {

            if (isAdmin) {
                el.classList.remove("hidden");
            } else {
                el.classList.add("hidden");
            }
        });

    const loginForm =
        document.getElementById("loginFormContainer");

    const logoutContainer =
        document.getElementById("logoutContainer");

    if (loginForm) {
        loginForm.style.display =
            isAdmin ? "none" : "block";
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

    history.replaceState(
        { page: "home" },
        ""
    );

    window.addEventListener(
        "popstate",
        handlePopState
    );
});

/* =========================================
   Search Toggle & Navigation Icons
========================================= */
function setNavState(searchOrSubPageActive) {

    isSearchMode =
        searchOrSubPageActive;

    const menuIcon =
        document.getElementById("menuIcon");

    const backIcon =
        document.getElementById("backIcon");

    if (searchOrSubPageActive) {

        menuIcon?.classList.add("hidden");
        backIcon?.classList.remove("hidden");

    } else {

        menuIcon?.classList.remove("hidden");
        backIcon?.classList.add("hidden");
    }
}

function openHeaderSearch() {

    const searchBox =
        document.getElementById("searchBox");

    const appTitle =
        document.getElementById("appTitle");

    const searchBtn =
        document.getElementById("searchBtn");

    if (searchBox && appTitle) {

        searchBox.classList.remove("hidden");

        appTitle.classList.add("hidden");

        if (searchBtn) {
            searchBtn.classList.add("hidden");
        }

        setNavState(true);

        document
            .getElementById("searchInput")
            ?.focus();
    }
}

function closeHeaderSearch() {

    const searchBox =
        document.getElementById("searchBox");

    const appTitle =
        document.getElementById("appTitle");

    const searchBtn =
        document.getElementById("searchBtn");

    const searchInput =
        document.getElementById("searchInput");

    if (searchBox) {
        searchBox.classList.add("hidden");
    }

    if (appTitle) {
        appTitle.classList.remove("hidden");
    }

    if (searchBtn) {
        searchBtn.classList.remove("hidden");
    }

    if (searchInput) {
        searchInput.value = "";
    }

    setNavState(false);

    isSearchMode = false;

    refreshCurrentView();
}

function closeAllSearchUI() {

    const searchBox =
        document.getElementById("searchBox");

    const appTitle =
        document.getElementById("appTitle");

    const searchBtn =
        document.getElementById("searchBtn");

    const searchInput =
        document.getElementById("searchInput");

    if (searchBox) {
        searchBox.classList.add("hidden");
    }

    if (appTitle) {
        appTitle.classList.remove("hidden");
    }

    if (searchBtn) {
        searchBtn.classList.remove("hidden");
    }

    if (searchInput) {
        searchInput.value = "";
    }

    isSearchMode = false;
    isAllSearchActive = false;

    setNavState(false);
}

/* =========================================
   Search
========================================= */
function handleSearch(e) {

    const value =
        String(e.target.value || "").trim();

    if (!value) {

        if (isAllSearchActive) {
            activateAllSearchUI();
        } else {
            refreshCurrentView();
        }

        return;
    }

    const searchTerm =
        value.toLowerCase();

    let results = [];

    database.categories.forEach(category => {

        if (
            String(category.name || "")
                .toLowerCase()
                .includes(searchTerm)
        ) {
            results.push({
                type: "category",
                item: category
            });
        }
    });

    database.headers.forEach(header => {

        if (
            String(header.title || "")
                .toLowerCase()
                .includes(searchTerm)
        ) {
            results.push({
                type: "header",
                item: header
            });
        }
    });

    database.data.forEach(item => {

        const text =
            Object.values(item || {})
                .join(" ")
                .toLowerCase();

        if (text.includes(searchTerm)) {
            results.push({
                type: "data",
                item: item
            });
        }
    });

    renderSearchResults(results);
}

/* =========================================
   Search Results
========================================= */
function renderSearchResults(results) {

    const container =
        document.getElementById("searchResults");

    if (!container) return;

    container.innerHTML = "";

    if (!results.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div>কোনো তথ্য পাওয়া যায়নি</div>
            </div>
        `;

        return;
    }

    results.forEach(result => {

        const div =
            document.createElement("div");

        div.className =
            "search-result-item";

        if (result.type === "category") {

            div.innerHTML = `
                <div class="search-result-title">
                    📁 ${escapeHTML(result.item.name)}
                </div>
            `;

            div.addEventListener(
                "click",
                () => {
                    showCategoryView(
                        result.item.id,
                        true
                    );
                }
            );

        } else if (result.type === "header") {

            div.innerHTML = `
                <div class="search-result-title">
                    📌 ${escapeHTML(result.item.title)}
                </div>
            `;

        } else {

            div.innerHTML = `
                <div class="search-result-title">
                    📄 ${escapeHTML(
                        result.item.name ||
                        result.item.title ||
                        "তথ্য"
                    )}
                </div>
            `;
        }

        container.appendChild(div);
    });
}

/* =========================================
   All Search
========================================= */
function activateAllSearchUI() {

    isAllSearchActive = true;
    isSearchMode = true;

    setNavState(true);

    const searchBox =
        document.getElementById("searchBox");

    const appTitle =
        document.getElementById("appTitle");

    if (searchBox) {
        searchBox.classList.remove("hidden");
    }

    if (appTitle) {
        appTitle.classList.add("hidden");
    }

    const searchBtn =
        document.getElementById("searchBtn");

    if (searchBtn) {
        searchBtn.classList.add("hidden");
    }

    const searchInput =
        document.getElementById("searchInput");

    if (searchInput) {
        searchInput.focus();
    }

    renderAllSearchResults("");
}

function renderAllSearchResults(searchTerm) {

    const container =
        document.getElementById("searchResults");

    if (!container) return;

    const term =
        String(searchTerm || "")
            .trim()
            .toLowerCase();

    let results = [];

    database.categories.forEach(category => {

        if (
            !term ||
            String(category.name || "")
                .toLowerCase()
                .includes(term)
        ) {
            results.push({
                type: "category",
                item: category
            });
        }
    });

    database.headers.forEach(header => {

        if (
            !term ||
            String(header.title || "")
                .toLowerCase()
                .includes(term)
        ) {
            results.push({
                type: "header",
                item: header
            });
        }
    });

    database.data.forEach(item => {

        const text =
            Object.values(item || {})
                .join(" ")
                .toLowerCase();

        if (!term || text.includes(term)) {

            results.push({
                type: "data",
                item: item
            });
        }
    });

    renderSearchResults(results);
}

/* =========================================
   History / Navigation
========================================= */
function handlePopState(event) {

    const state =
        event.state || { page: "home" };

    if (state.page === "home") {

        currentCategoryId = null;
        currentDataId = null;
        isAllSearchActive = false;

        closeAllSearchUI();

        showMainDashboardView(false);

    } else if (state.page === "allSearch") {

        if (!isAllSearchActive) {
            activateAllSearchUI();
        }

    } else if (state.page === "category") {

        closeAllSearchUI();

        showCategoryView(
            state.categoryId,
            false
        );

    } else if (state.page === "data") {

        closeAllSearchUI();

        showDataPage(
            state.dataId,
            false
        );
    }
}

/* =========================================
   Theme
========================================= */
function initTheme() {

    if (
        localStorage.getItem("theme") === "dark"
    ) {
        document.body.classList.add(
            "dark-mode"
        );
    }
}

function toggleTheme() {

    document.body.classList.toggle(
        "dark-mode"
    );

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
    );

    showToast(
        isDark
            ? "নাইট মোড অন করা হয়েছে"
            : "ডে মোড অন করা হয়েছে"
    );
}

/* =========================================
   Database Load & Cache
========================================= */
function loadLocalCache() {

    const cached =
        localStorage.getItem(
            "police_phonebook_data"
        );

    if (cached) {

        try {

            database =
                JSON.parse(cached);

            if (!database.categories) {
                database.categories = [];
            }

            if (!database.headers) {
                database.headers = [];
            }

            if (!database.data) {
                database.data = [];
            }

            refreshCurrentView();

        } catch (e) {

            console.error(
                "Local Cache Error:",
                e
            );
        }
    }
}

async function loadDatabase() {

    loadLocalCache();

    if (!navigator.onLine) return;

    try {

        const snapshot =
            await get(
                ref(db, "webapp/public_data")
            );

        if (snapshot.exists()) {

            database =
                snapshot.val();

            if (!database.categories) {
                database.categories = [];
            }

            if (!database.headers) {
                database.headers = [];
            }

            if (!database.data) {
                database.data = [];
            }

            localStorage.setItem(
                "police_phonebook_data",
                JSON.stringify(database)
            );

            refreshCurrentView();
        }

    } catch (error) {

        console.error(
            "Database load error:",
            error
        );
    }
}

/* =========================================
   Firebase Database Save
========================================= */
async function saveDatabase() {

    if (
        window.currentUserRole !== "admin"
    ) {

        showToast(
            "শুধুমাত্র Admin পরিবর্তন সেভ করতে পারবেন"
        );

        return;
    }

    localStorage.setItem(
        "police_phonebook_data",
        JSON.stringify(database)
    );

    if (!navigator.onLine) {

        showToast(
            "💾 অফলাইন: ডাটা লোকালভাবে সেভ হয়েছে"
        );

        return;
    }

    try {

        await set(
            ref(db, "webapp/public_data"),
            database
        );

        showToast(
            "✅ ডাটাবেসে সফলভাবে সেভ হয়েছে"
        );

    } catch (error) {

        console.error(
            "Database save error:",
            error
        );

        showToast(
            "❌ ডাটাবেসে সেভ করা যায়নি"
        );
    }
}

/* =========================================
   Toast
========================================= */
function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3000);
}

/* =========================================
   Modal
========================================= */
function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.remove("hidden");
}

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.add("hidden");
}

/* =========================================
   Main Dashboard
========================================= */
function showMainDashboardView(pushHistory = true) {

    currentCategoryId = null;
    currentDataId = null;

    isAllSearchActive = false;

    closeAllSearchUI();

    if (pushHistory) {

        history.pushState(
            { page: "home" },
            ""
        );
    }

    refreshCurrentView();
}

/* =========================================
   Refresh Current View
========================================= */
function refreshCurrentView() {

    if (isAllSearchActive) {

        const input =
            document.getElementById(
                "searchInput"
            );

        renderAllSearchResults(
            input?.value || ""
        );

        return;
    }

    if (currentDataId) {

        showDataPage(
            currentDataId,
            false
        );

        return;
    }

    if (currentCategoryId) {

        showCategoryView(
            currentCategoryId,
            false
        );

        return;
    }

    renderMainDashboard();
}

/* =========================================
   Main Dashboard Render
========================================= */
function renderMainDashboard() {

    const container =
        document.getElementById(
            "mainContent"
        );

    if (!container) return;

    container.innerHTML = "";

    const categories =
        Array.isArray(database.categories)
            ? database.categories
            : [];

    if (!categories.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <div>কোনো ক্যাটাগরি নেই</div>
            </div>
        `;

        return;
    }

    categories.forEach(category => {

        const card =
            document.createElement("div");

        card.className =
            "category-card";

        const image =
            category.image ||
            DEFAULT_CATEGORY_IMAGE;

        card.innerHTML = `
            <img
                src="${escapeHTML(image)}"
                alt=""
                class="category-image"
            >

            <div class="category-name">
                ${escapeHTML(category.name)}
            </div>
        `;

        card.addEventListener(
            "click",
            () => {
                showCategoryView(
                    category.id,
                    true
                );
            }
        );

        container.appendChild(card);
    });
}

/* =========================================
   Category View
========================================= */
function showCategoryView(
    categoryId,
    pushHistory = true
) {

    currentCategoryId = categoryId;
    currentDataId = null;
    isAllSearchActive = false;

    closeAllSearchUI();

    if (pushHistory) {

        history.pushState(
            {
                page: "category",
                categoryId: categoryId
            },
            ""
        );
    }

    refreshCurrentView();
}

/* =========================================
   Data Page
========================================= */
function showDataPage(
    dataId,
    pushHistory = true
) {

    currentDataId = dataId;

    if (pushHistory) {

        history.pushState(
            {
                page: "data",
                dataId: dataId
            },
            ""
        );
    }

    renderDataPage(dataId);
}

/* =========================================
   Data Page Render
========================================= */
function renderDataPage(dataId) {

    const container =
        document.getElementById(
            "mainContent"
        );

    if (!container) return;

    const item =
        database.data.find(
            d => String(d.id) === String(dataId)
        );

    if (!item) {

        container.innerHTML = `
            <div class="empty-state">
                <div>তথ্য পাওয়া যায়নি</div>
            </div>
        `;

        return;
    }

    let html = `
        <div class="data-details">
    `;

    Object.entries(item).forEach(
        ([key, value]) => {

            if (
                key === "id" ||
                key === "categoryId"
            ) {
                return;
            }

            html += `
                <div class="data-row">
                    <div class="data-key">
                        ${escapeHTML(key)}
                    </div>

                    <div class="data-value">
                        ${escapeHTML(value)}
                    </div>
                </div>
            `;
        }
    );

    html += `
        </div>
    `;

    container.innerHTML = html;
}

/* =========================================
   Setup Events
========================================= */
function setupEvents() {

    document
        .getElementById("themeBtn")
        ?.addEventListener(
            "click",
            toggleTheme
        );

    document
        .getElementById("navToggleBtn")
        ?.addEventListener(
            "click",
            () => {

                const searchBox =
                    document.getElementById(
                        "searchBox"
                    );

                const isSearchOpen =
                    searchBox &&
                    !searchBox.classList.contains(
                        "hidden"
                    );

                if (isSearchOpen) {

                    closeHeaderSearch();

                } else if (
                    currentCategoryId ||
                    currentDataId ||
                    isAllSearchActive
                ) {

                    history.back();

                } else {

                    showToast(
                        "মেনু ওপেন করা হয়েছে"
                    );
                }
            }
        );

    document
        .getElementById("searchBtn")
        ?.addEventListener(
            "click",
            openHeaderSearch
        );

    document
        .getElementById("searchInput")
        ?.addEventListener(
            "input",
            handleSearch
        );

    document
        .getElementById("allSearchBtn")
        ?.addEventListener(
            "click",
            () => {

                history.pushState(
                    {
                        page: "allSearch"
                    },
                    ""
                );

                activateAllSearchUI();
            }
        );

    document
        .getElementById("adminLoginBtn")
        ?.addEventListener(
            "click",
            () => openModal("loginModal")
        );

    setupAdminButtonLongPress();

    document
        .getElementById("submitLoginBtn")
        ?.addEventListener(
            "click",
            async () => {

                if (!navigator.onLine) {

                    return showToast(
                        "লগইন করার জন্য ইন্টারনেট সংযোগ আবশ্যক!"
                    );
                }

                const email =
                    document
                        .getElementById(
                            "loginEmail"
                        )
                        ?.value
                        .trim();

                const password =
                    document
                        .getElementById(
                            "loginPassword"
                        )
                        ?.value
                        .trim();

                if (!email || !password) {

                    return showToast(
                        "ইমেইল এবং পাসওয়ার্ড দিন"
                    );
                }

                const res =
                    await loginAdmin(
                        email,
                        password
                    );

                if (res.success) {

                    showToast(
                        "অ্যাডমিন লগইন সফল হয়েছে!"
                    );

                    closeModal(
                        "loginModal"
                    );

                } else {

                    showToast(
                        "লগইন ব্যর্থ হয়েছে: " +
                        res.error
                    );
                }
            }
        );

    /* =========================================
       FIXED ADMIN LOGOUT
    ========================================= */

    document
        .getElementById("logoutBtn")
        ?.addEventListener(
            "click",
            async (e) => {

                e.preventDefault();
                e.stopPropagation();

                const logoutBtn =
                    document.getElementById(
                        "logoutBtn"
                    );

                if (logoutBtn) {

                    logoutBtn.disabled = true;

                    logoutBtn.textContent =
                        "লগআউট হচ্ছে...";
                }

                try {

                    const result =
                        await logoutAdmin();

                    if (
                        !result ||
                        !result.success
                    ) {

                        showToast(
                            "❌ লগআউট ব্যর্থ হয়েছে" +
                            (
                                result?.error
                                    ? ": " +
                                      result.error
                                    : ""
                            )
                        );

                        return;
                    }

                    /* =========================
                       RESET ADMIN STATE
                    ========================= */

                    window.currentUser = null;
                    window.currentUserRole =
                        "guest";

                    /* =========================
                       RESET NAVIGATION
                    ========================= */

                    currentCategoryId = null;
                    currentDataId = null;
                    isAllSearchActive = false;
                    isSearchMode = false;

                    /* =========================
                       RESET SEARCH
                    ========================= */

                    const searchInput =
                        document.getElementById(
                            "searchInput"
                        );

                    if (searchInput) {
                        searchInput.value = "";
                    }

                    closeAllSearchUI();

                    /* =========================
                       CLOSE MODALS
                    ========================= */

                    closeModal(
                        "loginModal"
                    );

                    closeModal(
                        "adminVerifyRequestsModal"
                    );

                    closeModal(
                        "categoryModal"
                    );

                    closeModal(
                        "headerModal"
                    );

                    closeModal(
                        "dataModal"
                    );

                    closeModal(
                        "moveDataModal"
                    );

                    closeModal(
                        "customConfirmModal"
                    );

                    /* =========================
                       UPDATE ADMIN UI
                    ========================= */

                    updateAdminUI();

                    /* =========================
                       RETURN HOME
                    ========================= */

                    showMainDashboardView(
                        false
                    );

                    if (logoutBtn) {
                        logoutBtn.textContent =
                            "লগআউট";
                    }

                    showToast(
                        "✅ অ্যাডমিন সফলভাবে লগআউট হয়েছে"
                    );

                } catch (error) {

                    console.error(
                        "Admin Logout Error:",
                        error
                    );

                    showToast(
                        "❌ লগআউট করতে সমস্যা হয়েছে"
                    );

                } finally {

                    if (logoutBtn) {
                        logoutBtn.disabled = false;
                    }
                }
            }
        );

    document
        .getElementById("submitVerifyBtn")
        ?.addEventListener(
            "click",
            submitVerificationRequest
        );

    document
        .getElementById("addCategoryBtn")
        ?.addEventListener(
            "click",
            () => openCategoryModal(false)
        );

    document
        .getElementById("emptyAddBtn")
        ?.addEventListener(
            "click",
            () => openCategoryModal(false)
        );

    document
        .getElementById("addSubCategoryBtn")
        ?.addEventListener(
            "click",
            () => openCategoryModal(true)
        );

    document
        .getElementById("saveCategoryBtn")
        ?.addEventListener(
            "click",
            saveCategory
        );

    document
        .getElementById("saveHeaderBtn")
        ?.addEventListener(
            "click",
            saveHeader
        );

    document
        .getElementById("saveDataBtn")
        ?.addEventListener(
            "click",
            saveData
        );

    document
        .getElementById("confirmMoveBtn")
        ?.addEventListener(
            "click",
            confirmMoveData
        );

    document
        .getElementById("addHeaderBtn")
        ?.addEventListener(
            "click",
            () => openHeaderModal()
        );

    document
        .getElementById("addDataBtn")
        ?.addEventListener(
            "click",
            () => openDataModal()
        );

    document
        .querySelectorAll("[data-close]")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () => closeModal(
                    btn.dataset.close
                )
            );
        });
}

/* =========================================
   Admin Button Long Press for Verification Requests
========================================= */
function setupAdminButtonLongPress() {

    const adminLoginBtn =
        document.getElementById(
            "adminLoginBtn"
        );

    if (!adminLoginBtn) return;

    let adminHoldTimer = null;

    const startAdminHold = (e) => {

        if (
            window.currentUserRole !==
            "admin"
        ) {
            return;
        }

        e.preventDefault();

        adminHoldTimer =
            setTimeout(() => {

                openModal(
                    "adminVerifyRequestsModal"
                );

                loadVerificationRequests();

            }, 800);
    };

    const cancelAdminHold = () => {

        if (adminHoldTimer) {

            clearTimeout(
                adminHoldTimer
            );

            adminHoldTimer = null;
        }
    };

    adminLoginBtn.addEventListener(
        "mousedown",
        startAdminHold
    );

    adminLoginBtn.addEventListener(
        "mouseup",
        cancelAdminHold
    );

    adminLoginBtn.addEventListener(
        "mouseleave",
        cancelAdminHold
    );

    adminLoginBtn.addEventListener(
        "touchstart",
        startAdminHold,
        { passive: false }
    );

    adminLoginBtn.addEventListener(
        "touchend",
        cancelAdminHold
    );

    adminLoginBtn.addEventListener(
        "touchcancel",
        cancelAdminHold
    );
}
    dataEl.className = "data-card-item";

    const name = escapeHTML(item.name || "নাম পাওয়া যায়নি");
    const mobile = escapeHTML(item.mobile || "মোবাইল নেই");
    const phone = escapeHTML(item.phone || "টেলিফোন নেই");
    const designation = escapeHTML(item.designation || "পদবী নেই");
    const photo = item.photo ? escapeHTML(item.photo) : null;

    const avatarHtml = photo
        ? `<img src="${photo}" alt="${name}" class="data-card-avatar" onerror="this.outerHTML='<div class=\'data-card-avatar\'>👤</div>'">`
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

    if (item) {
        openDataModal(item);
    }
}


async function deleteData(id) {
    const isConfirmed = await customConfirm(
        "আপনি কি এই Data মুছে ফেলতে চান?"
    );

    if (!isConfirmed) return;

    database.data =
        database.data.filter(d => d.id !== id);

    await saveDatabase();
    refreshCurrentView();

    showToast("ডাটা ডিলিট করা হয়েছে");
}


async function togglePinData(id) {

    const item =
        database.data.find(d => d.id === id);

    if (item) {

        item.pinned = !item.pinned;
        item.pinnedAt =
            item.pinned ? Date.now() : 0;

        await saveDatabase();
        refreshCurrentView();

        showToast(
            item.pinned
                ? "ডাটা পিন করা হয়েছে"
                : "ডাটা আনপিন করা হয়েছে"
        );
    }
}


/* =========================================
   Move Data
========================================= */
function openMoveDataModal(id) {

    movingDataId = id;

    const catSelect =
        document.getElementById(
            "moveCategorySelect"
        );

    if (catSelect) {

        catSelect.innerHTML = "";

        database.categories.forEach(c => {

            catSelect.innerHTML += `
                <option value="${c.id}">
                    ${escapeHTML(c.name)}
                </option>
            `;
        });

        catSelect.value =
            currentCategoryId;
    }

    updateMoveHeaderOptions();

    catSelect?.addEventListener(
        "change",
        updateMoveHeaderOptions
    );

    openModal("moveDataModal");
}


function updateMoveHeaderOptions() {

    const catId =
        document.getElementById(
            "moveCategorySelect"
        )?.value;

    const headSelect =
        document.getElementById(
            "moveHeaderSelect"
        );

    if (headSelect) {

        headSelect.innerHTML =
            `<option value="">Header ছাড়া</option>`;

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

    const catId =
        document.getElementById(
            "moveCategorySelect"
        )?.value;

    const headId =
        document.getElementById(
            "moveHeaderSelect"
        )?.value || null;

    const item =
        database.data.find(
            d => d.id === movingDataId
        );

    if (item && catId) {

        item.categoryId = catId;
        item.headerId = headId;

        await saveDatabase();

        closeModal("moveDataModal");

        refreshCurrentView();

        showToast(
            "ডাটা সফলভাবে মুভ করা হয়েছে!"
        );
    }
}


/* =========================================
   Navigation
========================================= */
function openCategory(id, pushHistory = true) {

    if (pushHistory) {

        history.pushState(
            {
                page: "category",
                categoryId: id
            },
            ""
        );
    }

    showCategoryView(id);
}


function showCategoryView(id) {

    const category =
        database.categories.find(
            item => item.id === id
        );

    if (!category) return;

    currentCategoryId = id;
    currentDataId = null;

    const appTitle =
        document.getElementById("appTitle");

    if (appTitle) {

        const titleText =
            appTitle.querySelector(
                ".app-title-text"
            ) || appTitle;

        titleText.textContent =
            category.name;
    }

    const verifiedBadge =
        document.getElementById(
            "verifiedBadge"
        );

    if (verifiedBadge) {
        verifiedBadge.classList.add(
            "hidden"
        );
    }

    setNavState(true);

    const subToolbar =
        document.querySelector(
            ".sub-toolbar"
        ) ||
        document.getElementById(
            "subToolbar"
        ) ||
        document.getElementById(
            "allSearchBtn"
        );

    if (subToolbar) {
        subToolbar.classList.add(
            "hidden"
        );
    }

    document
        .getElementById(
            "mainDashboardView"
        )
        ?.classList.add("hidden");

    document
        .getElementById(
            "dataDetailsView"
        )
        ?.classList.add("hidden");

    document
        .getElementById(
            "categoryDetailsView"
        )
        ?.classList.remove("hidden");

    const detailsTitle =
        document.getElementById(
            "detailsTitle"
        );

    if (detailsTitle) {
        detailsTitle.style.display =
            "none";
    }

    renderCategoryDetails(
        document
            .getElementById(
                "searchInput"
            )
            ?.value
            .trim()
            .toLowerCase()
    );
}


function showMainDashboardView(
    updateHistory = true
) {

    currentCategoryId = null;
    currentDataId = null;

    const appTitle =
        document.getElementById(
            "appTitle"
        );

    if (appTitle) {

        const titleText =
            appTitle.querySelector(
                ".app-title-text"
            ) || appTitle;

        titleText.textContent =
            "Police Phonebook";
    }

    const verifiedBadge =
        document.getElementById(
            "verifiedBadge"
        );

    if (
        verifiedBadge &&
        isDeviceVerified
    ) {
        verifiedBadge.classList.remove(
            "hidden"
        );
    }

    setNavState(false);

    const subToolbar =
        document.querySelector(
            ".sub-toolbar"
        ) ||
        document.getElementById(
            "subToolbar"
        ) ||
        document.getElementById(
            "allSearchBtn"
        );

    if (subToolbar) {
        subToolbar.classList.remove(
            "hidden"
        );
    }

    document
        .getElementById(
            "categoryDetailsView"
        )
        ?.classList.add("hidden");

    document
        .getElementById(
            "dataDetailsView"
        )
        ?.classList.add("hidden");

    document
        .getElementById(
            "mainDashboardView"
        )
        ?.classList.remove("hidden");

    if (isAllSearchActive) {

        renderAllSearch();

    } else {

        renderCategories(
            document
                .getElementById(
                    "searchInput"
                )
                ?.value
                .trim()
                .toLowerCase()
        );
    }
}


function refreshCurrentView() {

    if (currentDataId) {

        showDataPage(
            currentDataId,
            false
        );

    } else if (currentCategoryId) {

        showCategoryView(
            currentCategoryId
        );

    } else if (isAllSearchActive) {

        renderAllSearch();

    } else {

        showMainDashboardView(false);
    }
}


/* =========================================
   Render Category Details
========================================= */
function renderCategoryDetails(
    searchVal = ""
) {

    const container =
        document.getElementById(
            "detailsContent"
        );

    if (!container) return;

    container.innerHTML = "";

    const isAdmin =
        window.currentUserRole === "admin";

    const filterText =
        searchVal === "admin@jr"
            ? ""
            : searchVal;

    let subCategories =
        database.categories.filter(
            cat =>
                cat.parentId ===
                currentCategoryId
        );

    if (filterText) {

        subCategories =
            subCategories.filter(
                sub =>
                    sub.name
                        .toLowerCase()
                        .includes(filterText)
            );
    }

    subCategories =
        sortItemsByPin(
            subCategories
        );

    if (subCategories.length > 0) {

        const subWrapper =
            document.createElement(
                "div"
            );

        subWrapper.style.marginBottom =
            "20px";

        subCategories.forEach(sub => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "subcategory-card";

            const pinIcon =
                sub.pinned
                    ? "📌"
                    : "📍";

            const subImgSrc =
                sub.image
                    ? escapeHTML(sub.image)
                    : DEFAULT_CATEGORY_IMAGE;

            const imageHtml = `
                <img
                    src="${subImgSrc}"
                    alt="${escapeHTML(sub.name)}"
                    class="cat-card-img"
                    onerror="this.src='${DEFAULT_CATEGORY_IMAGE}'"
                >
            `;

            const adminActions =
                isAdmin
                    ? `
                        <div>
                            <button
                                class="btn-pin-sub custom-action-btn"
                                title="পিন"
                            >
                                ${pinIcon}
                            </button>

                            <button
                                class="btn-edit-sub custom-action-btn"
                            >
                                ✏️
                            </button>

                            <button
                                class="btn-del-sub custom-action-btn"
                                style="color:#ef4444"
                            >
                                🗑️
                            </button>
                        </div>
                    `
                    : "";

            const subPinBadge =
                (isAdmin && sub.pinned)
                    ? '<span class="pinned-badge">Pinned</span>'
                    : "";

            item.innerHTML = `
                <div class="sub-click">
                    ${imageHtml}
                    <h3>
                        ${escapeHTML(sub.name)}
                        ${subPinBadge}
                    </h3>
                </div>

                ${adminActions}
            `;

            item
                .querySelector(
                    ".sub-click"
                )
                .addEventListener(
                    "click",
                    () =>
                        openCategory(
                            sub.id
                        )
                );

            if (isAdmin) {

                item
                    .querySelector(
                        ".btn-pin-sub"
                    )
                    ?.addEventListener(
                        "click",
                        e => {

                            e.stopPropagation();

                            togglePinCategory(
                                sub.id
                            );
                        }
                    );

                item
                    .querySelector(
                        ".btn-edit-sub"
                    )
                    ?.addEventListener(
                        "click",
                        e => {

                            e.stopPropagation();

                            editCategory(
                                sub.id
                            );
                        }
                    );

                item
                    .querySelector(
                        ".btn-del-sub"
                    )
                    ?.addEventListener(
                        "click",
                        e => {

                            e.stopPropagation();

                            e.preventDefault();

                            deleteCategory(
                                sub.id
                            );
                        }
                    );
            }

            subWrapper.appendChild(item);
        });

        container.appendChild(
            subWrapper
        );
    }

    let categoryData =
        database.data.filter(
            d =>
                d.categoryId ===
                currentCategoryId
        );

    categoryData =
        sortItemsByPin(
            categoryData
        );

    let noHeaderData =
        categoryData.filter(
            d => !d.headerId
        );

    if (filterText) {

        noHeaderData =
            noHeaderData.filter(
                d =>
                    (d.name &&
                        d.name
                            .toLowerCase()
                            .includes(
                                filterText
                            )) ||
                    (d.mobile &&
                        d.mobile
                            .toLowerCase()
                            .includes(
                                filterText
                            )) ||
                    (d.phone &&
                        d.phone
                            .toLowerCase()
                            .includes(
                                filterText
                            )) ||
                    (d.designation &&
                        d.designation
                            .toLowerCase()
                            .includes(
                                filterText
                            ))
            );
    }

    if (noHeaderData.length > 0) {

        const noHeaderWrapper =
            document.createElement(
                "div"
            );

        noHeaderWrapper.style.marginBottom =
            "15px";

        noHeaderData.forEach(item => {

            noHeaderWrapper.appendChild(
                createDataCardElement(
                    item
                )
            );
        });

        container.appendChild(
            noHeaderWrapper
        );
    }

    let headers =
        database.headers.filter(
            h =>
                h.categoryId ===
                currentCategoryId
        );

    headers =
        sortItemsByPin(headers);

    headers.forEach(header => {

        const headerAllData =
            categoryData.filter(
                d =>
                    d.headerId ===
                    header.id
            );

        const isHeaderMatched =
            filterText &&
            header.title
                .toLowerCase()
                .includes(filterText);

        let matchedData =
            headerAllData;

        if (
            filterText &&
            !isHeaderMatched
        ) {

            matchedData =
                headerAllData.filter(
                    d =>
                        (d.name &&
                            d.name
                                .toLowerCase()
                                .includes(
                                    filterText
                                )) ||
                        (d.mobile &&
                            d.mobile
                                .toLowerCase()
                                .includes(
                                    filterText
                                )) ||
                        (d.phone &&
                            d.phone
                                .toLowerCase()
                                .includes(
                                    filterText
                                )) ||
                        (d.designation &&
                            d.designation
                                .toLowerCase()
                                .includes(
                                    filterText
                                ))
                );
        }

        if (
            !filterText ||
            isHeaderMatched ||
            matchedData.length > 0
        ) {

            const displayData =
                isHeaderMatched
                    ? headerAllData
                    : matchedData;

            const headerBox =
                document.createElement(
                    "div"
                );

            headerBox.className =
                "header-box";

            const pinIcon =
                header.pinned
                    ? "📌"
                    : "📍";

            const adminActions =
                isAdmin
                    ? `
                        <div>
                            <button
                                class="btn-pin-head custom-action-btn"
                                title="পিন"
                            >
                                ${pinIcon}
                            </button>

                            <button
                                class="btn-edit-head custom-action-btn"
                            >
                                ✏️
                            </button>

                            <button
                                class="btn-del-head custom-action-btn"
                                style="color:#ef4444"
                            >
                                🗑️
                            </button>
                        </div>
                    `
                    : "";

            const headerPinMark =
                (isAdmin && header.pinned)
                    ? "📌"
                    : "";

            headerBox.innerHTML = `
                <div class="header-banner">
                    <span>
                        ${escapeHTML(header.title)}
                        ${headerPinMark}
                    </span>

                    ${adminActions}
                </div>
            `;

            if (isAdmin) {

                headerBox
                    .querySelector(
                        ".btn-pin-head"
                    )
                    ?.addEventListener(
                        "click",
                        e => {

                            e.stopPropagation();

                            togglePinHeader(
                                header.id
                            );
                        }
                    );

                headerBox
                    .querySelector(
                        ".btn-edit-head"
                    )
                    ?.addEventListener(
                        "click",
                        e => {

                            e.stopPropagation();

                            editHeader(
                                header.id
                            );
                        }
                    );

                headerBox
                    .querySelector(
                        ".btn-del-head"
                    )
                    ?.addEventListener(
                        "click",
                        e => {

                            e.stopPropagation();

                            e.preventDefault();

                            deleteHeader(
                                header.id
                            );
                        }
                    );
            }

            displayData.forEach(item => {

                headerBox.appendChild(
                    createDataCardElement(
                        item
                    )
                );
            });

            container.appendChild(
                headerBox
            );
        }
    });

    updateAdminUI();
}


/* =========================================
   Open Data Page
========================================= */
function openDataPage(
    dataId,
    pushHistory = true
) {

    if (pushHistory) {

        history.pushState(
            {
                page: "data",
                dataId: dataId
            },
            ""
        );
    }

    showDataPage(dataId);
}


/* =========================================
   Data Details Page
========================================= */
function showDataPage(dataId) {

    const item =
        database.data.find(
            d => d.id === dataId
        );

    if (!item) return;

    currentDataId = dataId;

    document
        .getElementById(
            "verifiedBadge"
        )
        ?.classList.add("hidden");

    setNavState(true);

    document
        .getElementById(
            "mainDashboardView"
        )
        ?.classList.add("hidden");

    document
        .getElementById(
            "categoryDetailsView"
        )
        ?.classList.add("hidden");

    document
        .getElementById(
            "dataDetailsView"
        )
        ?.classList.remove("hidden");

    const container =
        document.getElementById(
            "dataPageContent"
        );

    if (!container) return;

    const devId =
        getDeviceId();

    const approvedRef =
        ref(
            db,
            `webapp/approved_devices/${devId}`
        );

    get(approvedRef)
        .then(snapshot => {

            if (
                snapshot.exists() &&
                snapshot.val().status ===
                    "approved"
            ) {
                isDeviceVerified = true;
            }

            renderDataDetailsContent(
                item
            );
        })
        .catch(() => {

            renderDataDetailsContent(
                item
            );
        });
}


/* =========================================
   Data Details Content
========================================= */
function renderDataDetailsContent(item) {

    const container =
        document.getElementById(
            "dataPageContent"
        );

    if (!container) return;

    const isAdmin =
        window.currentUserRole === "admin";

    const name =
        escapeHTML(
            item.name ||
            "নাম পাওয়া যায়নি"
        );

    const designation =
        escapeHTML(
            item.designation ||
            "পদবী নেই"
        );

    const mobile =
        escapeHTML(
            item.mobile ||
            "মোবাইল নেই"
        );

    const phone =
        escapeHTML(
            item.phone ||
            "টেলিফোন নেই"
        );

    const email =
        escapeHTML(
            item.email ||
            "ইমেইল নেই"
        );

    const currentOffice =
        escapeHTML(
            item.currentOffice || ""
        );

    const permanentAddress =
        escapeHTML(
            item.permanentAddress || ""
        );

    const adminInfo =
        escapeHTML(
            item.adminInfo || ""
        );

    const photo =
        item.photo
            ? escapeHTML(item.photo)
            : null;

    const avatarHtml =
        photo
            ? `<img src="${photo}" alt="${name}" class="details-avatar-large" onerror="this.outerHTML='<div class=\'details-avatar-large\'>👤</div>'">`
            : `<div class="details-avatar-large">👤</div>`;

    const isAuthorized =
        isDeviceVerified ||
        isAdmin;

    const showAdminInfoBox =
        isAuthorized &&
        adminInfo;

    const showPermanentAddressBox =
        isAuthorized &&
        permanentAddress;

    const showVerifyBtnInDetails =
        (!isDeviceVerified &&
            !isAdmin);

    container.innerHTML = `
        <div class="details-header-section">
            <div class="avatar-wrapper">
                ${avatarHtml}
            </div>

            <h2 style="font-size:22px;font-weight:700;">
                ${name}
            </h2>

            <p style="color:var(--text-muted);font-size:15px;">
                ${designation}
            </p>
        </div>

        <div class="quick-action-grid">

            <button
                id="btnMobileCall"
                class="action-btn-round btn-call-round"
            >
                📱 মোবাইল
            </button>

            <button
                id="btnPhoneCall"
                class="action-btn-round btn-phone-round"
            >
                ☎️ টেলিফোন
            </button>

            <a
                href="${item.email ? "mailto:" + item.email : "#"}"
                class="action-btn-round btn-email-round"
            >
                ✉️ ইমেইল
            </a>

            <button
                id="btnShareContact"
                class="action-btn-round btn-share-round"
            >
                🔗 শেয়ার কন্টাক্ট
            </button>

        </div>

        <div class="details-info-list">

            <div class="details-info-box">
                <div class="info-label">
                    📱 মোবাইল
                </div>

                <div class="info-value">
                    ${mobile}
                </div>
            </div>

            <div class="details-info-box">
                <div class="info-label">
                    ☎️ টেলিফোন
                </div>

                <div class="info-value">
                    ${phone}
                </div>
            </div>

            <div class="details-info-box">
                <div class="info-label">
                    💼 পদবী
                </div>

                <div class="info-value">
                    ${designation}
                </div>
            </div>

            <div class="details-info-box">
                <div class="info-label">
                    ✉️ ই-মেইল
                </div>

                <div class="info-value">
                    ${email}
                </div>
            </div>

            ${
                currentOffice
                    ? `
                        <div class="details-info-box">
                            <div class="info-label">
                                🏢 বর্তমান ঠিকানা
                            </div>

                            <div class="info-value">
                                ${currentOffice}
                            </div>
                        </div>
                    `
                    : ""
            }

            ${
                showPermanentAddressBox
                    ? `
                        <div class="details-info-box">
                            <div class="info-label">
                                🏠 স্থায়ী ঠিকানা
                            </div>

                            <div class="info-value">
                                ${permanentAddress}
                            </div>
                        </div>
                    `
                    : ""
            }

            ${
                showAdminInfoBox
                    ? `
                        <div
                            class="details-info-box"
                            style="border-left:4px solid #f59e0b;"
                        >
                            <div class="info-label">
                                📝 প্রশাসনিক তথ্য
                            </div>

                            <div class="info-value">
                                ${adminInfo}
                            </div>
                        </div>
                    `
                    : ""
            }

            ${
                showVerifyBtnInDetails
                    ? `
                        <div style="text-align:right;margin-top:5px;">
                            <button
                                class="btn-get-verify"
                                id="detailsVerifyBtn"
                                title="প্রশাসনিক ডাটা ও স্থায়ী ঠিকানা দেখার জন্য ১০ সে. চেপে রাখুন"
                            >
                                Get Verify
                            </button>
                        </div>
                    `
                    : ""
            }

        </div>
    `;

    setupSmartCallAndWhatsApp(
        document.getElementById(
            "btnMobileCall"
        ),
        item.mobile
    );

    setupSmartCallAndWhatsApp(
        document.getElementById(
            "btnPhoneCall"
        ),
        item.phone
    );

    const detailsVerifyBtn =
        document.getElementById(
            "detailsVerifyBtn"
        );

    if (detailsVerifyBtn) {
        setupHoldToVerify(
            detailsVerifyBtn
        );
    }

    document
        .getElementById(
            "btnShareContact"
        )
        ?.addEventListener(
            "click",
            () => {

                const shareText =
                    `👤 নাম: ${item.name || ""}\n` +
                    `📱 মোবাইল: ${item.mobile || ""}\n` +
                    `☎️ টেলিফোন: ${item.phone || ""}\n` +
                    `✉️ ইমেইল: ${item.email || ""}\n` +
                    `💼 পদবী: ${item.designation || ""}`;

                if (navigator.share) {

                    navigator
                        .share({
                            title: item.name,
                            text: shareText
                        })
                        .catch(() => {});

                } else {

                    navigator
                        .clipboard
                        .writeText(
                            shareText
                        );

                    showToast(
                        "কন্টাক্ট কপি করা হয়েছে!"
                    );
                }
            }
        );
}


/* =========================================
   Smart Dial & Long Press WhatsApp
========================================= */
function setupSmartCallAndWhatsApp(
    element,
    rawNumber
) {

    if (
        !element ||
        !rawNumber ||
        rawNumber === "মোবাইল নেই" ||
        rawNumber === "টেলিফোন নেই"
    ) {

        if (element) {

            element.style.opacity =
                "0.5";

            element.style.cursor =
                "not-allowed";
        }

        return;
    }

    let pressTimer = null;
    let isLongPress = false;

    const startPress = () => {

        isLongPress = false;

        pressTimer =
            setTimeout(() => {

                isLongPress = true;

                if (navigator.vibrate) {
                    navigator.vibrate(60);
                }

                let cleanNumber =
                    rawNumber.replace(
                        /\D/g,
                        ''
                    );

                if (
                    cleanNumber.length ===
                        11 &&
                    cleanNumber.startsWith(
                        '0'
                    )
                ) {

                    cleanNumber =
                        '88' +
                        cleanNumber;
                }

                if (cleanNumber) {

                    window.open(
                        `https://wa.me/${cleanNumber}`,
                        '_blank'
                    );

                } else {

                    showToast(
                        "সঠিক নাম্বার পাওয়া যায়নি!"
                    );
                }

            }, 600);
    };

    const cancelPress = () => {

        if (pressTimer) {

            clearTimeout(
                pressTimer
            );

            pressTimer = null;
        }
    };

    element.addEventListener(
        'mousedown',
        startPress
    );

    element.addEventListener(
        'touchstart',
        startPress,
        { passive: true }
    );

    element.addEventListener(
        'mouseup',
        cancelPress
    );

    element.addEventListener(
        'mouseleave',
        cancelPress
    );

    element.addEventListener(
        'touchend',
        cancelPress
    );

    element.addEventListener(
        'touchcancel',
        cancelPress
    );

    element.addEventListener(
        'click',
        (e) => {

            e.preventDefault();

            if (!isLongPress) {

                let cleanNumber =
                    rawNumber.replace(
                        /[^\d+]/g,
                        ''
                    );

                if (cleanNumber) {

                    const callLink =
                        document.createElement(
                            'a'
                        );

                    callLink.href =
                        `tel:${cleanNumber}`;

                    callLink.style.display =
                        'none';

                    document.body.appendChild(
                        callLink
                    );

                    callLink.click();

                    setTimeout(() => {

                        if (
                            callLink.parentNode
                        ) {

                            callLink
                                .parentNode
                                .removeChild(
                                    callLink
                                );
                        }

                    }, 1000);
                }
            }

            isLongPress = false;
        }
    );
}


/* =========================================
   Modal Helpers
========================================= */
function openModal(id) {

    document
        .getElementById(id)
        ?.classList.remove(
            "hidden"
        );
}


function closeModal(id) {

    document
        .getElementById(id)
        ?.classList.add(
            "hidden"
        );
}


/* =========================================
   Custom Confirm Promise Helper
========================================= */
function customConfirm(
    message,
    title = "নিশ্চিতকরণ",
    confirmText = "হ্যাঁ, মুছুন"
) {

    return new Promise((resolve) => {

        const modal =
            document.getElementById(
                "customConfirmModal"
            );

        const msgEl =
            document.getElementById(
                "confirmModalMessage"
            );

        const titleEl =
            document.getElementById(
                "confirmModalTitle"
            );

        const okBtn =
            document.getElementById(
                "okConfirmBtn"
            );

        const cancelBtn =
            document.getElementById(
                "cancelConfirmBtn"
            );

        const closeBtn =
            modal?.querySelector(
                ".close-btn"
            );

        if (!modal) {
            return resolve(false);
        }

        if (msgEl) {
            msgEl.textContent =
                message;
        }

        if (titleEl) {
            titleEl.textContent =
                title;
        }

        if (okBtn) {
            okBtn.textContent =
                confirmText;
        }

        openModal(
            "customConfirmModal"
        );

        const cleanup = () => {

            okBtn?.removeEventListener(
                "click",
                onOk
            );

            cancelBtn?.removeEventListener(
                "click",
                onCancel
            );

            closeBtn?.removeEventListener(
                "click",
                onCancel
            );
        };

        const onOk = () => {

            closeModal(
                "customConfirmModal"
            );

            cleanup();

            resolve(true);
        };

        const onCancel = () => {

            closeModal(
                "customConfirmModal"
            );

            cleanup();

            resolve(false);
        };

        okBtn?.addEventListener(
            "click",
            onOk
        );

        cancelBtn?.addEventListener(
            "click",
            onCancel
        );

        closeBtn?.addEventListener(
            "click",
            onCancel
        );
    });
}


/* =========================================
   Toast
========================================= */
function showToast(msg) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) return;

    toast.textContent = msg;

    toast.classList.add(
        "show"
    );

    setTimeout(
        () =>
            toast.classList.remove(
                "show"
            ),
        2500
    );
}

