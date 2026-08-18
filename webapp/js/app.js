/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import { watchAuth, loginAdmin, logoutAdmin } from "./auth.js";
import {
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

"use strict";

/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

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

/* =========================================================
   DATABASE STATE
========================================================= */

let database = {
    categories: [],
    headers: [],
    data: []
};

let currentCategoryId = null;
let targetMoveDataId = null;
let editingDataId = null;

window.currentUserRole = "guest";

/* =========================================================
   AUTH & UI CONTROL
========================================================= */

watchAuth((user, role) => {
    const adminBtn = document.getElementById("adminLoginBtn");
    
    if (!user) {
        window.currentUser = null;
        window.currentUserRole = "guest";
        if (adminBtn) adminBtn.textContent = "🔑 Admin Login";
    } else {
        window.currentUser = user;
        window.currentUserRole = role || "admin";
        if (adminBtn) adminBtn.textContent = "👤 Admin Active";
    }

    updateAdminUI();
    loadDatabase();
});

function updateAdminUI() {
    const isAdmin = window.currentUserRole === "admin";

    const adminElements = document.querySelectorAll(".admin-only");
    adminElements.forEach(el => {
        if (isAdmin) {
            el.classList.remove("hidden");
        } else {
            el.classList.add("hidden");
        }
    });

    const loginForm = document.getElementById("loginFormContainer");
    const logoutContainer = document.getElementById("logoutContainer");

    if (loginForm) {
        if (isAdmin) {
            loginForm.style.display = "none";
        } else {
            loginForm.style.display = "block";
        }
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
    setupEvents();
    initTheme();
    updateAdminUI();
});

/* =========================================================
   THEME
========================================================= */

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

/* =========================================================
   FIREBASE LOAD & SAVE
========================================================= */

async function loadDatabase() {
    try {
        const snapshot = await get(ref(db, "webapp/public_data"));
        if (snapshot.exists()) {
            database = snapshot.val();
            if (!database.categories) database.categories = [];
            if (!database.headers) database.headers = [];
            if (!database.data) database.data = [];
        } else {
            database = { categories: [], headers: [], data: [] };
        }
        migratePinData();
        refreshCurrentView();
    } catch (error) {
        console.error("Database load error:", error);
        showToast("ডাটা লোড করতে সমস্যা হয়েছে");
    }
}

async function saveDatabase() {
    if (window.currentUserRole !== "admin") {
        showToast("শুধুমাত্র Admin পরিবর্তন সেভ করতে পারবেন");
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
    return (
        prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8)
    );
}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);
    document.getElementById("searchBtn")?.addEventListener("click", toggleSearch);
    document.getElementById("clearSearch")?.addEventListener("click", clearSearch);
    document.getElementById("searchInput")?.addEventListener("input", renderCategories);

    document.getElementById("adminLoginBtn")?.addEventListener("click", () => {
        openModal("loginModal");
    });

    document.getElementById("submitLoginBtn")?.addEventListener("click", async () => {
        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document.getElementById("loginPassword")?.value.trim();

        if (!email || !password) {
            showToast("ইমেইল এবং পাসওয়ার্ড দিন");
            return;
        }

        const res = await loginAdmin(email, password);
        if (res.success) {
            showToast("অ্যাডমিন লগইন সফল হয়েছে!");
            closeModal("loginModal");
            document.getElementById("loginEmail").value = "";
            document.getElementById("loginPassword").value = "";
        } else {
            showToast("লগইন ব্যর্থ হয়েছে: " + res.error);
        }
    });

    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        const result = await logoutAdmin();
        if (result.success) {
            closeModal("loginModal");
            showToast("লগআউট করা হয়েছে");
        } else {
            showToast("লগআউট করতে সমস্যা: " + result.error);
        }
    });

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

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", e => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
}

/* =========================================================
   CATEGORY NAVIGATION
========================================================= */

function openCategory(id) {
    const category = database.categories.find(item => item.id === id);
    if (!category) return;

    currentCategoryId = id;

    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    const title = document.getElementById("detailsTitle");
    const subtitle = document.getElementById("detailsSubtitle");

    if (title) title.textContent = category.name;

    const headersCount = database.headers.filter(h => h.categoryId === id).length;
    const dataCount = database.data.filter(d => d.categoryId === id).length;

    if (subtitle) {
        subtitle.textContent = `${headersCount} Header • ${dataCount} Data`;
    }

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

/* =========================================================
   PIN SYSTEM
========================================================= */

function getPinScope(type, item) {
    if (type === "category") return "category";
    if (type === "header") return "header_" + String(item.categoryId);
    if (type === "data") {
        return (
            "data_" + String(item.categoryId) + "_" + (item.headerId ? String(item.headerId) : "no_header")
        );
    }
    return "unknown";
}

function getNextPinOrder(type, item, list) {
    const scope = getPinScope(type, item);
    let maxOrder = 0;

    list.forEach(current => {
        if (!current || current.pinned !== true) return;
        if (getPinScope(type, current) !== scope) return;

        const order = Number(current.pinOrder);
        if (Number.isFinite(order) && order > maxOrder) {
            maxOrder = order;
        }
    });

    return maxOrder + 1;
}

function normalizePinOrders(type, referenceItem, list) {
    const scope = getPinScope(type, referenceItem);

    const pinned = list
        .filter(item => item && item.pinned === true && getPinScope(type, item) === scope)
        .sort((a, b) => {
            const ao = Number(a.pinOrder) || 999999999;
            const bo = Number(b.pinOrder) || 999999999;
            if (ao !== bo) return ao - bo;
            return String(a.id).localeCompare(String(b.id));
        });

    pinned.forEach((item, index) => {
        item.pinOrder = index + 1;
    });
}

async function togglePin(type, id) {
    if (window.currentUserRole !== "admin") return;

    let list;
    if (type === "category") list = database.categories;
    else if (type === "header") list = database.headers;
    else if (type === "data") list = database.data;
    else return;

    const item = list.find(x => x.id === id);
    if (!item) return;

    if (item.pinned === true) {
        item.pinned = false;
        item.pinOrder = 0;
        normalizePinOrders(type, item, list);
        await saveDatabase();
        refreshCurrentView();
        showToast("📍 আনপিন করা হয়েছে");
        return;
    }

    item.pinned = true;
    item.pinOrder = getNextPinOrder(type, item, list);

    await saveDatabase();
    refreshCurrentView();
    showToast("📌 পিন করা হয়েছে");
}

function refreshCurrentView() {
    if (currentCategoryId) {
        renderCategoryDetails();
    } else {
        renderCategories();
    }
}

function migratePinData() {
    const lists = [database.categories, database.headers, database.data];

    lists.forEach(list => {
        list.forEach(item => {
            if (!item) return;
            if (item.pinned === true && !Number.isFinite(Number(item.pinOrder))) {
                item.pinOrder = 0;
            }
            if (item.pinned !== true) {
                item.pinOrder = 0;
            }
        });
    });

    normalizeAllPinScopes();
}

function normalizeAllPinScopes() {
    normalizeCategoryPins();

    const categoryIds = [...new Set(database.headers.map(h => h.categoryId))];

    categoryIds.forEach(categoryId => {
        const headers = database.headers.filter(h => h.categoryId === categoryId);
        headers.forEach(header => {
            normalizePinOrders("header", header, database.headers);
        });
    });

    database.data.forEach(item => {
        normalizePinOrders("data", item, database.data);
    });
}

function normalizeCategoryPins() {
    const pinned = database.categories
        .filter(c => !c.parentId && c.pinned === true)
        .sort((a, b) => (Number(a.pinOrder) || 999999999) - (Number(b.pinOrder) || 999999999));

    pinned.forEach((item, index) => {
        item.pinOrder = index + 1;
    });
}

/* =========================================================
   CATEGORY CRUD
========================================================= */

function openCategoryModal(isSubCategory = false) {
    if (window.currentUserRole !== "admin") return;
    const title = document.getElementById("categoryModalTitle");
    if (title) {
        title.textContent = isSubCategory ? "নতুন Sub-Category" : "নতুন Category";
    }

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
        pinOrder: 0,
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

    function removeRecursively(catId) {
        const subs = database.categories.filter(c => c.parentId === catId);
        subs.forEach(sub => removeRecursively(sub.id));

        database.categories = database.categories.filter(c => c.id !== catId);
        database.headers = database.headers.filter(h => h.categoryId !== catId);
        database.data = database.data.filter(d => d.categoryId !== catId);
    }

    removeRecursively(id);
    await saveDatabase();

    if (currentCategoryId === id) {
        currentCategoryId = null;
        goBack();
    } else if (currentCategoryId) {
        renderCategoryDetails();
    } else {
        renderCategories();
    }

    showToast("Category ডিলিট করা হয়েছে");
}

/* =========================================================
   CATEGORY RENDER
========================================================= */

function renderCategories() {
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    const countElement = document.getElementById("categoryCount");

    if (!list || !emptyState) return;

    const searchVal = document.getElementById("searchInput")?.value.trim().toLowerCase();
    let categoriesToShow = database.categories.filter(cat => !cat.parentId);

    if (searchVal) {
        categoriesToShow = database.categories.filter(cat =>
            String(cat.name).toLowerCase().includes(searchVal)
        );
    }

    categoriesToShow.sort((a, b) => {
        const ap = a.pinned === true;
        const bp = b.pinned === true;
        if (ap !== bp) return ap ? -1 : 1;
        if (ap && bp) {
            return (Number(a.pinOrder) || 999999999) - (Number(b.pinOrder) || 999999999);
        }
        return 0;
    });

    list.innerHTML = "";

    if (countElement) {
        countElement.textContent = `${categoriesToShow.length}টি Category`;
    }

    if (database.categories.length === 0) {
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

        const pinIcon = category.pinned ? "📍" : "📌";

        const adminActions = isAdmin ? `
            <div class="action-btn-group">
                <button class="btn-pin-cat custom-action-btn">${pinIcon}</button>
                <button class="btn-edit-cat custom-action-btn">✏️</button>
                <button class="btn-del-cat custom-action-btn">🗑️</button>
            </div>
        ` : '';

        card.innerHTML = `
            <div style="flex-grow:1;cursor:pointer;display:flex;align-items:center;height:100%;" class="cat-click">
                <h3 style="margin:0;font-size:18px;font-weight:600;color:#ffffff">${escapeHTML(category.name)}</h3>
            </div>
            ${adminActions}
        `;

        card.querySelector(".cat-click").addEventListener("click", () => openCategory(category.id));
        
        if (isAdmin) {
            card.querySelector(".btn-pin-cat").addEventListener("click", e => {
                e.stopPropagation();
                togglePin("category", category.id);
            });
            card.querySelector(".btn-edit-cat").addEventListener("click", e => {
                e.stopPropagation();
                editCategory(category.id);
            });
            card.querySelector(".btn-del-cat").addEventListener("click", e => {
                e.stopPropagation();
                deleteCategory(category.id);
            });
        }

        list.appendChild(card);
    });

    updateAdminUI();
}

/* =========================================================
   CATEGORY DETAILS
========================================================= */

function renderCategoryDetails() {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";
    const isAdmin = window.currentUserRole === "admin";

    const subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);

    if (subCategories.length > 0) {
        const subWrapper = document.createElement("div");
        subWrapper.style.marginBottom = "20px";
        subWrapper.innerHTML = `<h4 style="color:#003358;margin-bottom:12px;padding-left:12px;">📂 Sub-Categories</h4>`;

        subCategories.sort(pinComparator).forEach(sub => {
            const item = document.createElement("div");
            item.className = "subcategory-card";

            const pinIcon = sub.pinned ? "📍" : "📌";
            const adminActions = isAdmin ? `
                <div class="action-btn-group">
                    <button class="btn-pin-sub custom-action-btn">${pinIcon}</button>
                    <button class="btn-edit-sub custom-action-btn">✏️</button>
                    <button class="btn-del-sub custom-action-btn">🗑️</button>
                </div>
            ` : '';

            item.innerHTML = `
                <div style="flex-grow:1;cursor:pointer;display:flex;align-items:center;height:100%;" class="sub-click">
                    <h3 style="margin:0;font-size:18px;font-weight:600;color:#ffffff">${escapeHTML(sub.name)}</h3>
                </div>
                ${adminActions}
            `;

            item.querySelector(".sub-click").addEventListener("click", () => openCategory(sub.id));
            if (isAdmin) {
                item.querySelector(".btn-pin-sub").addEventListener("click", () => togglePin("category", sub.id));
                item.querySelector(".btn-edit-sub").addEventListener("click", () => editCategory(sub.id));
                item.querySelector(".btn-del-sub").addEventListener("click", () => deleteCategory(sub.id));
            }

            subWrapper.appendChild(item);
        });

        container.appendChild(subWrapper);
    }

    const headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    const categoryData = database.data.filter(d => d.categoryId === currentCategoryId);

    headers.sort(pinComparator).forEach(header => {
        const headerBox = document.createElement("div");
        headerBox.className = "header-box";

        const pinIcon = header.pinned ? "📌" : "📍";
        const adminActions = isAdmin ? `
            <div style="display:flex;gap:6px">
                <button class="btn-pin-head custom-action-btn">${pinIcon}</button>
                <button class="btn-edit-head custom-action-btn">✏️</button>
                <button class="btn-del-head custom-action-btn" style="color:red">🗑️</button>
            </div>
        ` : '';

        headerBox.innerHTML = `
            <div class="header-banner">
                <h5>${escapeHTML(header.title)}</h5>
                ${adminActions}
            </div>
        `;

        if (isAdmin) {
            headerBox.querySelector(".btn-pin-head").addEventListener("click", () => togglePin("header", header.id));
            headerBox.querySelector(".btn-edit-head").addEventListener("click", () => editHeader(header.id));
            headerBox.querySelector(".btn-del-head").addEventListener("click", () => deleteHeader(header.id));
        }

        const headerItems = categoryData
            .filter(d => d.headerId === header.id)
            .sort(pinComparator);

        headerItems.forEach(item => {
            headerBox.appendChild(createDataCardElement(item));
        });

        container.appendChild(headerBox);
    });

    const noHeaderData = categoryData.filter(d => !d.headerId).sort(pinComparator);

    if (noHeaderData.length > 0) {
        const noHeaderBox = document.createElement("div");
        noHeaderBox.className = "header-box";
        noHeaderBox.innerHTML = `
            <div class="header-banner" style="background-color: #6c757d !important;">
                <h5>📄 সাধারণ Data</h5>
            </div>
        `;

        noHeaderData.forEach(item => noHeaderBox.appendChild(createDataCardElement(item)));
        container.appendChild(noHeaderBox);
    }

    if (subCategories.length === 0 && headers.length === 0 && categoryData.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:gray;margin-top:30px">এখানে কোনো ডাটা নেই।</p>`;
    }

    updateAdminUI();
}

function pinComparator(a, b) {
    const ap = a.pinned === true;
    const bp = b.pinned === true;

    if (ap !== bp) return ap ? -1 : 1;

    if (ap && bp) {
        const ao = Number(a.pinOrder) || 999999999;
        const bo = Number(b.pinOrder) || 999999999;
        if (ao !== bo) return ao - bo;
    }

    return 0;
}

function createDataCardElement(item) {
    const isAdmin = window.currentUserRole === "admin";
    const dataEl = document.createElement("div");
    dataEl.className = "data-card-item";

    const pinIcon = item.pinned ? "📌" : "📍";
    const adminActions = isAdmin ? `
        <div style="display:flex;gap:5px;flex-wrap:wrap">
            <button class="btn-pin-data custom-action-btn">${pinIcon}</button>
            <button class="btn-move-data custom-action-btn">📦</button>
            <button class="btn-edit-data custom-action-btn">✏️</button>
            <button class="btn-del-data custom-action-btn" style="color:red">🗑️</button>
        </div>
    ` : '';

    const name = escapeHTML(item.name || item.title || "");
    const designation = escapeHTML(item.designation || "");
    const mobile = escapeHTML(item.mobile || "");
    const phone = escapeHTML(item.phone || "");
    const email = escapeHTML(item.email || "");
    const currentOffice = escapeHTML(item.currentOffice || "");
    const permanentAddress = escapeHTML(item.permanentAddress || "");
    const adminInfo = escapeHTML(item.adminInfo || item.description || "");

    const mobileLink = mobile ? `<a href="tel:${mobile}" style="color: #2563eb; text-decoration: none; font-weight: 600;">📞 ${mobile}</a>` : '';
    const phoneLink = phone ? `<a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">☎️ ${phone}</a>` : '';
    const emailLink = email ? `<a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">✉️ ${email}</a>` : '';

    dataEl.innerHTML = `
        <div style="flex-grow: 1;">
            ${name ? `<strong style="font-size:16px; color:#172033; margin-bottom:4px; display:block;">${name}</strong>` : ''}
            ${designation ? `<p style="margin:2px 0; font-size:13.5px;"><strong>পদবী:</strong> ${designation}</p>` : ''}
            ${mobile ? `<p style="margin:2px 0; font-size:13.5px;"><strong>মোবাইল:</strong> ${mobileLink}</p>` : ''}
            ${phone ? `<p style="margin:2px 0; font-size:13.5px;"><strong>টেলিফোন:</strong> ${phoneLink}</p>` : ''}
            ${email ? `<p style="margin:2px 0; font-size:13.5px;"><strong>ই-মেইল:</strong> ${emailLink}</p>` : ''}
            ${currentOffice ? `<p style="margin:2px 0; font-size:13.5px;"><strong>কর্মস্থল:</strong> ${currentOffice}</p>` : ''}
            ${permanentAddress ? `<p style="margin:2px 0; font-size:13.5px;"><strong>স্থায়ী ঠিকানা:</strong> ${permanentAddress}</p>` : ''}
            ${adminInfo ? `<p style="margin:2px 0; font-size:13.5px;"><strong>প্রশাসনিক তথ্য:</strong> ${adminInfo}</p>` : ''}
        </div>
        ${adminActions}
    `;

    if (isAdmin) {
        dataEl.querySelector(".btn-pin-data").addEventListener("click", () => togglePin("data", item.id));
        dataEl.querySelector(".btn-move-data").addEventListener("click", () => openMoveModal(item.id));
        dataEl.querySelector(".btn-edit-data").addEventListener("click", () => editData(item.id));
        dataEl.querySelector(".btn-del-data").addEventListener("click", () => deleteData(item.id));
    }

    return dataEl;
}

/* =========================================================
   HEADER CRUD
========================================================= */

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
        pinned: false,
        pinOrder: 0
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

    const title = prompt("নতুন Header Name দিন:", header.title);
    if (title && title.trim()) {
        header.title = title.trim();
        await saveDatabase();
        renderCategoryDetails();
        showToast("Header এডিট করা হয়েছে");
    }
}

async function deleteHeader(id) {
    if (window.currentUserRole !== "admin") return;
    if (!confirm("এই Header ডিলিট করবেন? এর Data সাধারণ Data-তে চলে যাবে।")) return;

    database.headers = database.headers.filter(h => h.id !== id);
    database.data.forEach(d => {
        if (d.headerId === id) {
            d.headerId = null;
            d.pinned = false;
            d.pinOrder = 0;
        }
    });

    await saveDatabase();
    renderCategoryDetails();
    showToast("Header ডিলিট করা হয়েছে");
}

/* =========================================================
   DATA CRUD (Updated for 8 Fields)
========================================================= */

function openDataModal() {
    if (window.currentUserRole !== "admin") return;
    editingDataId = null;

    document.getElementById("dataName").value = "";
    document.getElementById("dataDesignation").value = "";
    document.getElementById("dataMobile").value = "";
    document.getElementById("dataPhone").value = "";
    document.getElementById("dataEmail").value = "";
    document.getElementById("dataCurrentOffice").value = "";
    document.getElementById("dataPermanentAddress").value = "";
    document.getElementById("dataAdminInfo").value = "";

    const select = document.getElementById("dataHeaderSelect");
    if (select) {
        select.innerHTML = `<option value="">Header ছাড়া</option>`;
        database.headers
            .filter(h => h.categoryId === currentCategoryId)
            .forEach(h => {
                select.innerHTML += `<option value="${h.id}">${escapeHTML(h.title)}</option>`;
            });
    }

    openModal("dataModal");
}

async function saveData() {
    if (window.currentUserRole !== "admin") return;

    const name = document.getElementById("dataName")?.value.trim() || "";
    const designation = document.getElementById("dataDesignation")?.value.trim() || "";
    const mobile = document.getElementById("dataMobile")?.value.trim() || "";
    const phone = document.getElementById("dataPhone")?.value.trim() || "";
    const email = document.getElementById("dataEmail")?.value.trim() || "";
    const currentOffice = document.getElementById("dataCurrentOffice")?.value.trim() || "";
    const permanentAddress = document.getElementById("dataPermanentAddress")?.value.trim() || "";
    const adminInfo = document.getElementById("dataAdminInfo")?.value.trim() || "";
    const headerId = document.getElementById("dataHeaderSelect")?.value || null;

    if (!name && !mobile && !designation) {
        showToast("কমপক্ষে নাম বা তথ্য পূরণ করুন");
        return;
    }

    if (editingDataId) {
        const item = database.data.find(d => d.id === editingDataId);
        if (item) {
            item.name = name;
            item.designation = designation;
            item.mobile = mobile;
            item.phone = phone;
            item.email = email;
            item.currentOffice = currentOffice;
            item.permanentAddress = permanentAddress;
            item.adminInfo = adminInfo;
            item.headerId = headerId;
        }
    } else {
        const newData = {
            id: generateId("data"),
            categoryId: currentCategoryId,
            headerId: headerId,
            name: name,
            designation: designation,
            mobile: mobile,
            phone: phone,
            email: email,
            currentOffice: currentOffice,
            permanentAddress: permanentAddress,
            adminInfo: adminInfo,
            pinned: false,
            pinOrder: 0
        };
        database.data.push(newData);
    }

    await saveDatabase();
    closeModal("dataModal");
    renderCategoryDetails();
    showToast("Data সেভ করা হয়েছে");
}

async function editData(id) {
    if (window.currentUserRole !== "admin") return;
    const item = database.data.find(d => d.id === id);
    if (!item) return;

    editingDataId = id;

    document.getElementById("dataName").value = item.name || item.title || "";
    document.getElementById("dataDesignation").value = item.designation || "";
    document.getElementById("dataMobile").value = item.mobile || "";
    document.getElementById("dataPhone").value = item.phone || "";
    document.getElementById("dataEmail").value = item.email || "";
    document.getElementById("dataCurrentOffice").value = item.currentOffice || "";
    document.getElementById("dataPermanentAddress").value = item.permanentAddress || "";
    document.getElementById("dataAdminInfo").value = item.adminInfo || item.description || "";

    const select = document.getElementById("dataHeaderSelect");
    if (select) {
        select.innerHTML = `<option value="">Header ছাড়া</option>`;
        database.headers
            .filter(h => h.categoryId === currentCategoryId)
            .forEach(h => {
                const selected = h.id === item.headerId ? "selected" : "";
                select.innerHTML += `<option value="${h.id}" ${selected}>${escapeHTML(h.title)}</option>`;
            });
    }

    openModal("dataModal");
}

async function deleteData(id) {
    if (window.currentUserRole !== "admin") return;
    if (!confirm("আপনি কি নিশ্চিত এই Data ডিলিট করতে চান?")) return;

    database.data = database.data.filter(d => d.id !== id);
    await saveDatabase();
    renderCategoryDetails();
    showToast("Data ডিলিট করা হয়েছে");
}

/* =========================================================
   MOVE DATA
========================================================= */

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

    const updateHeaders = selectedCatId => {
        headSelect.innerHTML = `<option value="">📄 সাধারণ Data</option>`;
        database.headers
            .filter(h => h.categoryId === selectedCatId)
            .forEach(h => {
                const selected = h.id === item.headerId && selectedCatId === item.categoryId ? "selected" : "";
                headSelect.innerHTML += `<option value="${h.id}" ${selected}>🏷️ ${escapeHTML(h.title)}</option>`;
            });
    };

    updateHeaders(catSelect.value);
    catSelect.onchange = e => updateHeaders(e.target.value);

    openModal("moveDataModal");
}

async function confirmMoveData() {
    if (window.currentUserRole !== "admin") return;
    if (!targetMoveDataId) return;

    const item = database.data.find(d => d.id === targetMoveDataId);
    const catId = document.getElementById("moveCategorySelect")?.value;
    const headerId = document.getElementById("moveHeaderSelect")?.value;

    if (item && catId) {
        item.categoryId = catId;
        item.headerId = headerId || null;
        item.pinned = false;
        item.pinOrder = 0;

        await saveDatabase();
        closeModal("moveDataModal");
        renderCategoryDetails();
        showToast("Data সফলভাবে স্থানান্তর করা হয়েছে");
    }

    targetMoveDataId = null;
}

/* =========================================================
   UI HELPERS
========================================================= */

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
