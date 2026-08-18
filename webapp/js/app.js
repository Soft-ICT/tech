import { watchAuth, loginAdmin, logoutAdmin } from "./auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { db } from "./firebase.js";

"use strict";

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

let database = { categories: [], headers: [], data: [] };
let currentCategoryId = null;
let currentDataId = null;
let editingItem = null; // Edit tracking
let movingDataId = null; // Move tracking

window.currentUserRole = "guest";

watchAuth((user, role) => {
    const adminBtn = document.getElementById("adminLoginBtn");
    if (!user) {
        window.currentUser = null;
        window.currentUserRole = "guest";
        if (adminBtn) adminBtn.textContent = "🔑 Admin";
    } else {
        window.currentUser = user;
        window.currentUserRole = role || "admin";
        if (adminBtn) adminBtn.textContent = "👤 Admin";
    }
    updateAdminUI();
    loadDatabase();
});

/* এডমিন ও ইউজারের হেডারের এলাইনমেন্ট ডায়নামিক করার ফাংশন */
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
        if (isAdmin) el.classList.remove("hidden");
        else el.classList.add("hidden");
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

    history.replaceState({ page: "home" }, "");
    window.addEventListener("popstate", handlePopState);
});

function handlePopState(event) {
    const state = event.state;
    if (!state || state.page === "home") {
        showMainDashboardView(false);
    } else if (state.page === "category") {
        showCategoryView(state.categoryId, false);
    } else if (state.page === "data") {
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
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
}

function setupEvents() {
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);
    document.getElementById("searchBtn")?.addEventListener("click", () => {
        const searchBox = document.getElementById("searchBox");
        searchBox?.classList.toggle("hidden");
        if (!searchBox?.classList.contains("hidden")) {
            document.getElementById("searchInput")?.focus();
        }
    });

    document.getElementById("clearSearch")?.addEventListener("click", () => {
        const input = document.getElementById("searchInput");
        if (input) input.value = "";
        handleSearch();
    });

    document.getElementById("searchInput")?.addEventListener("input", handleSearch);
    document.getElementById("adminLoginBtn")?.addEventListener("click", () => openModal("loginModal"));

    document.getElementById("submitLoginBtn")?.addEventListener("click", async () => {
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

    document.getElementById("addCategoryBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("emptyAddBtn")?.addEventListener("click", () => openCategoryModal(false));
    document.getElementById("addSubCategoryBtn")?.addEventListener("click", () => openCategoryModal(true));
    document.getElementById("saveCategoryBtn")?.addEventListener("click", saveCategory);
    document.getElementById("saveHeaderBtn")?.addEventListener("click", saveHeader);
    document.getElementById("saveDataBtn")?.addEventListener("click", saveData);
    document.getElementById("confirmMoveBtn")?.addEventListener("click", confirmMoveData);
    document.getElementById("addHeaderBtn")?.addEventListener("click", openHeaderModal);
    document.getElementById("addDataBtn")?.addEventListener("click", openDataModal);

    document.getElementById("backToMainBtn")?.addEventListener("click", () => history.back());
    document.getElementById("backFromDataBtn")?.addEventListener("click", () => history.back());

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
}

function handleSearch() {
    const searchVal = document.getElementById("searchInput")?.value.trim().toLowerCase();
    if (currentCategoryId) renderCategoryDetails(searchVal);
    else renderCategories(searchVal);
}

/* ---------------- Category Renders & Actions ---------------- */
function renderCategories(searchVal = "") {
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    const countElement = document.getElementById("categoryCount");
    if (!list || !emptyState) return;

    let categoriesToShow = database.categories.filter(cat => !cat.parentId);

    if (searchVal) {
        categoriesToShow = categoriesToShow.filter(cat => String(cat.name).toLowerCase().includes(searchVal));
    }

    // পিন করা ক্যাটাগরি উপরে থাকবে
    categoriesToShow.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    list.innerHTML = "";
    if (countElement) countElement.textContent = `${categoriesToShow.length}টি Category`;

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
        const adminActions = isAdmin ? `
            <div class="action-btn-group">
                <button class="btn-pin-cat custom-action-btn" title="পিন করুন">${pinIcon}</button>
                <button class="btn-edit-cat custom-action-btn">✏️</button>
                <button class="btn-del-cat custom-action-btn" style="color:#ef4444">🗑️</button>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="cat-click">
                <h3>${escapeHTML(category.name)} ${category.pinned ? '<span class="pinned-badge">Pinned</span>' : ''}</h3>
            </div>
            ${adminActions}
        `;

        card.querySelector(".cat-click").addEventListener("click", () => openCategory(category.id));

        if (isAdmin) {
            card.querySelector(".btn-pin-cat")?.addEventListener("click", e => { e.stopPropagation(); togglePinCategory(category.id); });
            card.querySelector(".btn-edit-cat")?.addEventListener("click", e => { e.stopPropagation(); editCategory(category.id); });
            card.querySelector(".btn-del-cat")?.addEventListener("click", e => { e.stopPropagation(); deleteCategory(category.id); });
        }

        list.appendChild(card);
    });

    updateAdminUI();
}

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
    if (!name) return showToast("Category Name লিখুন");

    if (editingItem) {
        editingItem.name = name;
        editingItem = null;
    } else {
        database.categories.push({
            id: generateId("cat"),
            name: name,
            parentId: currentCategoryId ? currentCategoryId : null,
            pinned: false,
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
    if (!confirm("আপনি কি নিশ্চিত এই Category মুছে ফেলতে চান?")) return;
    database.categories = database.categories.filter(c => c.id !== id && c.parentId !== id);
    database.headers = database.headers.filter(h => h.categoryId !== id);
    database.data = database.data.filter(d => d.categoryId !== id);
    await saveDatabase();
    refreshCurrentView();
    showToast("ডিলিট করা হয়েছে");
}

/* ---------------- Header Actions ---------------- */
function openHeaderModal(editObj = null) {
    if (window.currentUserRole !== "admin") return;
    editingItem = editObj;
    const input = document.getElementById("headerNameInput");
    input.value = editObj ? editObj.title : "";
    openModal("headerModal");
}

async function saveHeader() {
    if (window.currentUserRole !== "admin") return;
    const title = document.getElementById("headerNameInput")?.value.trim();
    if (!title || !currentCategoryId) return;

    if (editingItem) {
        editingItem.title = title;
        editingItem = null;
    } else {
        database.headers.push({
            id: generateId("header"),
            categoryId: currentCategoryId,
            title: title
        });
    }

    await saveDatabase();
    closeModal("headerModal");
    renderCategoryDetails();
    showToast("Header সেভ করা হয়েছে");
}

function editHeader(id) {
    const h = database.headers.find(item => item.id === id);
    if (h) openHeaderModal(h);
}

async function deleteHeader(id) {
    if (!confirm("এই Header ডিলিট করতে চান? ডাটাগুলো সরানো হবে না।")) return;
    database.headers = database.headers.filter(h => h.id !== id);
    database.data.forEach(d => { if (d.headerId === id) d.headerId = null; });
    await saveDatabase();
    renderCategoryDetails();
    showToast("Header ডিলিট করা হয়েছে");
}

/* ---------------- Data Item Render & Actions ---------------- */
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
        ? `<img src="${photo}" alt="${name}" class="data-card-avatar">`
        : `<div class="data-card-avatar">👤</div>`;

    const pinIcon = item.pinned ? "📌" : "📍";

    const adminActions = isAdmin ? `
        <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
            <button class="btn-pin-data custom-action-btn" title="পিন">${pinIcon}</button>
            <button class="btn-move-data custom-action-btn" title="মুভ">📦</button>
            <button class="btn-edit-data custom-action-btn" title="এডিট">✏️</button>
            <button class="btn-del-data custom-action-btn" style="color:#ef4444" title="ডিলিট">🗑️</button>
        </div>
    ` : '';

    dataEl.innerHTML = `
        ${avatarHtml}
        <div class="data-card-info">
            <div class="data-card-name">${name} ${item.pinned ? '📌' : ''}</div>
            <div class="data-card-detail">📱 মোবাইল: ${mobile}</div>
            <div class="data-card-detail">☎️ টেলিফোন: ${phone}</div>
            <div class="data-card-detail">💼 পদবী: ${designation}</div>
        </div>
        ${adminActions}
    `;

    dataEl.addEventListener("click", () => openDataPage(item.id));

    if (isAdmin) {
        dataEl.querySelector(".btn-pin-data")?.addEventListener("click", e => { e.stopPropagation(); togglePinData(item.id); });
        dataEl.querySelector(".btn-move-data")?.addEventListener("click", e => { e.stopPropagation(); openMoveDataModal(item.id); });
        dataEl.querySelector(".btn-edit-data")?.addEventListener("click", e => { e.stopPropagation(); editData(item.id); });
        dataEl.querySelector(".btn-del-data")?.addEventListener("click", e => { e.stopPropagation(); deleteData(item.id); });
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
        database.headers.filter(h => h.categoryId === currentCategoryId).forEach(h => {
            select.innerHTML += `<option value="${h.id}" ${editObj?.headerId === h.id ? 'selected' : ''}>${escapeHTML(h.title)}</option>`;
        });
    }

    openModal("dataModal");
}

async function saveData() {
    if (window.currentUserRole !== "admin") return;

    if (editingItem) {
        editingItem.photo = document.getElementById("dataPhoto")?.value.trim() || "";
        editingItem.name = document.getElementById("dataName")?.value.trim() || "";
        editingItem.mobile = document.getElementById("dataMobile")?.value.trim() || "";
        editingItem.phone = document.getElementById("dataPhone")?.value.trim() || "";
        editingItem.designation = document.getElementById("dataDesignation")?.value.trim() || "";
        editingItem.email = document.getElementById("dataEmail")?.value.trim() || "";
        editingItem.currentOffice = document.getElementById("dataCurrentOffice")?.value.trim() || "";
        editingItem.permanentAddress = document.getElementById("dataPermanentAddress")?.value.trim() || "";
        editingItem.adminInfo = document.getElementById("dataAdminInfo")?.value.trim() || "";
        editingItem.headerId = document.getElementById("dataHeaderSelect")?.value || null;
        editingItem = null;
    } else {
        database.data.push({
            id: generateId("data"),
            categoryId: currentCategoryId,
            photo: document.getElementById("dataPhoto")?.value.trim() || "",
            name: document.getElementById("dataName")?.value.trim() || "",
            mobile: document.getElementById("dataMobile")?.value.trim() || "",
            phone: document.getElementById("dataPhone")?.value.trim() || "",
            designation: document.getElementById("dataDesignation")?.value.trim() || "",
            email: document.getElementById("dataEmail")?.value.trim() || "",
            currentOffice: document.getElementById("dataCurrentOffice")?.value.trim() || "",
            permanentAddress: document.getElementById("dataPermanentAddress")?.value.trim() || "",
            adminInfo: document.getElementById("dataAdminInfo")?.value.trim() || "",
            headerId: document.getElementById("dataHeaderSelect")?.value || null,
            pinned: false
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
    if (!confirm("আপনি কি এই Data মুছে ফেলতে চান?")) return;
    database.data = database.data.filter(d => d.id !== id);
    await saveDatabase();
    refreshCurrentView();
    showToast("ডাটা ডিলিট করা হয়েছে");
}

async function togglePinData(id) {
    const item = database.data.find(d => d.id === id);
    if (item) {
        item.pinned = !item.pinned;
        await saveDatabase();
        refreshCurrentView();
        showToast(item.pinned ? "ডাটা পিন করা হয়েছে" : "ডাটা আনপিন করা হয়েছে");
    }
}

/* ---------------- Data Move System ---------------- */
function openMoveDataModal(id) {
    movingDataId = id;
    const catSelect = document.getElementById("moveCategorySelect");
    const headSelect = document.getElementById("moveHeaderSelect");

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
        database.headers.filter(h => h.categoryId === catId).forEach(h => {
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
        await saveDatabase();
        closeModal("moveDataModal");
        refreshCurrentView();
        showToast("ডাটা সফলভাবে মুভ করা হয়েছে!");
    }
}

/* ---------------- Render Details & Navigations ---------------- */
function openCategory(id, pushHistory = true) {
    if (pushHistory) history.pushState({ page: "category", categoryId: id }, "");
    showCategoryView(id);
}

function showCategoryView(id) {
    const category = database.categories.find(item => item.id === id);
    if (!category) return;

    currentCategoryId = id;
    currentDataId = null;
    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    document.getElementById("detailsTitle").textContent = category.name;
    const headersCount = database.headers.filter(h => h.categoryId === id).length;
    const dataCount = database.data.filter(d => d.categoryId === id).length;
    document.getElementById("detailsSubtitle").textContent = `${headersCount} Header • ${dataCount} Data`;

    renderCategoryDetails(document.getElementById("searchInput")?.value.trim().toLowerCase());
}

function showMainDashboardView(updateHistory = true) {
    currentCategoryId = null;
    currentDataId = null;
    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("mainDashboardView")?.classList.remove("hidden");

    renderCategories(document.getElementById("searchInput")?.value.trim().toLowerCase());
}

function refreshCurrentView() {
    if (currentDataId) showDataPage(currentDataId, false);
    else if (currentCategoryId) showCategoryView(currentCategoryId);
    else showMainDashboardView(false);
}

function renderCategoryDetails(searchVal = "") {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";
    const isAdmin = window.currentUserRole === "admin";

    let subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);
    if (searchVal) subCategories = subCategories.filter(sub => sub.name.toLowerCase().includes(searchVal));

    if (subCategories.length > 0) {
        const subWrapper = document.createElement("div");
        subWrapper.style.marginBottom = "20px";

        subCategories.forEach(sub => {
            const item = document.createElement("div");
            item.className = "subcategory-card";

            const adminActions = isAdmin ? `
                <div>
                    <button class="btn-edit-sub custom-action-btn">✏️</button>
                    <button class="btn-del-sub custom-action-btn" style="color:#ef4444">🗑️</button>
                </div>
            ` : '';

            item.innerHTML = `<div class="sub-click"><h3>${escapeHTML(sub.name)}</h3></div>${adminActions}`;
            item.querySelector(".sub-click").addEventListener("click", () => openCategory(sub.id));
            if (isAdmin) {
                item.querySelector(".btn-edit-sub")?.addEventListener("click", () => editCategory(sub.id));
                item.querySelector(".btn-del-sub")?.addEventListener("click", () => deleteCategory(sub.id));
            }
            subWrapper.appendChild(item);
        });
        container.appendChild(subWrapper);
    }

    const headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    let categoryData = database.data.filter(d => d.categoryId === currentCategoryId);

    // পিন করা ডাটাগুলো সবার উপরে রেন্ডার করার সর্টিং
    categoryData.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    if (searchVal) {
        categoryData = categoryData.filter(d => 
            (d.name && d.name.toLowerCase().includes(searchVal)) ||
            (d.mobile && d.mobile.toLowerCase().includes(searchVal)) ||
            (d.phone && d.phone.toLowerCase().includes(searchVal)) ||
            (d.designation && d.designation.toLowerCase().includes(searchVal))
        );
    }

    headers.forEach(header => {
        const headerItems = categoryData.filter(d => d.headerId === header.id);
        if (!searchVal || headerItems.length > 0 || header.title.toLowerCase().includes(searchVal)) {
            const headerBox = document.createElement("div");
            headerBox.className = "header-box";

            const adminActions = isAdmin ? `
                <div>
                    <button class="btn-edit-head custom-action-btn">✏️</button>
                    <button class="btn-del-head custom-action-btn" style="color:#ef4444">🗑️</button>
                </div>
            ` : '';

            headerBox.innerHTML = `
                <div class="header-banner">
                    <span>${escapeHTML(header.title)}</span>
                    ${adminActions}
                </div>
            `;

            if (isAdmin) {
                headerBox.querySelector(".btn-edit-head")?.addEventListener("click", () => editHeader(header.id));
                headerBox.querySelector(".btn-del-head")?.addEventListener("click", () => deleteHeader(header.id));
            }

            headerItems.forEach(item => headerBox.appendChild(createDataCardElement(item)));
            container.appendChild(headerBox);
        }
    });

    const noHeaderData = categoryData.filter(d => !d.headerId);
    if (noHeaderData.length > 0) {
        const noHeaderBox = document.createElement("div");
        noHeaderBox.className = "header-box";
        noHeaderBox.innerHTML = `<div class="header-banner"><span>📄 সাধারণ Data</span></div>`;

        noHeaderData.forEach(item => noHeaderBox.appendChild(createDataCardElement(item)));
        container.appendChild(noHeaderBox);
    }

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
    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.remove("hidden");

    const container = document.getElementById("dataPageContent");
    if (!container) return;

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
        ? `<img src="${photo}" alt="${name}" class="details-avatar-large">`
        : `<div class="details-avatar-large">👤</div>`;

    container.innerHTML = `
        <div class="details-header-section">
            <div class="avatar-wrapper">${avatarHtml}</div>
            <h2 style="font-size: 22px; font-weight: 700;">${name}</h2>
            <p style="color: var(--text-muted); font-size: 15px;">${designation}</p>
        </div>

        <div class="quick-action-grid">
            <a href="${item.mobile ? 'tel:' + item.mobile : '#'}" id="btnMobileCall" class="action-btn-round btn-call-round">📱 মোবাইল</a>
            <a href="${item.phone ? 'tel:' + item.phone : '#'}" id="btnPhoneCall" class="action-btn-round btn-phone-round">☎️ টেলিফোন</a>
            <a href="${item.email ? 'mailto:' + item.email : '#'}" class="action-btn-round btn-email-round">✉️ ইমেইল</a>
            <button id="btnShareContact" class="action-btn-round btn-share-round">🔗 শেয়ার কন্টাক্ট</button>
        </div>

        <div class="details-info-list">
            <div class="details-info-box"><div class="info-label">📱 মোবাইল</div><div class="info-value">${mobile}</div></div>
            <div class="details-info-box"><div class="info-label">☎️ টেলিফোন</div><div class="info-value">${phone}</div></div>
            <div class="details-info-box"><div class="info-label">💼 পদবী</div><div class="info-value">${designation}</div></div>
            <div class="details-info-box"><div class="info-label">✉️ ই-মেইল</div><div class="info-value">${email}</div></div>
            ${currentOffice ? `<div class="details-info-box"><div class="info-label">🏢 বর্তমান ঠিকানা</div><div class="info-value">${currentOffice}</div></div>` : ''}
            ${permanentAddress ? `<div class="details-info-box"><div class="info-label">🏠 স্থায়ী ঠিকানা</div><div class="info-value">${permanentAddress}</div></div>` : ''}
            ${adminInfo ? `<div class="details-info-box" style="border-left: 4px solid #f59e0b;"><div class="info-label">📝 প্রশাসনিক তথ্য</div><div class="info-value">${adminInfo}</div></div>` : ''}
        </div>
    `;

    setupLongPressWhatsApp(document.getElementById("btnMobileCall"), item.mobile);
    setupLongPressWhatsApp(document.getElementById("btnPhoneCall"), item.phone);

    document.getElementById("btnShareContact")?.addEventListener("click", () => {
        const shareText = `👤 নাম: ${item.name || ''}\n📱 মোবাইল: ${item.mobile || ''}\n☎️ টেলিফোন: ${item.phone || ''}\n✉️ ইমেইল: ${item.email || ''}\n💼 পদবী: ${item.designation || ''}`;
        if (navigator.share) {
            navigator.share({ title: item.name, text: shareText }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareText);
            showToast("কন্টাক্ট কপি করা হয়েছে!");
        }
    });
}

function setupLongPressWhatsApp(element, num) {
    if (!element || !num) return;
    let timer = null;
    const start = () => {
        timer = setTimeout(() => {
            const cleanNum = num.replace(/[^\d+]/g, '');
            window.open(`https://wa.me/${cleanNum}`, '_blank');
        }, 800);
    };
    const cancel = () => { if (timer) clearTimeout(timer); };

    element.addEventListener("mousedown", start);
    element.addEventListener("touchstart", start);
    element.addEventListener("mouseup", cancel);
    element.addEventListener("touchend", cancel);
    element.addEventListener("mouseleave", cancel);
}

function openModal(id) { document.getElementById(id)?.classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id)?.classList.add("hidden"); }

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}
