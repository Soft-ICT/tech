/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import { watchAuth, loginAdmin } from "./auth.js";
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

// ডিফল্টভাবে ইউজারকে Admin ধরা হবে না (Guest Role)
window.currentUserRole = "guest";

/* =========================================================
   AUTH & UI CONTROL
========================================================= */

watchAuth((user, role) => {
    const adminBtn = document.getElementById("adminLoginBtn");
    
    if (!user) {
        // গেস্ট মোড
        window.currentUser = null;
        window.currentUserRole = "guest";
        if (adminBtn) adminBtn.textContent = "🔑 Admin Login";
    } else {
        // এডমিন মোড
        window.currentUser = user;
        window.currentUserRole = role || "admin";
        if (adminBtn) adminBtn.textContent = "👤 Admin Active";
    }

    // UI-তে এডমিন বাটনগুলো রেন্ডার বা হাইড করা
    updateAdminUI();

    // অ্যাডমিন বা গেস্ট যে-ই হোক, ডাটা লোড হবে
    loadDatabase();
});

function updateAdminUI() {
    const isAdmin = window.currentUserRole === "admin";
    
    // এডমিন বাটনগুলোর প্রদর্শনী নিয়ন্ত্রণ
    const adminElements = document.querySelectorAll(".admin-only");
    adminElements.forEach(el => {
        if (isAdmin) {
            el.classList.remove("hidden");
        } else {
            el.classList.add("hidden");
        }
    });
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
   FIREBASE LOAD (গেস্ট এবং এডমিন উভয়ের জন্যই ডাটা লোড হবে)
========================================================= */

async function loadDatabase() {
    try {
        // স্থায়ী এডমিন Path থেকে পাবলিকলি রিড করা হবে
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

/* =========================================================
   FIREBASE SAVE (শুধুমাত্র Admin সেভ করতে পারবে)
========================================================= */

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

/* =========================================================
   ID GENERATOR
========================================================= */

function generateId(prefix) {
    return (
        prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8)
    );
}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {
    // Theme & Search
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);
    document.getElementById("searchBtn")?.addEventListener("click", toggleSearch);
    document.getElementById("clearSearch")?.addEventListener("click", clearSearch);
    document.getElementById("searchInput")?.addEventListener("input", renderCategories);

    // Admin Login Events
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

    // Modals & Navigation
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
        card.style.cssText =
            "padding:15px;border-radius:8px;background:var(--card-bg,#fff);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(0,0,0,.1);";

        const subCount = database.categories.filter(c => c.parentId === category.id).length;
        const dataCount = database.data.filter(d => d.categoryId === category.id).length;
        const pinIcon = category.pinned ? "📌" : "📍";

        // এডমিন না হলে বাটনগুলো থাকবে না
        const adminActions = isAdmin ? `
            <div style="display:flex;gap:6px;align-items:center">
                <button class="btn-pin-cat secondary-btn" style="padding:4px 8px">${pinIcon}</button>
                <button class="btn-edit-cat secondary-btn" style="padding:4px 8px">✏️</button>
                <button class="btn-del-cat secondary-btn" style="padding:4px 8px;color:red">🗑️</button>
            </div>
        ` : '';

        card.innerHTML = `
            <div style="flex-grow:1;cursor:pointer" class="cat-click">
                <h3 style="margin:0;font-size:16px">${escapeHTML(category.name)}</h3>
                <small style="color:gray">${subCount} Sub-Categories • ${dataCount} Data</small>
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
        subWrapper.innerHTML = `<h4>📂 Sub-Categories</h4>`;

        subCategories.sort(pinComparator).forEach(sub => {
            const item = document.createElement("div");
            item.style.cssText =
                "padding:12px 15px;background:rgba(0,0,0,.04);border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;font-weight:500;";

            const pinIcon = sub.pinned ? "📌" : "📍";
            const adminActions = isAdmin ? `
                <div style="display:flex;gap:6px">
                    <button class="btn-pin-sub secondary-btn">${pinIcon}</button>
                    <button class="btn-edit-sub secondary-btn">✏️</button>
                    <button class="btn-del-sub secondary-btn" style="color:red">🗑️</button>
                </div>
            ` : '';

            item.innerHTML = `
                <span style="cursor:pointer;flex-grow:1" class="sub-click">${escapeHTML(sub.name)}</span>
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
        headerBox.style.cssText = "margin-bottom:15px;padding:12px;border:1px dashed #ccc;border-radius:6px;";

        const pinIcon = header.pinned ? "📌" : "📍";
        const adminActions = isAdmin ? `
            <div style="display:flex;gap:6px">
                <button class="btn-pin-head secondary-btn">${pinIcon}</button>
                <button class="btn-edit-head secondary-btn">✏️</button>
                <button class="btn-del-head secondary-btn" style="color:red">🗑️</button>
            </div>
        ` : '';

        headerBox.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <h5 style="margin:0;font-size:15px">${escapeHTML(header.title)}</h5>
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
        noHeaderBox.innerHTML = `<h5 style="margin:10px 0">📄 সাধারণ Data</h5>`;

        noHeaderData.forEach(item => noHeaderBox.appendChild(createDataCardElement(item)));
        container.appendChild(noHeaderBox);
    }

    if (subCategories.length === 0 && headers.length === 0 && categoryData.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:gray;margin-top:30px">এখানে কোনো ডাটা নেই।</p>`;
    }

    updateAdminUI();
}

/* =========================================================
   SORT
========================================================= */

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

/* =========================================================
   DATA CARD
========================================================= */

function createDataCardElement(item) {
    const isAdmin = window.currentUserRole === "admin";
    const dataEl = document.createElement("div");
    dataEl.style.cssText =
        "padding:10px;background:var(--card-bg,#fff);margin-bottom:6px;border-radius:4px;border:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-start;";

    const pinIcon = item.pinned ? "📌" : "📍";
    const adminActions = isAdmin ? `
        <div style="display:flex;gap:5px;flex-wrap:wrap">
            <button class="btn-pin-data secondary-btn" style="padding:2px 6px">${pinIcon}</button>
            <button class="btn-move-data secondary-btn" style="padding:2px 6px">📦</button>
            <button class="btn-edit-data secondary-btn" style="padding:2px 6px">✏️</button>
            <button class="btn-del-data secondary-btn" style="padding:2px 6px;color:red">🗑️</button>
        </div>
    ` : '';

    dataEl.innerHTML = `
        <div>
            <strong>${escapeHTML(item.title)}</strong>
            <p style="margin:4px 0 0;font-size:13px;color:#555">${escapeHTML(item.description)}</p>
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
   DATA CRUD
========================================================= */

function openDataModal() {
    if (window.currentUserRole !== "admin") return;
    const titleInput = document.getElementById("dataTitleInput");
    const descInput = document.getElementById("dataDescriptionInput");
    const select = document.getElementById("dataHeaderSelect");

    if (titleInput) titleInput.value = "";
    if (descInput) descInput.value = "";

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
    const title = document.getElementById("dataTitleInput")?.value.trim();
    const desc = document.getElementById("dataDescriptionInput")?.value.trim();
    const headerId = document.getElementById("dataHeaderSelect")?.value;

    if (!title || !currentCategoryId) return;

    database.data.push({
        id: generateId("data"),
        categoryId: currentCategoryId,
        headerId: headerId || null,
        title: title,
        description: desc || "",
        pinned: false,
        pinOrder: 0
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

    const title = prompt("নতুন Title দিন:", item.title);
    if (title === null) return;

    const desc = prompt("নতুন বিবরণ দিন:", item.description || "");
    if (desc === null) return;

    item.title = title.trim();
    item.description = desc.trim();

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
