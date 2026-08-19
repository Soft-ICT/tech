import { auth, db, subscribeToDatabase } from "./firebase.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, push, set, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Global Variables
let currentCategoryId = null;
let currentDataId = null;
let allCategoriesData = {};

// DOM elements
const mainDashboardView = document.getElementById("mainDashboardView");
const categoryDetailsView = document.getElementById("categoryDetailsView");
const dataDetailsView = document.getElementById("dataDetailsView");
const categoryList = document.getElementById("categoryList");
const emptyState = document.getElementById("emptyState");
const categoryCount = document.getElementById("categoryCount");

document.addEventListener("DOMContentLoaded", () => {
    initAuthListener();
    loadCategoriesData();
    setupEventListeners();
});

// Auth Listener
function initAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.body.classList.add("is-admin");
        } else {
            document.body.classList.remove("is-admin");
        }
    });
}

// Data Fetching
function loadCategoriesData() {
    subscribeToDatabase("categories", (data) => {
        allCategoriesData = data || {};
        renderCategoriesList(allCategoriesData);

        if (currentCategoryId && allCategoriesData[currentCategoryId]) {
            renderCategoryDetailsPage(currentCategoryId);
        }
    });
}

// Render Categories List
function renderCategoriesList(categories) {
    if (!categoryList) return;
    categoryList.innerHTML = "";
    
    const keys = Object.keys(categories);
    if (categoryCount) categoryCount.textContent = `${keys.length}টি Category`;

    if (keys.length === 0) {
        if (emptyState) emptyState.classList.remove("hidden");
        categoryList.classList.add("hidden");
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    categoryList.classList.remove("hidden");

    keys.forEach((id) => {
        const cat = categories[id];
        const card = document.createElement("div");
        card.className = "category-card";

        let itemCount = 0;
        if (cat.data) itemCount += Object.keys(cat.data).length;
        if (cat.headers) {
            Object.values(cat.headers).forEach(h => {
                if (h.data) itemCount += Object.keys(h.data).length;
            });
        }

        card.innerHTML = `
            <div class="cat-info">
                <h3>${cat.name || "Unnamed"}</h3>
                <p>${itemCount}টি ডাটা এন্ট্রি</p>
            </div>
            <div class="cat-actions admin-only">
                <button class="delete-cat-btn icon-btn-sm danger">🗑️</button>
            </div>
        `;

        card.querySelector(".cat-info").addEventListener("click", () => openCategoryDetails(id));
        const delBtn = card.querySelector(".delete-cat-btn");
        if (delBtn) {
            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteCategory(id);
            });
        }

        categoryList.appendChild(card);
    });
}

function openCategoryDetails(catId) {
    currentCategoryId = catId;
    renderCategoryDetailsPage(catId);
    
    mainDashboardView.classList.add("hidden");
    categoryDetailsView.classList.remove("hidden");
    dataDetailsView.classList.add("hidden");
}

function renderCategoryDetailsPage(catId) {
    const cat = allCategoriesData[catId];
    if (!cat) return;

    const detailsTitle = document.getElementById("detailsTitle");
    const detailsContent = document.getElementById("detailsContent");

    if (detailsTitle) detailsTitle.textContent = cat.name;
    if (detailsContent) detailsContent.innerHTML = "";

    // 1. Direct Data Render
    if (cat.data) {
        const directGroup = document.createElement("div");
        directGroup.className = "data-group";
        Object.keys(cat.data).forEach(dataId => {
            directGroup.appendChild(createDataCard(cat.data[dataId], dataId, catId, null));
        });
        detailsContent.appendChild(directGroup);
    }

    // 2. Header & Headered Data Render
    if (cat.headers) {
        Object.keys(cat.headers).forEach(headerId => {
            const headerObj = cat.headers[headerId];
            const headerSection = document.createElement("div");
            headerSection.className = "header-section";
            
            headerSection.innerHTML = `
                <div class="header-title-bar">
                    <h2>📌 ${headerObj.name}</h2>
                    <button class="del-header-btn icon-btn-sm danger admin-only">🗑️</button>
                </div>
            `;

            const delHeaderBtn = headerSection.querySelector(".del-header-btn");
            if(delHeaderBtn) {
                delHeaderBtn.addEventListener("click", () => deleteHeader(catId, headerId));
            }

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
}

function createDataCard(item, dataId, catId, headerId) {
    const card = document.createElement("div");
    card.className = "data-card";
    
    card.innerHTML = `
        <div class="data-card-body">
            <img src="${item.photo || 'https://via.placeholder.com/60'}" class="avatar" alt="photo" onerror="this.src='https://via.placeholder.com/60'">
            <div class="data-text">
                <h4>${item.name || 'নাম নেই'}</h4>
                <p>💼 ${item.designation || 'পদবী নেই'}</p>
                <p>📞 ${item.mobile || 'নম্বর নেই'}</p>
            </div>
        </div>
        <div class="data-card-actions admin-only">
            <button class="del-data-btn icon-btn-sm danger">🗑️</button>
        </div>
    `;

    card.querySelector(".data-card-body").addEventListener("click", () => openDataDetails(catId, headerId, dataId));
    const delDataBtn = card.querySelector(".del-data-btn");
    if(delDataBtn) {
        delDataBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteData(catId, headerId, dataId);
        });
    }

    return card;
}

function openDataDetails(catId, headerId, dataId) {
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
            <img src="${item.photo || 'https://via.placeholder.com/120'}" class="profile-avatar" onerror="this.src='https://via.placeholder.com/120'">
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
}

function setupEventListeners() {
    const backToMainBtn = document.getElementById("backToMainBtn");
    if (backToMainBtn) {
        backToMainBtn.addEventListener("click", () => {
            currentCategoryId = null;
            categoryDetailsView.classList.add("hidden");
            mainDashboardView.classList.remove("hidden");
        });
    }

    const backFromDataBtn = document.getElementById("backFromDataBtn");
    if (backFromDataBtn) {
        backFromDataBtn.addEventListener("click", () => {
            dataDetailsView.classList.add("hidden");
            if (currentCategoryId) {
                categoryDetailsView.classList.remove("hidden");
            } else {
                mainDashboardView.classList.remove("hidden");
            }
        });
    }

    // Modal Actions
    const saveCategoryBtn = document.getElementById("saveCategoryBtn");
    if (saveCategoryBtn) saveCategoryBtn.addEventListener("click", saveCategory);

    const saveHeaderBtn = document.getElementById("saveHeaderBtn");
    if (saveHeaderBtn) saveHeaderBtn.addEventListener("click", saveHeader);

    const saveDataBtn = document.getElementById("saveDataBtn");
    if (saveDataBtn) saveDataBtn.addEventListener("click", saveData);
}

// Database Actions
function saveCategory() {
    const input = document.getElementById("categoryNameInput");
    const name = input ? input.value.trim() : "";
    if (!name) return alert("ক্যাটাগরির নাম দিন");

    push(ref(db, "categories"), { name: name })
        .then(() => {
            if (input) input.value = "";
            document.getElementById("categoryModal")?.classList.add("hidden");
        });
}

function saveHeader() {
    const input = document.getElementById("headerNameInput");
    const name = input ? input.value.trim() : "";
    if (!name || !currentCategoryId) return alert("Header এর নাম দিন");

    push(ref(db, `categories/${currentCategoryId}/headers`), { name: name })
        .then(() => {
            if (input) input.value = "";
            document.getElementById("headerModal")?.classList.add("hidden");
        });
}

function saveData() {
    if (!currentCategoryId) return;

    const dataObj = {
        photo: document.getElementById("dataPhoto")?.value.trim() || "",
        name: document.getElementById("dataName")?.value.trim() || "",
        mobile: document.getElementById("dataMobile")?.value.trim() || "",
        phone: document.getElementById("dataPhone")?.value.trim() || "",
        designation: document.getElementById("dataDesignation")?.value.trim() || "",
        email: document.getElementById("dataEmail")?.value.trim() || "",
        currentOffice: document.getElementById("dataCurrentOffice")?.value.trim() || "",
        permanentAddress: document.getElementById("dataPermanentAddress")?.value.trim() || "",
        adminInfo: document.getElementById("dataAdminInfo")?.value.trim() || ""
    };

    const selectedHeader = document.getElementById("dataHeaderSelect")?.value;
    let targetPath = `categories/${currentCategoryId}/data`;
    if (selectedHeader) {
        targetPath = `categories/${currentCategoryId}/headers/${selectedHeader}/data`;
    }

    push(ref(db, targetPath), dataObj)
        .then(() => {
            document.getElementById("dataModal")?.classList.add("hidden");
        });
}

function deleteCategory(catId) {
    if (confirm("Category মুছে ফেলতে চান?")) {
        remove(ref(db, `categories/${catId}`));
    }
}

function deleteHeader(catId, headerId) {
    if (confirm("Header মুছে ফেলতে চান?")) {
        remove(ref(db, `categories/${catId}/headers/${headerId}`));
    }
}

function deleteData(catId, headerId, dataId) {
    if (confirm("Data মুছে ফেলতে চান?")) {
        let path = `categories/${catId}/data/${dataId}`;
        if (headerId && headerId !== 'null' && headerId !== '') {
            path = `categories/${catId}/headers/${headerId}/data/${dataId}`;
        }
        remove(ref(db, path));
    }
}
