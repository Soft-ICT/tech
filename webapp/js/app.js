import { auth, db, subscribeToDatabase } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    ref,
    push,
    set,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// ==========================================
// STATE MANAGEMENT
// ==========================================
let currentCategoryId = null;
let currentDataId = null;
let allCategoriesData = {};

// ==========================================
// DOM ELEMENTS
// ==========================================
const mainDashboardView = document.getElementById("mainDashboardView");
const categoryDetailsView = document.getElementById("categoryDetailsView");
const dataDetailsView = document.getElementById("dataDetailsView");

const categoryList = document.getElementById("categoryList");
const emptyState = document.getElementById("emptyState");
const categoryCount = document.getElementById("categoryCount");

const searchBox = document.getElementById("searchBox");
const searchInput = document.getElementById("searchInput");

// Modals
const loginModal = document.getElementById("loginModal");
const categoryModal = document.getElementById("categoryModal");
const headerModal = document.getElementById("headerModal");
const dataModal = document.getElementById("dataModal");
const moveDataModal = document.getElementById("moveDataModal");

// Toast
const toast = document.getElementById("toast");

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initAuthListener();
    initTheme();
    loadAllCategories();
    setupEventListeners();
});

// ==========================================
// AUTHENTICATION & ADMIN UI
// ==========================================
function initAuthListener() {
    onAuthStateChanged(auth, (user) => {
        const body = document.body;
        const loginFormContainer = document.getElementById("loginFormContainer");
        const logoutContainer = document.getElementById("logoutContainer");

        if (user) {
            body.classList.add("is-admin");
            if (loginFormContainer) loginFormContainer.classList.add("hidden");
            if (logoutContainer) logoutContainer.classList.remove("hidden");
        } else {
            body.classList.remove("is-admin");
            if (loginFormContainer) loginFormContainer.classList.remove("hidden");
            if (logoutContainer) logoutContainer.classList.add("hidden");
        }
    });
}

// ==========================================
// DATA LOADING (OFFLINE SUPPORTED)
// ==========================================
function loadAllCategories() {
    // subscribeToDatabase অফলাইন ও অনলাইন দুই অবস্থাতেই ডাটা রিটার্ন করবে
    subscribeToDatabase("categories", (data) => {
        allCategoriesData = data || {};
        renderCategoriesList(allCategoriesData);

        // যদি কোনো ক্যাটাগরি ডিটেইলস পেজ খোলা থাকে, সেটাও রিয়েলটাইমে আপডেট হবে
        if (currentCategoryId && allCategoriesData[currentCategoryId]) {
            renderCategoryDetailsPage(currentCategoryId);
        }
    });
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================
function renderCategoriesList(categories) {
    categoryList.innerHTML = "";
    const keys = Object.keys(categories);

    categoryCount.textContent = `${keys.length}টি Category`;

    if (keys.length === 0) {
        emptyState.classList.remove("hidden");
        categoryList.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    categoryList.classList.remove("hidden");

    keys.forEach((id) => {
        const cat = categories[id];
        const card = document.createElement("div");
        card.className = "category-card";
        
        // Data count calculation
        let itemCount = 0;
        if (cat.data) itemCount += Object.keys(cat.data).length;
        if (cat.headers) {
            Object.values(cat.headers).forEach(h => {
                if (h.data) itemCount += Object.keys(h.data).length;
            });
        }

        card.innerHTML = `
            <div class="cat-info" onclick="openCategoryDetails('${id}')">
                <h3>${cat.name || "Unnamed"}</h3>
                <p>${itemCount}টি ডাটা এন্ট্রি</p>
            </div>
            <div class="cat-actions admin-only">
                <button onclick="editCategory('${id}', '${cat.name}')" class="icon-btn-sm">✏️</button>
                <button onclick="deleteCategory('${id}')" class="icon-btn-sm danger">🗑️</button>
            </div>
        `;
        categoryList.appendChild(card);
    });
}

window.openCategoryDetails = function (catId) {
    currentCategoryId = catId;
    renderCategoryDetailsPage(catId);
    
    mainDashboardView.classList.add("hidden");
    categoryDetailsView.classList.remove("hidden");
    dataDetailsView.classList.add("hidden");
};

function renderCategoryDetailsPage(catId) {
    const cat = allCategoriesData[catId];
    if (!cat) return;

    document.getElementById("detailsTitle").textContent = cat.name;
    const detailsContent = document.getElementById("detailsContent");
    detailsContent.innerHTML = "";

    // 1. Unheadered Data Render
    if (cat.data) {
        const directDataGroup = document.createElement("div");
        directDataGroup.className = "data-group";
        Object.keys(cat.data).forEach(dataId => {
            directDataGroup.appendChild(createDataCard(cat.data[dataId], dataId, catId, null));
        });
        detailsContent.appendChild(directDataGroup);
    }

    // 2. Headers & Headered Data Render
    if (cat.headers) {
        Object.keys(cat.headers).forEach(headerId => {
            const headerObj = cat.headers[headerId];
            const headerSection = document.createElement("div");
            headerSection.className = "header-section";
            
            headerSection.innerHTML = `
                <div class="header-title-bar">
                    <h2>📌 ${headerObj.name}</h2>
                    <div class="admin-only">
                        <button onclick="deleteHeader('${catId}', '${headerId}')" class="icon-btn-sm danger">🗑️</button>
                    </div>
                </div>
            `;

            const dataGroup = document.createElement("div");
            dataGroup.className = "data-group";

            if (headerObj.data) {
                Object.keys(headerObj.data).forEach(dataId => {
                    dataGroup.appendChild(createDataCard(headerObj.data[dataId], dataId, catId, headerId));
                });
            }

            headerSection.appendChild(dataGroup);
            detailsContent.appendChild(headerSection);
        });
    }
};

function createDataCard(item, dataId, catId, headerId) {
    const card = document.createElement("div");
    card.className = "data-card";
    
    card.innerHTML = `
        <div class="data-card-body" onclick="openDataDetails('${catId}', '${headerId || ''}', '${dataId}')">
            <img src="${item.photo || 'https://via.placeholder.com/60'}" class="avatar" alt="photo" onerror="this.src='https://via.placeholder.com/60'">
            <div class="data-text">
                <h4>${item.name || 'নাম নেই'}</h4>
                <p>💼 ${item.designation || 'পদবী নেই'}</p>
                <p>📞 ${item.mobile || 'নম্বর নেই'}</p>
            </div>
        </div>
        <div class="data-card-actions admin-only">
            <button onclick="editData('${catId}', '${headerId || ''}', '${dataId}')" class="icon-btn-sm">✏️</button>
            <button onclick="openMoveModal('${catId}', '${headerId || ''}', '${dataId}')" class="icon-btn-sm">📦</button>
            <button onclick="deleteData('${catId}', '${headerId || ''}', '${dataId}')" class="icon-btn-sm danger">🗑️</button>
        </div>
    `;
    return card;
}

window.openDataDetails = function (catId, headerId, dataId) {
    currentDataId = dataId;
    let item = null;

    if (headerId && headerId !== 'null' && headerId !== '') {
        item = allCategoriesData[catId]?.headers?.[headerId]?.data?.[dataId];
    } else {
        item = allCategoriesData[catId]?.data?.[dataId];
    }

    if (!item) return;

    const dataPageContent = document.getElementById("dataPageContent");
    dataPageContent.innerHTML = `
        <div class="profile-header">
            <img src="${item.photo || 'https://via.placeholder.com/120'}" class="profile-avatar">
            <h2>${item.name || ''}</h2>
            <p class="badge">${item.designation || ''}</p>
        </div>
        <div class="profile-details">
            <p><strong>📱 মোবাইল:</strong> <a href="tel:${item.mobile}">${item.mobile || 'N/A'}</a></p>
            <p><strong>☎️ টেলিফোন:</strong> ${item.phone || 'N/A'}</p>
            <p><strong>✉️ ই-মেইল:</strong> <a href="mailto:${item.email}">${item.email || 'N/A'}</a></p>
            <p><strong>🏢 বর্তমান কর্মস্থল:</strong> ${item.currentOffice || 'N/A'}</p>
            <p><strong>🏠 স্থায়ী ঠিকানা:</strong> ${item.permanentAddress || 'N/A'}</p>
            <p><strong>📝 প্রশাসনিক তথ্য:</strong> ${item.adminInfo || 'N/A'}</p>
        </div>
    `;

    mainDashboardView.classList.add("hidden");
    categoryDetailsView.classList.add("hidden");
    dataDetailsView.classList.remove("hidden");
};

// ==========================================
// EVENT LISTENERS & MODAL HANDLERS
// ==========================================
function setupEventListeners() {
    // Navigation
    document.getElementById("backToMainBtn").addEventListener("click", () => {
        currentCategoryId = null;
        categoryDetailsView.classList.add("hidden");
        mainDashboardView.classList.remove("hidden");
    });

    document.getElementById("backFromDataBtn").addEventListener("click", () => {
        dataDetailsView.classList.add("hidden");
        if (currentCategoryId) {
            categoryDetailsView.classList.remove("hidden");
        } else {
            mainDashboardView.classList.remove("hidden");
        }
    });

    // Top Action Buttons
    document.getElementById("adminLoginBtn").addEventListener("click", () => showModal(loginModal));
    document.getElementById("addCategoryBtn").addEventListener("click", () => showModal(categoryModal));
    document.getElementById("emptyAddBtn").addEventListener("click", () => showModal(categoryModal));
    
    document.getElementById("addHeaderBtn").addEventListener("click", () => showModal(headerModal));
    document.getElementById("addDataBtn").addEventListener("click", () => {
        populateHeaderDropdown();
        showModal(dataModal);
    });

    // Close Modal Handler
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const modalId = e.target.getAttribute("data-close");
            hideModal(document.getElementById(modalId));
        });
    });

    // Admin Login/Logout Actions
    document.getElementById("submitLoginBtn").addEventListener("click", handleLogin);
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);

    // CRUD Save Actions
    document.getElementById("saveCategoryBtn").addEventListener("click", saveCategory);
    document.getElementById("saveHeaderBtn").addEventListener("click", saveHeader);
    document.getElementById("saveDataBtn").addEventListener("click", saveData);

    // Search Toggle
    document.getElementById("searchBtn").addEventListener("click", () => {
        searchBox.classList.toggle("hidden");
        if (!searchBox.classList.contains("hidden")) searchInput.focus();
    });

    document.getElementById("clearSearch").addEventListener("click", () => {
        searchInput.value = "";
        renderCategoriesList(allCategoriesData);
    });

    searchInput.addEventListener("input", handleSearch);
}

// ==========================================
// FIREBASE DATABASE WRITE ACTIONS
// ==========================================
function saveCategory() {
    const name = document.getElementById("categoryNameInput").value.trim();
    if (!name) return showToast("ক্যাটাগরির নাম লিখুন!");

    const newRef = push(ref(db, "categories"));
    set(newRef, { name: name })
        .then(() => {
            showToast("Category সফলভাবে যোগ হয়েছে");
            document.getElementById("categoryNameInput").value = "";
            hideModal(categoryModal);
        })
        .catch(err => showToast("ত্রুটি: " + err.message));
}

function saveHeader() {
    const name = document.getElementById("headerNameInput").value.trim();
    if (!name || !currentCategoryId) return showToast("Header নাম দিন!");

    const newRef = push(ref(db, `categories/${currentCategoryId}/headers`));
    set(newRef, { name: name })
        .then(() => {
            showToast("Header সফলভাবে যোগ হয়েছে");
            document.getElementById("headerNameInput").value = "";
            hideModal(headerModal);
        })
        .catch(err => showToast("ত্রুটি: " + err.message));
}

function saveData() {
    if (!currentCategoryId) return;

    const dataObj = {
        photo: document.getElementById("dataPhoto").value.trim(),
        name: document.getElementById("dataName").value.trim(),
        mobile: document.getElementById("dataMobile").value.trim(),
        phone: document.getElementById("dataPhone").value.trim(),
        designation: document.getElementById("dataDesignation").value.trim(),
        email: document.getElementById("dataEmail").value.trim(),
        currentOffice: document.getElementById("dataCurrentOffice").value.trim(),
        permanentAddress: document.getElementById("dataPermanentAddress").value.trim(),
        adminInfo: document.getElementById("dataAdminInfo").value.trim()
    };

    const selectedHeader = document.getElementById("dataHeaderSelect").value;
    let targetPath = `categories/${currentCategoryId}/data`;
    if (selectedHeader) {
        targetPath = `categories/${currentCategoryId}/headers/${selectedHeader}/data`;
    }

    const newRef = push(ref(db, targetPath));
    set(newRef, dataObj)
        .then(() => {
            showToast("Data সফলভাবে সংরক্ষণ করা হয়েছে");
            clearDataModalInputs();
            hideModal(dataModal);
        })
        .catch(err => showToast("ত্রুটি: " + err.message));
}

// Global Delete Handlers
window.deleteCategory = function (catId) {
    if (confirm("আপনি কি নিশ্চিত এই Category মুছে ফেলতে চান?")) {
        remove(ref(db, `categories/${catId}`))
            .then(() => showToast("Category ডিলিট করা হয়েছে"))
            .catch(err => showToast("ত্রুটি: " + err.message));
    }
};

window.deleteHeader = function (catId, headerId) {
    if (confirm("আপনি কি এই Header-টি মুছে ফেলতে চান?")) {
        remove(ref(db, `categories/${catId}/headers/${headerId}`))
            .then(() => showToast("Header ডিলিট করা হয়েছে"))
            .catch(err => showToast("ত্রুটি: " + err.message));
    }
};

window.deleteData = function (catId, headerId, dataId) {
    if (confirm("আপনি কি এই Data-টি মুছে ফেলতে চান?")) {
        let path = `categories/${catId}/data/${dataId}`;
        if (headerId && headerId !== 'null' && headerId !== '') {
            path = `categories/${catId}/headers/${headerId}/data/${dataId}`;
        }
        remove(ref(db, path))
            .then(() => showToast("Data ডিলিট করা হয়েছে"))
            .catch(err => showToast("ত্রুটি: " + err.message));
    }
};

// ==========================================
// UTILITY HELPERS
// ==========================================
function populateHeaderDropdown() {
    const select = document.getElementById("dataHeaderSelect");
    select.innerHTML = '<option value="">Header ছাড়া</option>';

    if (currentCategoryId && allCategoriesData[currentCategoryId]?.headers) {
        const headers = allCategoriesData[currentCategoryId].headers;
        Object.keys(headers).forEach(hId => {
            select.innerHTML += `<option value="${hId}">${headers[hId].name}</option>`;
        });
    }
}

function handleLogin() {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;
    
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            showToast("অ্যাডমিন লগইন সফল!");
            hideModal(loginModal);
        })
        .catch(err => showToast("লগইন ব্যর্থ: " + err.message));
}

function handleLogout() {
    signOut(auth).then(() => {
        showToast("লগআউট করা হয়েছে");
        hideModal(loginModal);
    });
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        renderCategoriesList(allCategoriesData);
        return;
    }

    const filtered = {};
    Object.keys(allCategoriesData).forEach(catId => {
        const cat = allCategoriesData[catId];
        if (cat.name.toLowerCase().includes(query)) {
            filtered[catId] = cat;
        }
    });

    renderCategoriesList(filtered);
}

function initTheme() {
    const themeBtn = document.getElementById("themeBtn");
    if (!themeBtn) return;
    
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        themeBtn.textContent = isDark ? "☀️" : "🌙";
    });
}

function showModal(modal) { modal.classList.remove("hidden"); }
function hideModal(modal) { modal.classList.add("hidden"); }

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function clearDataModalInputs() {
    ["dataPhoto", "dataName", "dataMobile", "dataPhone", "dataDesignation", "dataEmail", "dataCurrentOffice", "dataPermanentAddress", "dataAdminInfo"]
        .forEach(id => document.getElementById(id).value = "");
}
