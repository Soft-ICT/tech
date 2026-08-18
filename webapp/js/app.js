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
        loginForm.style.display = isAdmin ? "none" : "block";
    }

    if (logoutContainer) {
        if (isAdmin) logoutContainer.classList.remove("hidden");
        else logoutContainer.classList.add("hidden");
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

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {
    document.getElementById("themeBtn")?.addEventListener("click", toggleTheme);
    document.getElementById("searchBtn")?.addEventListener("click", toggleSearch);
    document.getElementById("clearSearch")?.addEventListener("click", clearSearch);
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
   NAVIGATION
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

function refreshCurrentView() {
    if (currentCategoryId) {
        renderCategoryDetails();
    } else {
        renderCategories();
    }
}

/* =========================================================
   CATEGORY CRUD & RENDER
========================================================= */

function openCategoryModal(isSubCategory = false) {
    if (window.currentUserRole !== "admin") return;
    const title = document.getElementById("categoryModalTitle");
    if (title) title.textContent = isSubCategory ? "নতুন Sub-Category" : "নতুন Category";

    const input = document.getElementById("categoryNameInput");
    if (input) input.value = "";

    openModal("categoryModal");
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

    refreshCurrentView();
    showToast("Category সেভ করা হয়েছে");
}

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

        const adminActions = isAdmin ? `
            <div class="action-btn-group">
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

/* =========================================================
   CATEGORY DETAILS & DATA CARDS (Category Like View)
========================================================= */

function renderCategoryDetails() {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";
    const isAdmin = window.currentUserRole === "admin";

    // Subcategories
    const subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);
    if (subCategories.length > 0) {
        const subWrapper = document.createElement("div");
        subWrapper.style.marginBottom = "20px";
        subWrapper.innerHTML = `<h4 style="color:#003358;margin-bottom:12px;">📂 Sub-Categories</h4>`;

        subCategories.forEach(sub => {
            const item = document.createElement("div");
            item.className = "subcategory-card";

            const adminActions = isAdmin ? `
                <div class="action-btn-group">
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
                item.querySelector(".btn-edit-sub").addEventListener("click", () => editCategory(sub.id));
                item.querySelector(".btn-del-sub").addEventListener("click", () => deleteCategory(sub.id));
            }

            subWrapper.appendChild(item);
        });

        container.appendChild(subWrapper);
    }

    // Headers & Data
    const headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    const categoryData = database.data.filter(d => d.categoryId === currentCategoryId);

    headers.forEach(header => {
        const headerBox = document.createElement("div");
        headerBox.className = "header-box";

        const adminActions = isAdmin ? `
            <div style="display:flex;gap:6px">
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
            headerBox.querySelector(".btn-edit-head").addEventListener("click", () => editHeader(header.id));
            headerBox.querySelector(".btn-del-head").addEventListener("click", () => deleteHeader(header.id));
        }

        const headerItems = categoryData.filter(d => d.headerId === header.id);
        headerItems.forEach(item => {
            headerBox.appendChild(createDataCardElement(item));
        });

        container.appendChild(headerBox);
    });

    // Orphan Data
    const noHeaderData = categoryData.filter(d => !d.headerId);
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

    updateAdminUI();
}

/* =========================================================
   CREATE DATA CARD ELEMENT (Category Card Like Style)
========================================================= */

function createDataCardElement(item) {
    const isAdmin = window.currentUserRole === "admin";
    const dataEl = document.createElement("div");
    dataEl.className = "data-card-item";

    const name = escapeHTML(item.name || "নাম পাওয়া যায়নি");
    const designation = escapeHTML(item.designation || "");
    const mobile = escapeHTML(item.mobile || "");
    const phone = escapeHTML(item.phone || "");
    const photo = item.photo ? escapeHTML(item.photo) : null;

    // ছবির HTML
    const avatarHtml = photo 
        ? `<img src="${photo}" alt="${name}" class="data-card-avatar" onerror="this.onerror=null;this.replaceWith(document.createElement('div'));this.innerText='👤';">`
        : `<div class="data-card-avatar">👤</div>`;

    const adminActions = isAdmin ? `
        <div style="display:flex;gap:5px;" onclick="event.stopPropagation()">
            <button class="btn-move-data custom-action-btn" title="Move">📦</button>
            <button class="btn-edit-data custom-action-btn" title="Edit">✏️</button>
            <button class="btn-del-data custom-action-btn" style="color:red" title="Delete">🗑️</button>
        </div>
    ` : '';

    dataEl.innerHTML = `
        ${avatarHtml}
        <div style="flex-grow: 1;">
            <div style="font-size:16px; font-weight:bold;">${name}</div>
            <div style="font-size:13px; opacity: 0.85; margin-top:2px;">
                ${designation ? `<span>${designation}</span>` : ''}
                ${mobile ? ` | 📱 ${mobile}` : ''}
                ${phone ? ` | ☎️ ${phone}` : ''}
            </div>
        </div>
        ${adminActions}
    `;

    // ডাটা কার্ডে ক্লিক করলে মডাল ওপেন হবে
    dataEl.addEventListener("click", () => showDataDetailsModal(item));

    if (isAdmin) {
        dataEl.querySelector(".btn-move-data")?.addEventListener("click", e => {
            e.stopPropagation();
            openMoveModal(item.id);
        });
        dataEl.querySelector(".btn-edit-data")?.addEventListener("click", e => {
            e.stopPropagation();
            editData(item.id);
        });
        dataEl.querySelector(".btn-del-data")?.addEventListener("click", e => {
            e.stopPropagation();
            deleteData(item.id);
        });
    }

    return dataEl;
}

/* =========================================================
   POPUP FULL DETAILS MODAL
========================================================= */

function showDataDetailsModal(item) {
    const modalBody = document.getElementById("detailsModalBody");
    if (!modalBody) return;

    const name = escapeHTML(item.name || "");
    const designation = escapeHTML(item.designation || "");
    const mobile = escapeHTML(item.mobile || "");
    const phone = escapeHTML(item.phone || "");
    const email = escapeHTML(item.email || "");
    const currentOffice = escapeHTML(item.currentOffice || "");
    const permanentAddress = escapeHTML(item.permanentAddress || "");
    const adminInfo = escapeHTML(item.adminInfo || "");
    const photo = item.photo ? escapeHTML(item.photo) : null;

    const avatarHtml = photo 
        ? `<img src="${photo}" alt="${name}" class="details-avatar">`
        : `<div class="details-avatar" style="text-align:center; line-height:90px; font-size:40px;">👤</div>`;

    const mobileLink = mobile ? `<a href="tel:${mobile}" style="color: #2563eb; text-decoration: none; font-weight: 600;">📞 ${mobile}</a>` : 'নাই';
    const phoneLink = phone ? `<a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">☎️ ${phone}</a>` : 'নাই';
    const emailLink = email ? `<a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">✉️ ${email}</a>` : 'নাই';

    modalBody.innerHTML = `
        ${avatarHtml}
        <h2 style="text-align:center; margin-bottom:15px;">${name}</h2>
        <div style="display:flex; flex-direction:column; gap:8px; font-size:14px; line-height:1.5;">
            ${designation ? `<p><strong>পদবী:</strong> ${designation}</p>` : ''}
            <p><strong>মোবাইল:</strong> ${mobileLink}</p>
            <p><strong>টেলিফোন:</strong> ${phoneLink}</p>
            <p><strong>ই-মেইল:</strong> ${emailLink}</p>
            ${currentOffice ? `<p><strong>বর্তমান ঠিকানা/কর্মস্থল:</strong> ${currentOffice}</p>` : ''}
            ${permanentAddress ? `<p><strong>স্থায়ী ঠিকানা:</strong> ${permanentAddress}</p>` : ''}
            ${adminInfo ? `<p><strong>প্রশাসনিক তথ্য:</strong> ${adminInfo}</p>` : ''}
        </div>
    `;

    openModal("dataDetailsModal");
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
        title: title
    });

    await saveDatabase();
    closeModal("headerModal");
    renderCategoryDetails();
    showToast("Header সেভ করা হয়েছে");
}

/* =========================================================
   DATA CRUD
========================================================= */

function openDataModal() {
    if (window.currentUserRole !== "admin") return;
    editingDataId = null;

    document.getElementById("dataPhoto").value = "";
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

    const photo = document.getElementById("dataPhoto")?.value.trim() || "";
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
            item.photo = photo;
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
            photo: photo,
            name: name,
            designation: designation,
            mobile: mobile,
            phone: phone,
            email: email,
            currentOffice: currentOffice,
            permanentAddress: permanentAddress,
            adminInfo: adminInfo
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

    document.getElementById("dataPhoto").value = item.photo || "";
    document.getElementById("dataName").value = item.name || "";
    document.getElementById("dataDesignation").value = item.designation || "";
    document.getElementById("dataMobile").value = item.mobile || "";
    document.getElementById("dataPhone").value = item.phone || "";
    document.getElementById("dataEmail").value = item.email || "";
    document.getElementById("dataCurrentOffice").value = item.currentOffice || "";
    document.getElementById("dataPermanentAddress").value = item.permanentAddress || "";
    document.getElementById("dataAdminInfo").value = item.adminInfo || "";

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
