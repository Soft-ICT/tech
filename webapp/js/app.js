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

/* ব্যাক বাটন নেভিগেশন (ফোনের ব্যাক বাটন নিখুঁত কাজ করার জন্য) */
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

    /* সর্বজনীন ডাইনামিক সার্চ সিস্টেম */
    document.getElementById("searchInput")?.addEventListener("input", handleSearch);

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
    document.getElementById("addHeaderBtn")?.addEventListener("click", openHeaderModal);
    document.getElementById("addDataBtn")?.addEventListener("click", openDataModal);

    /* কোডের ব্যাক বাটন */
    document.getElementById("backToMainBtn")?.addEventListener("click", () => history.back());
    document.getElementById("backFromDataBtn")?.addEventListener("click", () => history.back());

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
}

function handleSearch() {
    const searchVal = document.getElementById("searchInput")?.value.trim().toLowerCase();
    
    if (currentCategoryId) {
        renderCategoryDetails(searchVal);
    } else {
        renderCategories(searchVal);
    }
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
    currentDataId = null;
    document.getElementById("mainDashboardView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("categoryDetailsView")?.classList.remove("hidden");

    const title = document.getElementById("detailsTitle");
    const subtitle = document.getElementById("detailsSubtitle");

    if (title) title.textContent = category.name;
    const headersCount = database.headers.filter(h => h.categoryId === id).length;
    const dataCount = database.data.filter(d => d.categoryId === id).length;

    if (subtitle) subtitle.textContent = `${headersCount} Header • ${dataCount} Data`;

    const searchVal = document.getElementById("searchInput")?.value.trim().toLowerCase();
    renderCategoryDetails(searchVal);
}

function showMainDashboardView(updateHistory = true) {
    currentCategoryId = null;
    currentDataId = null;

    document.getElementById("categoryDetailsView")?.classList.add("hidden");
    document.getElementById("dataDetailsView")?.classList.add("hidden");
    document.getElementById("mainDashboardView")?.classList.remove("hidden");

    const searchVal = document.getElementById("searchInput")?.value.trim().toLowerCase();
    renderCategories(searchVal);
}

function refreshCurrentView() {
    if (currentDataId) {
        showDataPage(currentDataId, false);
    } else if (currentCategoryId) {
        showCategoryView(currentCategoryId);
    } else {
        showMainDashboardView(false);
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
            <button class="btn-edit-data custom-action-btn">✏️</button>
            <button class="btn-del-data custom-action-btn" style="color:#ef4444">🗑️</button>
        </div>
    ` : '';

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

        <!-- ৪টি বাটন: মোবাইল, টেলিফোন, ইমেইল, শেয়ার কন্টাক্ট -->
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

    /* লং-ক্লিক (Long Press) ফিচার যুক্ত করা */
    setupLongPressWhatsApp(document.getElementById("btnMobileCall"), item.mobile);
    setupLongPressWhatsApp(document.getElementById("btnPhoneCall"), item.phone);

    /* শেয়ার কন্টাক্ট অ্যাকশন */
    document.getElementById("btnShareContact")?.addEventListener("click", () => {
        const shareText = `👤 নাম: ${item.name || ''}\n📱 মোবাইল: ${item.mobile || ''}\n☎️ টেলিফোন: ${item.phone || ''}\n✉️ ইমেইল: ${item.email || ''}\n💼 পদবী: ${item.designation || ''}`;
        if (navigator.share) {
            navigator.share({
                title: item.name,
                text: shareText
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareText);
            showToast("কন্টাক্ট কপি করা হয়েছে!");
        }
    });
}

/* লং প্রেস ফাংশনালিটি */
function setupLongPressWhatsApp(element, num) {
    if (!element || !num) return;
    let timer = null;

    const start = () => {
        timer = setTimeout(() => {
            const cleanNum = num.replace(/[^\d+]/g, '');
            window.open(`https://wa.me/${cleanNum}`, '_blank');
        }, 800); // ৮০০ মি.সে লং ক্লিকে হোয়াটসঅ্যাপ খুলবে
    };

    const cancel = () => { if (timer) clearTimeout(timer); };

    element.addEventListener("mousedown", start);
    element.addEventListener("touchstart", start);
    element.addEventListener("mouseup", cancel);
    element.addEventListener("touchend", cancel);
    element.addEventListener("mouseleave", cancel);
}

function renderCategories(searchVal = "") {
    const list = document.getElementById("categoryList");
    const emptyState = document.getElementById("emptyState");
    const countElement = document.getElementById("categoryCount");

    if (!list || !emptyState) return;

    let categoriesToShow = database.categories.filter(cat => !cat.parentId);

    if (searchVal) {
        categoriesToShow = categoriesToShow.filter(cat => 
            String(cat.name).toLowerCase().includes(searchVal)
        );
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

function renderCategoryDetails(searchVal = "") {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";
    const isAdmin = window.currentUserRole === "admin";

    /* সাব-ক্যাটাগরি সার্চ ও রেন্ডার */
    let subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);
    if (searchVal) {
        subCategories = subCategories.filter(sub => sub.name.toLowerCase().includes(searchVal));
    }

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

    /* হেডার ও ডাটা ফিল্টার সার্ভিস */
    const headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    let categoryData = database.data.filter(d => d.categoryId === currentCategoryId);

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
        
        /* সার্চে মিল থাকলে বা সার্চ খালি থাকলে দেখাবে */
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
        headerId: document.getElementById("dataHeaderSelect")?.value || null
    };

    database.data.push(dataObj);

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
