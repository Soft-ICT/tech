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
let targetMoveDataId = null;
let editingDataId = null;

window.currentUserRole = "guest";

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
        showMainDashboardView();
    } else if (state.page === "category") {
        showCategoryView(state.categoryId, false);
    } else if (state.page === "data") {
        showDataPage(state.dataId, false);
    }
}

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
    document.getElementById("searchBtn")?.addEventListener("click", () => document.getElementById("searchBox")?.classList.toggle("hidden"));
    document.getElementById("clearSearch")?.addEventListener("click", () => {
        const input = document.getElementById("searchInput");
        if (input) input.value = "";
        renderCategories();
    });
    document.getElementById("searchInput")?.addEventListener("input", renderCategories);

    document.getElementById("adminLoginBtn")?.addEventListener("click", () => openModal("loginModal"));

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
    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    const title = document.getElementById("detailsTitle");
    const subtitle = document.getElementById("detailsSubtitle");

    if (title) title.textContent = category.name;
    const headersCount = database.headers.filter(h => h.categoryId === id).length;
    const dataCount = database.data.filter(d => d.categoryId === id).length;

    if (subtitle) subtitle.textContent = `${headersCount} Header • ${dataCount} Data`;

    renderCategoryDetails();
}

function showMainDashboardView() {
    currentCategoryId = null;
    currentDataId = null;

    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("mainDashboardView")?.classList.remove("hidden");

    renderCategories();
}

function refreshCurrentView() {
    if (currentDataId) {
        showDataPage(currentDataId, false);
    } else if (currentCategoryId) {
        showCategoryView(currentCategoryId, false);
    } else {
        showMainDashboardView();
    }
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

    const avatarHtml = photo 
        ? `<img src="${photo}" alt="${name}" class="data-card-avatar">`
        : `<div class="data-card-avatar">👤</div>`;

    const adminActions = isAdmin ? `
        <div style="display:flex;gap:5px;" onclick="event.stopPropagation()">
            <button class="btn-move-data custom-action-btn">📦</button>
            <button class="btn-edit-data custom-action-btn">✏️</button>
            <button class="btn-del-data custom-action-btn" style="color:#ef4444">🗑️</button>
        </div>
    ` : '';

    /* নির্দিষ্ট সিরিয়াল: ১. নাম ➔ ২. মোবাইল ➔ ৩. টেলিফোন ➔ ৪. পদবী */
    dataEl.innerHTML = `
        ${avatarHtml}
        <div class="data-card-info">
            <div class="data-card-name">${name}</div>
            <div class="data-card-detail">📱 মোবাইল: ${mobile}</div>
            <div class="data-card-detail">☎️ টেলিফোন: ${phone}</div>
            <div class="data-card-detail">💼 পদবী: ${designation}</div>
        </div>
        ${adminActions}
    `;

    dataEl.addEventListener("click", () => openDataPage(item.id));

    if (isAdmin) {
        dataEl.querySelector(".btn-move-data")?.addEventListener("click", e => { e.stopPropagation(); openMoveModal(item.id); });
        dataEl.querySelector(".btn-edit-data")?.addEventListener("click", e => { e.stopPropagation(); editData(item.id); });
        dataEl.querySelector(".btn-del-data")?.addEventListener("click", e => { e.stopPropagation(); deleteData(item.id); });
    }

    return dataEl;
}

function openDataPage(dataId, pushHistory = true) {
    if (pushHistory) {
        history.pushState({ page: "data", dataId: dataId }, "");
    }
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
    const designation = escapeHTML(item.designation || "");
    const mobile = escapeHTML(item.mobile || "");
    const phone = escapeHTML(item.phone || "");
    const email = escapeHTML(item.email || "");
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
            ${designation ? `<p style="color: var(--text-muted); font-size: 15px;">${designation}</p>` : ''}
        </div>

        <div class="quick-action-grid">
            ${mobile ? `<a href="tel:${mobile}" class="action-btn-round btn-call-round">📞 কল করুন</a>` : ''}
            ${mobile ? `<a href="https://wa.me/${mobile.replace(/[^\d+]/g, '')}" target="_blank" class="action-btn-round btn-wa-round">💬 WhatsApp</a>` : ''}
            ${phone ? `<a href="tel:${phone}" class="action-btn-round btn-phone-round">☎️ টেলিফোন</a>` : ''}
            ${email ? `<a href="mailto:${email}" class="action-btn-round btn-email-round">✉️ Email</a>` : ''}
        </div>

        <div class="details-info-list">
            ${mobile ? `<div class="details-info-box"><div class="info-label">📱 মোবাইল</div><div class="info-value">${mobile}</div></div>` : ''}
            ${phone ? `<div class="details-info-box"><div class="info-label">☎️ টেলিফোন</div><div class="info-value">${phone}</div></div>` : ''}
            ${designation ? `<div class="details-info-box"><div class="info-label">💼 পদবী</div><div class="info-value">${designation}</div></div>` : ''}
            ${email ? `<div class="details-info-box"><div class="info-label">✉️ ই-মেইল</div><div class="info-value">${email}</div></div>` : ''}
            ${currentOffice ? `<div class="details-info-box"><div class="info-label">🏢 বর্তমান ঠিকানা</div><div class="info-value">${currentOffice}</div></div>` : ''}
            ${permanentAddress ? `<div class="details-info-box"><div class="info-label">🏠 স্থায়ী ঠিকানা</div><div class="info-value">${permanentAddress}</div></div>` : ''}
            ${adminInfo ? `<div class="details-info-box" style="border-left: 4px solid #f59e0b;"><div class="info-label">📝 প্রশাসনিক তথ্য</div><div class="info-value">${adminInfo}</div></div>` : ''}
        </div>
    `;
}

function renderCategories() {
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    const countElement = document.getElementById("categoryCount");

    if (!list || !emptyState) return;

    const searchVal = document.getElementById("searchInput")?.value.trim().toLowerCase();
    let categoriesToShow = database.categories.filter(cat => !cat.parentId);

    if (searchVal) {
        categoriesToShow = database.categories.filter(cat => String(cat.name).toLowerCase().includes(searchVal));
    }

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

        const adminActions = isAdmin ? `
            <div class="action-btn-group">
                <button class="btn-edit-cat custom-action-btn">✏️</button>
                <button class="btn-del-cat custom-action-btn" style="color:#ef4444">🗑️</button>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="cat-click">
                <h3>${escapeHTML(category.name)}</h3>
            </div>
            ${adminActions}
        `;

        card.querySelector(".cat-click").addEventListener("click", () => openCategory(category.id));
        
        if (isAdmin) {
            card.querySelector(".btn-edit-cat")?.addEventListener("click", e => { e.stopPropagation(); editCategory(category.id); });
            card.querySelector(".btn-del-cat")?.addEventListener("click", e => { e.stopPropagation(); deleteCategory(category.id); });
        }

        list.appendChild(card);
    });

    updateAdminUI();
}

function renderCategoryDetails() {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";
    const isAdmin = window.currentUserRole === "admin";

    const subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);
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

            item.innerHTML = `
                <div class="sub-click">
                    <h3>${escapeHTML(sub.name)}</h3>
                </div>
                ${adminActions}
            `;

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
    const categoryData = database.data.filter(d => d.categoryId === currentCategoryId);

    headers.forEach(header => {
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

        const headerItems = categoryData.filter(d => d.headerId === header.id);
        headerItems.forEach(item => headerBox.appendChild(createDataCardElement(item)));

        container.appendChild(headerBox);
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

function openCategoryModal(isSubCategory = false) {
    if (window.currentUserRole !== "admin") return;
    const title = document.getElementById("categoryModalTitle");
    if (title) title.textContent = isSubCategory ? "নতুন Sub-Category" : "নতুন Category";
    document.getElementById("categoryNameInput").value = "";
    openModal("categoryModal");
}

async function saveCategory() {
    if (window.currentUserRole !== "admin") return;
    const name = document.getElementById("categoryNameInput")?.value.trim();
    if (!name) return showToast("Category Name লিখুন");

    database.categories.push({
        id: generateId("cat"),
        name: name,
        parentId: currentCategoryId ? currentCategoryId : null,
        createdAt: Date.now()
    });

    await saveDatabase();
    closeModal("categoryModal");
    refreshCurrentView();
    showToast("Category সেভ করা হয়েছে");
}

function openHeaderModal() {
    if (window.currentUserRole !== "admin") return;
    document.getElementById("headerNameInput").value = "";
    openModal("headerModal");
}

async function saveHeader() {
    if (window.currentUserRole !== "admin") return;
    const title = document.getElementById("headerNameInput")?.value.trim();
    if (!title || !currentCategoryId) return;

    database.headers.push({
        id: generateId("header"),
        categoryId: currentCategoryId,
        title: title
    });

    await saveDatabase();
    closeModal("headerModal");
    renderCategoryDetails();
    showToast("Header সেভ করা হয়েছে");
}

function openDataModal() {
    if (window.currentUserRole !== "admin") return;
    editingDataId = null;

    ["dataPhoto", "dataName", "dataMobile", "dataPhone", "dataDesignation", "dataEmail", "dataCurrentOffice", "dataPermanentAddress", "dataAdminInfo"].forEach(id => {
        document.getElementById(id).value = "";
    });

    const select = document.getElementById("dataHeaderSelect");
    if (select) {
        select.innerHTML = `<option value="">Header ছাড়া</option>`;
        database.headers.filter(h => h.categoryId === currentCategoryId).forEach(h => {
            select.innerHTML += `<option value="${h.id}">${escapeHTML(h.title)}</option>`;
        });
    }

    openModal("dataModal");
}

async function saveData() {
    if (window.currentUserRole !== "admin") return;

    const dataObj = {
        photo: document.getElementById("dataPhoto")?.value.trim() || "",
        name: document.getElementById("dataName")?.value.trim() || "",
        mobile: document.getElementById("dataMobile")?.value.trim() || "",
        phone: document.getElementById("dataPhone")?.value.trim() || "",
        designation: document.getElementById("dataDesignation")?.value.trim() || "",
        email: document.getElementById("dataEmail")?.value.trim() || "",
        currentOffice: document.getElementById("dataCurrentOffice")?.value.trim() || "",
        permanentAddress: document.getElementById("dataPermanentAddress")?.value.trim() || "",
        adminInfo: document.getElementById("dataAdminInfo")?.value.trim() || "",
        headerId: document.getElementById("dataHeaderSelect")?.value || null
    };

    if (editingDataId) {
        const item = database.data.find(d => d.id === editingDataId);
        if (item) Object.assign(item, dataObj);
    } else {
        dataObj.id = generateId("data");
        dataObj.categoryId = currentCategoryId;
        database.data.push(dataObj);
    }

    await saveDatabase();
    closeModal("dataModal");
    refreshCurrentView();
    showToast("Data সেভ করা হয়েছে");
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
