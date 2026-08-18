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
        window.currentUserRole = role;
        if (adminBtn) adminBtn.textContent = "🚪 Logout";
    }

    renderCategoryDetails();
    renderCategories();
});

function toggleAdminState() {
    if (window.currentUserRole === "admin") {
        logoutAdmin().then(() => {
            showToast("Logged out successfully");
        });
    } else {
        openModal("loginModal");
    }
}

async function handleAdminLogin() {
    const passInput = document.getElementById("adminPassword");
    const password = passInput ? passInput.value : "";
    
    if (!password) {
        showToast("Password দিন!");
        return;
    }

    try {
        await loginAdmin(password);
        closeModal("loginModal");
        if (passInput) passInput.value = "";
        showToast("Admin Login সফল হয়েছে!");
    } catch (err) {
        showToast("ভুল Password!");
    }
}

/* =========================================================
   FIREBASE SYNC
========================================================= */

async function loadDatabase() {
    try {
        const dbRef = ref(db, "app_data");
        const snapshot = await get(dbRef);
        
        if (snapshot.exists()) {
            const val = snapshot.val();
            database = {
                categories: val.categories || [],
                headers: val.headers || [],
                data: val.data || []
            };
        } else {
            database = { categories: [], headers: [], data: [] };
        }
    } catch (error) {
        console.error("Firebase Load Error:", error);
        showToast("ডাটা লোড করতে সমস্যা হয়েছে!");
    }
}

async function saveDatabase() {
    if (window.currentUserRole !== "admin") {
        showToast("শুধুমাত্র Admin ডাটা সংরক্ষণ করতে পারবেন!");
        return;
    }
    
    try {
        const dbRef = ref(db, "app_data");
        await set(dbRef, database);
    } catch (error) {
        console.error("Firebase Save Error:", error);
        showToast("ডাটা সেভ করতে সমস্যা হয়েছে!");
    }
}

/* =========================================================
   INIT & EVENT LISTENERS
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    await loadDatabase();

    const addCatBtn = document.getElementById("addCategoryBtn");
    if (addCatBtn) addCatBtn.onclick = () => openCategoryModal();

    const saveCatBtn = document.getElementById("saveCategoryBtn");
    if (saveCatBtn) saveCatBtn.onclick = saveCategory;

    const saveHeadBtn = document.getElementById("saveHeaderBtn");
    if (saveHeadBtn) saveHeadBtn.onclick = saveHeader;

    const saveDataBtn = document.getElementById("saveDataBtn");
    if (saveDataBtn) saveDataBtn.onclick = saveData;

    const confirmMoveBtn = document.getElementById("confirmMoveBtn");
    if (confirmMoveBtn) confirmMoveBtn.onclick = confirmMoveData;

    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.oninput = handleSearch;

    const adminBtn = document.getElementById("adminLoginBtn");
    if (adminBtn) adminBtn.onclick = toggleAdminState;

    const submitLoginBtn = document.getElementById("submitLoginBtn");
    if (submitLoginBtn) submitLoginBtn.onclick = handleAdminLogin;

    const toggleSearchBtn = document.getElementById("toggleSearchBtn");
    if (toggleSearchBtn) toggleSearchBtn.onclick = toggleSearch;

    const clearSearchBtn = document.getElementById("clearSearchBtn");
    if (clearSearchBtn) clearSearchBtn.onclick = clearSearch;

    const menuBtn = document.getElementById("menuBtn");
    if (menuBtn) menuBtn.onclick = goBackToRoot;

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.onclick = () => closeModal(btn.getAttribute("data-close"));
    });

    renderCategories();
});

/* =========================================================
   NAVIGATION HELPERS
========================================================= */

function goBackToRoot() {
    currentCategoryId = null;

    const title = document.getElementById("pageTitle");
    const sub = document.getElementById("pageSubTitle");
    const menuBtn = document.getElementById("menuBtn");

    if (title) title.textContent = "Dashboard";
    if (sub) sub.textContent = "Categories";
    if (menuBtn) menuBtn.classList.add("hidden");

    renderCategories();
}

function openCategory(catId) {
    currentCategoryId = catId;
    renderCategoryDetails();
}

/* =========================================================
   SEARCH
========================================================= */

function handleSearch() {
    const query = document.getElementById("searchInput")?.value.toLowerCase().trim();
    if (!query) {
        if (currentCategoryId) renderCategoryDetails();
        else renderCategories();
        return;
    }

    if (!currentCategoryId) {
        const filtered = database.categories.filter(c =>
            c.name.toLowerCase().includes(query)
        );
        renderCategoryCards(filtered);
    } else {
        renderCategoryDetails(query);
    }
}

/* =========================================================
   RENDER CATEGORIES
========================================================= */

function renderCategories() {
    const container = document.getElementById("categoryContainer");
    if (!container) return;
    container.innerHTML = "";

    const addCatBtn = document.getElementById("addCategoryBtn");
    const menuBtn = document.getElementById("menuBtn");

    if (addCatBtn) {
        if (window.currentUserRole === "admin") addCatBtn.classList.remove("hidden");
        else addCatBtn.classList.add("hidden");
    }

    if (menuBtn) menuBtn.classList.add("hidden");

    const rootCategories = database.categories.filter(c => !c.parentId);
    renderCategoryCards(rootCategories);
}

function renderCategoryCards(categories) {
    const container = document.getElementById("categoryContainer");
    if (!container) return;
    container.innerHTML = "";

    if (categories.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📁</div><p>কোনো Category পাওয়া যায়নি</p></div>`;
        return;
    }

    categories.forEach(cat => {
        const card = document.createElement("div");
        card.className = "category-card";

        const subCount = database.categories.filter(c => c.parentId === cat.id).length;
        const dataCount = database.data.filter(d => d.categoryId === cat.id).length;

        let adminActions = "";
        if (window.currentUserRole === "admin") {
            adminActions = `
                <div class="action-btn-group" onclick="event.stopPropagation()">
                    <button class="custom-action-btn" title="Edit Category" onclick="editCategory('${cat.id}')">✏️</button>
                    <button class="custom-action-btn" title="Delete Category" onclick="deleteCategory('${cat.id}')">🗑️</button>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="category-top">
                <div class="category-icon">📁</div>
                <div class="category-info">
                    <div class="category-name">${escapeHTML(cat.name)}</div>
                    <div class="category-meta">${subCount} Subcategories | ${dataCount} Items</div>
                </div>
            </div>
            ${adminActions}
        `;

        card.onclick = () => openCategory(cat.id);
        container.appendChild(card);
    });
}

/* =========================================================
   RENDER CATEGORY DETAILS
========================================================= */

function renderCategoryDetails(searchQuery = "") {
    if (!currentCategoryId) return;

    const currentCat = database.categories.find(c => c.id === currentCategoryId);
    if (!currentCat) {
        goBackToRoot();
        return;
    }

    const title = document.getElementById("pageTitle");
    const sub = document.getElementById("pageSubTitle");
    const menuBtn = document.getElementById("menuBtn");
    const addCatBtn = document.getElementById("addCategoryBtn");

    if (title) title.textContent = currentCat.name;
    if (sub) sub.textContent = "Details & Subcategories";
    if (menuBtn) menuBtn.classList.remove("hidden");

    if (addCatBtn) {
        if (window.currentUserRole === "admin") addCatBtn.classList.remove("hidden");
        else addCatBtn.classList.add("hidden");
    }

    const container = document.getElementById("categoryContainer");
    if (!container) return;
    container.innerHTML = "";

    // Subcategories Render
    const subCategories = database.categories.filter(c => c.parentId === currentCategoryId);
    if (subCategories.length > 0) {
        const subTitle = document.createElement("h3");
        subTitle.style.cssText = "grid-column: 1/-1; margin: 10px 0 5px; font-size: 16px;";
        subTitle.textContent = "Subcategories";
        container.appendChild(subTitle);

        subCategories.forEach(sub => {
            const item = document.createElement("div");
            item.className = "subcategory-card";

            let adminActions = "";
            if (window.currentUserRole === "admin") {
                adminActions = `
                    <div class="action-btn-group" onclick="event.stopPropagation()">
                        <button class="custom-action-btn" title="Edit Subcategory" onclick="editCategory('${sub.id}')">✏️</button>
                        <button class="custom-action-btn" title="Delete Subcategory" onclick="deleteCategory('${sub.id}')">🗑️</button>
                    </div>
                `;
            }

            item.innerHTML = `
                <div style="flex-grow:1;cursor:pointer;display:flex;align-items:center;height:100%;" class="sub-click">
                    <h3 style="margin:0;font-size:18px;font-weight:600;color:#ffffff">${escapeHTML(sub.name)}</h3>
                </div>
                ${adminActions}
            `;

            item.querySelector(".sub-click").onclick = () => openCategory(sub.id);
            container.appendChild(item);
        });
    }

    // Toolbar (Add Header / Add Data Buttons)
    if (window.currentUserRole === "admin") {
        const toolbar = document.createElement("div");
        toolbar.className = "section-toolbar";
        toolbar.style.cssText = "grid-column: 1/-1; display:flex; gap:10px; margin-bottom:15px;";

        toolbar.innerHTML = `
            <button class="secondary-btn" onclick="openHeaderModal()">+ New Header</button>
            <button class="primary-btn" onclick="openDataModal()">+ Add Data</button>
        `;
        container.appendChild(toolbar);
    }

    // Headers & Data Render
    let catHeaders = database.headers.filter(h => h.categoryId === currentCategoryId);
    let catData = database.data.filter(d => d.categoryId === currentCategoryId);

    if (searchQuery) {
        catHeaders = catHeaders.filter(h => h.title.toLowerCase().includes(searchQuery));
        catData = catData.filter(d => 
            (d.name && d.name.toLowerCase().includes(searchQuery)) ||
            (d.designation && d.designation.toLowerCase().includes(searchQuery)) ||
            (d.mobile && d.mobile.toLowerCase().includes(searchQuery))
        );
    }

    // Sort Headers
    catHeaders.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Render Headers with Data
    catHeaders.forEach(header => {
        const headerBox = document.createElement("div");
        headerBox.className = "header-box";
        headerBox.style.cssText = "grid-column: 1/-1; margin-bottom: 20px;";

        let adminActions = "";
        if (window.currentUserRole === "admin") {
            adminActions = `
                <div class="action-btn-group">
                    <button class="custom-action-btn" title="Edit Header" onclick="editHeader('${header.id}')">✏️</button>
                    <button class="custom-action-btn" title="Delete Header" onclick="deleteHeader('${header.id}')">🗑️</button>
                </div>
            `;
        }

        headerBox.innerHTML = `
            <div class="header-banner">
                <h5>${escapeHTML(header.title)}</h5>
                ${adminActions}
            </div>
            <div id="header-data-${header.id}" class="header-data-list"></div>
        `;

        container.appendChild(headerBox);

        const headerDataContainer = headerBox.querySelector(`#header-data-${header.id}`);
        const headerItems = catData.filter(d => d.headerId === header.id);

        renderDataItems(headerItems, headerDataContainer);
    });

    // Render Header-less Data
    const orphanData = catData.filter(d => !d.headerId);
    if (orphanData.length > 0) {
        const orphanBox = document.createElement("div");
        orphanBox.style.cssText = "grid-column: 1/-1;";
        
        if (catHeaders.length > 0) {
            const orphanTitle = document.createElement("h4");
            orphanTitle.style.cssText = "margin: 15px 0 10px; color: var(--muted);";
            orphanTitle.textContent = "General Data (Without Header)";
            orphanBox.appendChild(orphanTitle);
        }

        renderDataItems(orphanData, orphanBox);
        container.appendChild(orphanBox);
    }
}

/* =========================================================
   RENDER DATA ITEMS (Updated for 8 Fields & Dial Action)
========================================================= */

function renderDataItems(items, targetContainer) {
    if (!items || items.length === 0) return;

    // Pin logic sort
    items.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (a.pinOrder || 0) - (b.pinOrder || 0);
    });

    items.forEach(item => {
        const dataItem = document.createElement("div");
        dataItem.className = "data-card-item";

        let adminActions = "";
        if (window.currentUserRole === "admin") {
            adminActions = `
                <div class="action-btn-group">
                    <button class="custom-action-btn" title="${item.pinned ? 'Unpin' : 'Pin'}" onclick="togglePinData('${item.id}')">${item.pinned ? '📌' : '📍'}</button>
                    <button class="custom-action-btn" title="Move Data" onclick="openMoveDataModal('${item.id}')">➡️</button>
                    <button class="custom-action-btn" title="Edit Data" onclick="editData('${item.id}')">✏️</button>
                    <button class="custom-action-btn" title="Delete Data" onclick="deleteData('${item.id}')">🗑️</button>
                </div>
            `;
        }

        const name = escapeHTML(item.name || "");
        const designation = escapeHTML(item.designation || "");
        const mobile = escapeHTML(item.mobile || "");
        const phone = escapeHTML(item.phone || "");
        const email = escapeHTML(item.email || "");
        const currentOffice = escapeHTML(item.currentOffice || "");
        const permanentAddress = escapeHTML(item.permanentAddress || "");
        const adminInfo = escapeHTML(item.adminInfo || "");

        // ডায়াল লিঙ্ক তৈরি
        const mobileLink = mobile ? `<a href="tel:${mobile}" style="color: #2563eb; text-decoration: none; font-weight: 600;">📞 ${mobile}</a>` : '';
        const phoneLink = phone ? `<a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">☎️ ${phone}</a>` : '';
        const emailLink = email ? `<a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">✉️ ${email}</a>` : '';

        dataItem.innerHTML = `
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

        targetContainer.appendChild(dataItem);
    });
}

/* =========================================================
   CATEGORY CRUD
========================================================= */

let editingCategoryId = null;

window.openCategoryModal = function() {
    if (window.currentUserRole !== "admin") return;
    editingCategoryId = null;

    const titleEl = document.getElementById("categoryModalTitle");
    const titleInput = document.getElementById("categoryTitle");
    const parentSelect = document.getElementById("parentCategorySelect");

    if (titleEl) titleEl.textContent = "Category তৈরি করুন";
    if (titleInput) titleInput.value = "";

    if (parentSelect) {
        parentSelect.innerHTML = '<option value="">Root Category</option>';
        database.categories.forEach(c => {
            if (c.id !== currentCategoryId) {
                parentSelect.innerHTML += `<option value="${c.id}">${escapeHTML(c.name)}</option>`;
            }
        });
        parentSelect.value = currentCategoryId || "";
    }

    openModal("categoryModal");
};

window.editCategory = function(catId) {
    if (window.currentUserRole !== "admin") return;
    const cat = database.categories.find(c => c.id === catId);
    if (!cat) return;

    editingCategoryId = catId;

    const titleEl = document.getElementById("categoryModalTitle");
    const titleInput = document.getElementById("categoryTitle");
    const parentSelect = document.getElementById("parentCategorySelect");

    if (titleEl) titleEl.textContent = "Category এডিট করুন";
    if (titleInput) titleInput.value = cat.name;

    if (parentSelect) {
        parentSelect.innerHTML = '<option value="">Root Category</option>';
        database.categories.forEach(c => {
            if (c.id !== catId) {
                parentSelect.innerHTML += `<option value="${c.id}">${escapeHTML(c.name)}</option>`;
            }
        });
        parentSelect.value = cat.parentId || "";
    }

    openModal("categoryModal");
};

async function saveCategory() {
    if (window.currentUserRole !== "admin") return;
    const nameInput = document.getElementById("categoryTitle");
    const parentSelect = document.getElementById("parentCategorySelect");

    const name = nameInput?.value.trim();
    const parentId = parentSelect?.value || null;

    if (!name) {
        showToast("Category এর নাম দিন");
        return;
    }

    if (editingCategoryId) {
        const cat = database.categories.find(c => c.id === editingCategoryId);
        if (cat) {
            cat.name = name;
            cat.parentId = parentId;
        }
    } else {
        const newCat = {
            id: Date.now().toString(),
            name: name,
            parentId: parentId
        };
        database.categories.push(newCat);
    }

    await saveDatabase();
    closeModal("categoryModal");

    if (currentCategoryId) renderCategoryDetails();
    else renderCategories();

    showToast("Category সফলভাবে সেভ করা হয়েছে");
}

window.deleteCategory = async function(catId) {
    if (window.currentUserRole !== "admin") return;
    if (!confirm("আপনি কি নিশ্চিত এই Category ডিলেট করতে চান?")) return;

    database.categories = database.categories.filter(c => c.id !== catId && c.parentId !== catId);
    database.headers = database.headers.filter(h => h.categoryId !== catId);
    database.data = database.data.filter(d => d.categoryId !== catId);

    await saveDatabase();

    if (currentCategoryId === catId) goBackToRoot();
    else if (currentCategoryId) renderCategoryDetails();
    else renderCategories();

    showToast("Category ডিলেট করা হয়েছে");
};

/* =========================================================
   HEADER CRUD
========================================================= */

let editingHeaderId = null;

window.openHeaderModal = function() {
    if (window.currentUserRole !== "admin") return;
    editingHeaderId = null;

    const titleEl = document.getElementById("headerModalTitle");
    const input = document.getElementById("headerTitleInput");

    if (titleEl) titleEl.textContent = "Header তৈরি করুন";
    if (input) input.value = "";

    openModal("headerModal");
};

window.editHeader = function(headerId) {
    if (window.currentUserRole !== "admin") return;
    const h = database.headers.find(item => item.id === headerId);
    if (!h) return;

    editingHeaderId = headerId;

    const titleEl = document.getElementById("headerModalTitle");
    const input = document.getElementById("headerTitleInput");

    if (titleEl) titleEl.textContent = "Header এডিট করুন";
    if (input) input.value = h.title;

    openModal("headerModal");
};

async function saveHeader() {
    if (window.currentUserRole !== "admin") return;
    const input = document.getElementById("headerTitleInput");
    const title = input?.value.trim();

    if (!title) {
        showToast("Header Title দিন");
        return;
    }

    if (editingHeaderId) {
        const h = database.headers.find(item => item.id === editingHeaderId);
        if (h) h.title = title;
    } else {
        const newHeader = {
            id: Date.now().toString(),
            categoryId: currentCategoryId,
            title: title,
            order: database.headers.filter(h => h.categoryId === currentCategoryId).length
        };
        database.headers.push(newHeader);
    }

    await saveDatabase();
    closeModal("headerModal");
    renderCategoryDetails();
    showToast("Header সেভ করা হয়েছে");
}

window.deleteHeader = async function(headerId) {
    if (window.currentUserRole !== "admin") return;
    if (!confirm("Header মুছে ফেললে এর ভেতরের Data সাধারণ লিস্টে চলে যাবে। মুছে ফেলতে চান?")) return;

    database.headers = database.headers.filter(h => h.id !== headerId);
    database.data.forEach(d => {
        if (d.headerId === headerId) d.headerId = null;
    });

    await saveDatabase();
    renderCategoryDetails();
    showToast("Header মুছে ফেলা হয়েছে");
};

/* =========================================================
   DATA CRUD (Updated with 8 Fields)
========================================================= */

let editingDataId = null;

window.openDataModal = function() {
    if (window.currentUserRole !== "admin") return;
    editingDataId = null;

    const titleEl = document.getElementById("dataModalTitle");
    if (titleEl) titleEl.textContent = "Data যোগ করুন";

    // Clear all fields
    document.getElementById("dataName").value = "";
    document.getElementById("dataDesignation").value = "";
    document.getElementById("dataMobile").value = "";
    document.getElementById("dataPhone").value = "";
    document.getElementById("dataEmail").value = "";
    document.getElementById("dataCurrentOffice").value = "";
    document.getElementById("dataPermanentAddress").value = "";
    document.getElementById("dataAdminInfo").value = "";

    populateHeaderSelect();
    openModal("dataModal");
};

window.editData = function(dataId) {
    if (window.currentUserRole !== "admin") return;
    const item = database.data.find(d => d.id === dataId);
    if (!item) return;

    editingDataId = dataId;

    const titleEl = document.getElementById("dataModalTitle");
    if (titleEl) titleEl.textContent = "Data এডিট করুন";

    // Set values to fields
    document.getElementById("dataName").value = item.name || "";
    document.getElementById("dataDesignation").value = item.designation || "";
    document.getElementById("dataMobile").value = item.mobile || "";
    document.getElementById("dataPhone").value = item.phone || "";
    document.getElementById("dataEmail").value = item.email || "";
    document.getElementById("dataCurrentOffice").value = item.currentOffice || "";
    document.getElementById("dataPermanentAddress").value = item.permanentAddress || "";
    document.getElementById("dataAdminInfo").value = item.adminInfo || "";

    populateHeaderSelect(item.headerId);
    openModal("dataModal");
};

function populateHeaderSelect(selectedHeaderId = null) {
    const select = document.getElementById("dataHeaderSelect");
    if (!select) return;

    select.innerHTML = '<option value="">Header ছাড়া</option>';
    const catHeaders = database.headers.filter(h => h.categoryId === currentCategoryId);

    catHeaders.forEach(h => {
        select.innerHTML += `<option value="${h.id}">${escapeHTML(h.title)}</option>`;
    });

    select.value = selectedHeaderId || "";
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

    if (!name && !designation && !mobile) {
        showToast("কমপক্ষে নাম বা তথ্য প্রদান করুন");
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
            id: Date.now().toString(),
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
    showToast("Data সফলভাবে সেভ করা হয়েছে");
}

window.deleteData = async function(dataId) {
    if (window.currentUserRole !== "admin") return;
    if (!confirm("আপনি কি নিশ্চিত এই Data মুছে ফেলতে চান?")) return;

    database.data = database.data.filter(d => d.id !== dataId);

    await saveDatabase();
    renderCategoryDetails();
    showToast("Data মুছে ফেলা হয়েছে");
};

window.togglePinData = async function(dataId) {
    if (window.currentUserRole !== "admin") return;
    const item = database.data.find(d => d.id === dataId);
    if (!item) return;

    item.pinned = !item.pinned;
    if (item.pinned) {
        item.pinOrder = Date.now();
    } else {
        item.pinOrder = 0;
    }

    await saveDatabase();
    renderCategoryDetails();
    showToast(item.pinned ? "Data পিন করা হয়েছে" : "Data আনপিন করা হয়েছে");
};

/* =========================================================
   MOVE DATA LOGIC
========================================================= */

window.openMoveDataModal = function(dataId) {
    if (window.currentUserRole !== "admin") return;
    targetMoveDataId = dataId;

    const catSelect = document.getElementById("moveCategorySelect");
    const headSelect = document.getElementById("moveHeaderSelect");

    if (catSelect) {
        catSelect.innerHTML = "";
        database.categories.forEach(c => {
            catSelect.innerHTML += `<option value="${c.id}">${escapeHTML(c.name)}</option>`;
        });
        catSelect.value = currentCategoryId;

        catSelect.onchange = () => {
            populateMoveHeaders(catSelect.value);
        };
    }

    populateMoveHeaders(currentCategoryId);
    openModal("moveDataModal");
};

function populateMoveHeaders(catId) {
    const headSelect = document.getElementById("moveHeaderSelect");
    if (!headSelect) return;

    headSelect.innerHTML = '<option value="">Header ছাড়া</option>';
    const headers = database.headers.filter(h => h.categoryId === catId);

    headers.forEach(h => {
        headSelect.innerHTML += `<option value="${h.id}">${escapeHTML(h.title)}</option>`;
    });
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
