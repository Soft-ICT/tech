import { watchAuth, logoutUser } from "./auth.js";
import {
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

"use strict";

/*
 * ============================================================
 *  ADMIN UID
 * ============================================================
 *
 * এখানে Firebase Authentication থেকে পাওয়া
 * মূল Admin-এর UID বসাও।
 */
const PRIMARY_ADMIN_UID = "YOUR_ADMIN_UID";


/*
 * ============================================================
 *  DATABASE
 * ============================================================
 */

let database = {
    categories: [],
    headers: [],
    data: []
};

let currentCategoryId = null;
let editingCategoryId = null;
let editingHeaderId = null;
let editingDataId = null;
let targetMoveDataId = null;


/*
 * ============================================================
 *  AUTH
 * ============================================================
 */

watchAuth(async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    window.currentUser = user;

    /*
     * Admin নির্ধারণ করা হচ্ছে UID দিয়ে।
     *
     * User-এর কোনো আলাদা profile প্রয়োজন নেই।
     */
    window.currentUserRole =
        user.uid === PRIMARY_ADMIN_UID ? "admin" : "user";


    /*
     * UI অনুযায়ী Admin/User mode
     */
    updateRoleUI();


    /*
     * Firebase থেকে Shared Data load
     */
    await loadDatabase();
});


/*
 * ============================================================
 *  DOM READY
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", () => {

    setupEvents();
    initTheme();

});


/*
 * ============================================================
 *  ROLE UI
 * ============================================================
 */

function updateRoleUI() {

    const isAdmin =
        window.currentUserRole === "admin";


    const adminElements = [
        "addCategoryBtn",
        "emptyAddBtn",
        "addSubCategoryBtn",
        "addHeaderBtn",
        "addDataBtn"
    ];


    adminElements.forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) return;

        element.style.display =
            isAdmin ? "" : "none";
    });


    /*
     * User-এর জন্য কোনো modal ব্যবহারযোগ্য থাকবে না
     */
    if (!isAdmin) {

        [
            "categoryModal",
            "headerModal",
            "dataModal",
            "moveDataModal"
        ].forEach(id => {

            const element =
                document.getElementById(id);

            if (element) {
                element.classList.add("hidden");
            }

        });

    }

}


/*
 * ============================================================
 *  LOAD SHARED DATABASE
 * ============================================================
 *
 * Admin এবং User দুজনেই একই Data দেখবে।
 *
 * Firebase path:
 *
 * webapp/shared_data
 *
 */

async function loadDatabase() {

    if (!window.currentUser) return;


    try {

        const snapshot =
            await get(
                ref(db, "webapp/shared_data")
            );


        if (snapshot.exists()) {

            const value =
                snapshot.val();


            database = {
                categories:
                    Array.isArray(value.categories)
                        ? value.categories
                        : [],

                headers:
                    Array.isArray(value.headers)
                        ? value.headers
                        : [],

                data:
                    Array.isArray(value.data)
                        ? value.data
                        : []
            };

        } else {

            database = {
                categories: [],
                headers: [],
                data: []
            };

        }


        currentCategoryId = null;

        renderCategories();


    } catch (error) {

        console.error(
            "Database load error:",
            error
        );

        showToast(
            "ডাটা লোড করা যায়নি"
        );

    }

}


/*
 * ============================================================
 *  SAVE SHARED DATABASE
 * ============================================================
 *
 * শুধু Main Admin লিখতে পারবে।
 *
 */

async function saveDatabase() {

    if (
        window.currentUserRole !== "admin"
    ) {

        showToast(
            "আপনার ডাটা পরিবর্তনের অনুমতি নেই"
        );

        return false;
    }


    try {

        await set(
            ref(
                db,
                "webapp/shared_data"
            ),
            database
        );


        showToast(
            "ডাটা সংরক্ষিত হয়েছে"
        );


        return true;


    } catch (error) {

        console.error(
            "Save error:",
            error
        );


        showToast(
            "ডাটা সেভ করতে সমস্যা হয়েছে"
        );


        return false;
    }

}


/*
 * ============================================================
 *  CATEGORY
 * ============================================================
 */

function openCategoryModal(categoryId = null) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    editingCategoryId =
        categoryId;


    const input =
        document.getElementById(
            "categoryNameInput"
        );


    const title =
        document.getElementById(
            "categoryModalTitle"
        );


    if (categoryId) {

        const category =
            database.categories.find(
                item =>
                    item.id === categoryId
            );


        if (!category) return;


        input.value =
            category.name || "";


        title.textContent =
            "Category পরিবর্তন করুন";

    } else {

        input.value = "";


        title.textContent =
            "নতুন Category";

    }


    openModal(
        "categoryModal"
    );
}


/*
 * Category save
 */

async function saveCategory() {

    if (
        window.currentUserRole !== "admin"
    ) return;


    const input =
        document.getElementById(
            "categoryNameInput"
        );


    const name =
        input.value.trim();


    if (!name) {

        showToast(
            "Category Name লিখুন"
        );

        return;
    }


    if (editingCategoryId) {

        const category =
            database.categories.find(
                item =>
                    item.id === editingCategoryId
            );


        if (category) {
            category.name = name;
        }


    } else {

        database.categories.push({

            id: generateId(
                "cat"
            ),

            name: name,

            parentId: null,

            createdAt:
                Date.now()

        });

    }


    if (
        await saveDatabase()
    ) {

        closeModal(
            "categoryModal"
        );

        editingCategoryId = null;

        renderCategories();
    }

}


/*
 * ============================================================
 *  CATEGORY LIST
 * ============================================================
 */

function renderCategories() {

    const list =
        document.getElementById(
            "categoryList"
        );


    const empty =
        document.getElementById(
            "emptyState"
        );


    const count =
        document.getElementById(
            "categoryCount"
        );


    if (!list) return;


    const categories =
        database.categories.filter(
            item =>
                !item.parentId
        );


    list.innerHTML = "";


    if (count) {

        count.textContent =
            `${categories.length}টি Category`;

    }


    if (
        categories.length === 0
    ) {

        if (empty) {
            empty.style.display = "";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    categories.forEach(
        category => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "category-card";


            card.innerHTML = `

                <div class="category-card-content">

                    <h3>
                        📂 ${escapeHtml(category.name)}
                    </h3>

                </div>

                <div class="category-actions">

                    <button
                        class="secondary-btn"
                        data-open-category="${category.id}">
                        Open
                    </button>

                    ${
                        window.currentUserRole === "admin"
                        ? `
                        <button
                            class="secondary-btn"
                            data-edit-category="${category.id}">
                            Edit
                        </button>

                        <button
                            class="secondary-btn"
                            data-delete-category="${category.id}">
                            Delete
                        </button>
                        `
                        : ""
                    }

                </div>
            `;


            list.appendChild(card);

        }
    );


    list.querySelectorAll(
        "[data-open-category]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openCategory(
                    button.dataset.openCategory
                );

            }
        );

    });


    if (
        window.currentUserRole === "admin"
    ) {

        list.querySelectorAll(
            "[data-edit-category]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openCategoryModal(
                        button.dataset.editCategory
                    );

                }
            );

        });


        list.querySelectorAll(
            "[data-delete-category]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteCategory(
                        button.dataset.deleteCategory
                    );

                }
            );

        });

    }

}


/*
 * ============================================================
 *  OPEN CATEGORY
 * ============================================================
 */

function openCategory(categoryId) {

    currentCategoryId =
        categoryId;


    renderCategoryDetails();

}


/*
 * ============================================================
 *  CATEGORY DETAILS
 * ============================================================
 */

function renderCategoryDetails() {

    const main =
        document.getElementById(
            "mainDashboardView"
        );


    const details =
        document.getElementById(
            "categoryDetailsView"
        );


    const title =
        document.getElementById(
            "detailsTitle"
        );


    const content =
        document.getElementById(
            "detailsContent"
        );


    if (
        !main ||
        !details ||
        !content
    ) return;


    const category =
        database.categories.find(
            item =>
                item.id === currentCategoryId
        );


    if (!category) {

        currentCategoryId = null;

        renderCategories();

        return;
    }


    main.classList.add(
        "hidden"
    );


    details.classList.remove(
        "hidden"
    );


    if (title) {

        title.textContent =
            category.name;

    }


    content.innerHTML = "";


    /*
     * Sub Categories
     */

    const subCategories =
        database.categories.filter(
            item =>
                item.parentId === category.id
        );


    if (
        subCategories.length
    ) {

        const subTitle =
            document.createElement(
                "h3"
            );


        subTitle.textContent =
            "Sub-Categories";


        content.appendChild(
            subTitle
        );


        subCategories.forEach(
            sub => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "category-card";


                div.innerHTML = `

                    <h3>
                        📁 ${escapeHtml(sub.name)}
                    </h3>

                    ${
                        window.currentUserRole === "admin"
                        ? `
                        <button
                            class="secondary-btn"
                            data-edit-category="${sub.id}">
                            Edit
                        </button>

                        <button
                            class="secondary-btn"
                            data-delete-category="${sub.id}">
                            Delete
                        </button>
                        `
                        : ""
                    }
                `;


                content.appendChild(div);

            }
        );

    }


    /*
     * Headers
     */

    const headers =
        database.headers.filter(
            header =>
                header.categoryId === category.id
        );


    headers.forEach(
        header => {

            const section =
                document.createElement(
                    "section"
                );


            section.className =
                "data-section";


            section.innerHTML = `

                <h3>
                    ${escapeHtml(header.name)}
                </h3>

            `;


            const headerData =
                database.data.filter(
                    item =>
                        item.categoryId === category.id &&
                        item.headerId === header.id
                );


            headerData.forEach(
                item => {

                    section.appendChild(
                        createDataElement(item)
                    );

                }
            );


            content.appendChild(
                section
            );

        }
    );


    /*
     * Data without Header
     */

    const noHeaderData =
        database.data.filter(
            item =>
                item.categoryId === category.id &&
                !item.headerId
        );


    if (
        noHeaderData.length
    ) {

        const section =
            document.createElement(
                "section"
            );


        section.innerHTML =
            "<h3>Data</h3>";


        noHeaderData.forEach(
            item => {

                section.appendChild(
                    createDataElement(item)
                );

            }
        );


        content.appendChild(
            section
        );

    }

}


/*
 * ============================================================
 *  CREATE DATA ELEMENT
 * ============================================================
 */

function createDataElement(item) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "data-card";


    element.innerHTML = `

        <h4>
            ${escapeHtml(item.title || "")}
        </h4>

        <p>
            ${escapeHtml(item.description || "")}
        </p>

        ${
            window.currentUserRole === "admin"
            ? `
            <div class="data-actions">

                <button
                    class="secondary-btn"
                    data-edit-data="${item.id}">
                    Edit
                </button>

                <button
                    class="secondary-btn"
                    data-delete-data="${item.id}">
                    Delete
                </button>

            </div>
            `
            : ""
        }

    `;


    if (
        window.currentUserRole === "admin"
    ) {

        const edit =
            element.querySelector(
                "[data-edit-data]"
            );


        const remove =
            element.querySelector(
                "[data-delete-data]"
            );


        edit?.addEventListener(
            "click",
            () => editData(item.id)
        );


        remove?.addEventListener(
            "click",
            () => deleteData(item.id)
        );

    }


    return element;
}


/*
 * ============================================================
 *  HEADER
 * ============================================================
 */

function openHeaderModal() {

    if (
        window.currentUserRole !== "admin"
    ) return;


    editingHeaderId = null;


    document.getElementById(
        "headerNameInput"
    ).value = "";


    openModal(
        "headerModal"
    );

}


async function saveHeader() {

    if (
        window.currentUserRole !== "admin"
    ) return;


    const input =
        document.getElementById(
            "headerNameInput"
        );


    const name =
        input.value.trim();


    if (!name) {

        showToast(
            "Header Name লিখুন"
        );

        return;
    }


    if (!currentCategoryId) {

        showToast(
            "প্রথমে Category নির্বাচন করুন"
        );

        return;
    }


    database.headers.push({

        id:
            generateId("header"),

        name: name,

        categoryId:
            currentCategoryId,

        createdAt:
            Date.now()

    });


    if (
        await saveDatabase()
    ) {

        closeModal(
            "headerModal"
        );

        renderCategoryDetails();

    }

}


/*
 * ============================================================
 *  DATA
 * ============================================================
 */

function openDataModal(dataId = null) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    editingDataId =
        dataId;


    const titleInput =
        document.getElementById(
            "dataTitleInput"
        );


    const descriptionInput =
        document.getElementById(
            "dataDescriptionInput"
        );


    if (dataId) {

        const item =
            database.data.find(
                data =>
                    data.id === dataId
            );


        if (!item) return;


        titleInput.value =
            item.title || "";


        descriptionInput.value =
            item.description || "";

    } else {

        titleInput.value = "";

        descriptionInput.value = "";

    }


    populateHeaderSelect();


    openModal(
        "dataModal"
    );

}


function populateHeaderSelect() {

    const select =
        document.getElementById(
            "dataHeaderSelect"
        );


    if (!select) return;


    select.innerHTML =
        `<option value="">Header ছাড়া</option>`;


    database.headers
        .filter(
            header =>
                header.categoryId === currentCategoryId
        )
        .forEach(
            header => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    header.id;


                option.textContent =
                    header.name;


                select.appendChild(
                    option
                );

            }
        );

}


async function saveData() {

    if (
        window.currentUserRole !== "admin"
    ) return;


    if (!currentCategoryId) {

        showToast(
            "Category নির্বাচন করুন"
        );

        return;
    }


    const title =
        document.getElementById(
            "dataTitleInput"
        ).value.trim();


    const description =
        document.getElementById(
            "dataDescriptionInput"
        ).value.trim();


    const headerId =
        document.getElementById(
            "dataHeaderSelect"
        ).value;


    if (!title) {

        showToast(
            "Data Title লিখুন"
        );

        return;
    }


    if (editingDataId) {

        const item =
            database.data.find(
                data =>
                    data.id === editingDataId
            );


        if (item) {

            item.title =
                title;

            item.description =
                description;

            item.headerId =
                headerId || null;

        }

    } else {

        database.data.push({

            id:
                generateId("data"),

            title:
                title,

            description:
                description,

            categoryId:
                currentCategoryId,

            headerId:
                headerId || null,

            createdAt:
                Date.now()

        });

    }


    if (
        await saveDatabase()
    ) {

        closeModal(
            "dataModal"
        );

        editingDataId = null;

        renderCategoryDetails();

    }

}


/*
 * ============================================================
 *  EDIT DATA
 * ============================================================
 */

function editData(id) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    openDataModal(id);

}


/*
 * ============================================================
 *  DELETE CATEGORY
 * ============================================================
 */

async function deleteCategory(id) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    if (
        !confirm(
            "এই Category এবং এর Data মুছে ফেলবেন?"
        )
    ) return;


    database.categories =
        database.categories.filter(
            item =>
                item.id !== id &&
                item.parentId !== id
        );


    database.headers =
        database.headers.filter(
            header =>
                !(
                    header.categoryId === id
                )
        );


    database.data =
        database.data.filter(
            item =>
                item.categoryId !== id
        );


    if (
        await saveDatabase()
    ) {

        currentCategoryId = null;

        renderCategories();

    }

}


/*
 * ============================================================
 *  DELETE DATA
 * ============================================================
 */

async function deleteData(id) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    if (
        !confirm(
            "এই Data মুছে ফেলবেন?"
        )
    ) return;


    database.data =
        database.data.filter(
            item =>
                item.id !== id
        );


    if (
        await saveDatabase()
    ) {

        renderCategoryDetails();

    }

}


/*
 * ============================================================
 *  EVENTS
 * ============================================================
 */

function setupEvents() {

    document.getElementById(
        "logoutBtn"
    )?.addEventListener(
        "click",
        () => {

            if (
                confirm(
                    "আপনি কি লগআউট করতে চান?"
                )
            ) {

                logoutUser();

            }

        }
    );


    document.getElementById(
        "themeBtn"
    )?.addEventListener(
        "click",
        toggleTheme
    );


    document.getElementById(
        "addCategoryBtn"
    )?.addEventListener(
        "click",
        () => openCategoryModal()
    );


    document.getElementById(
        "emptyAddBtn"
    )?.addEventListener(
        "click",
        () => openCategoryModal()
    );


    document.getElementById(
        "addHeaderBtn"
    )?.addEventListener(
        "click",
        openHeaderModal
    );


    document.getElementById(
        "addDataBtn"
    )?.addEventListener(
        "click",
        () => openDataModal()
    );


    document.getElementById(
        "saveCategoryBtn"
    )?.addEventListener(
        "click",
        saveCategory
    );


    document.getElementById(
        "saveHeaderBtn"
    )?.addEventListener(
        "click",
        saveHeader
    );


    document.getElementById(
        "saveDataBtn"
    )?.addEventListener(
        "click",
        saveData
    );


    document.getElementById(
        "backToMainBtn"
    )?.addEventListener(
        "click",
        () => {

            currentCategoryId = null;

            document
                .getElementById(
                    "categoryDetailsView"
                )
                ?.classList.add(
                    "hidden"
                );


            document
                .getElementById(
                    "mainDashboardView"
                )
                ?.classList.remove(
                    "hidden"
                );


            renderCategories();

        }
    );


    /*
     * Close buttons
     */

    document.querySelectorAll(
        "[data-close]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closeModal(
                    button.dataset.close
                );

            }
        );

    });


    /*
     * Search
     */

    document.getElementById(
        "searchBtn"
    )?.addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "searchBox"
                )
                ?.classList.toggle(
                    "hidden"
                );

        }
    );


    document.getElementById(
        "clearSearch"
    )?.addEventListener(
        "click",
        () => {

            const input =
                document.getElementById(
                    "searchInput"
                );


            if (input) {
                input.value = "";
            }


            renderCategories();

        }
    );


    document.getElementById(
        "searchInput"
    )?.addEventListener(
        "input",
        performSearch
    );

}


/*
 * ============================================================
 *  SEARCH
 * ============================================================
 */

function performSearch(event) {

    const search =
        event.target.value
            .trim()
            .toLowerCase();


    if (!search) {

        renderCategories();

        return;
    }


    const list =
        document.getElementById(
            "categoryList"
        );


    const empty =
        document.getElementById(
            "emptyState"
        );


    if (!list) return;


    list.innerHTML = "";


    const results =
        database.categories.filter(
            category => {

                const categoryMatch =
                    String(
                        category.name || ""
                    )
                    .toLowerCase()
                    .includes(search);


                const dataMatch =
                    database.data.some(
                        item =>

                            item.categoryId ===
                            category.id &&

                            (
                                String(
                                    item.title || ""
                                )
                                .toLowerCase()
                                .includes(search)

                                ||

                                String(
                                    item.description || ""
                                )
                                .toLowerCase()
                                .includes(search)
                            )
                    );


                return (
                    !category.parentId &&
                    (categoryMatch || dataMatch)
                );

            }
        );


    if (!results.length) {

        if (empty) {
            empty.style.display = "";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    results.forEach(
        category => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "category-card";


            card.innerHTML = `

                <h3>
                    📂 ${escapeHtml(category.name)}
                </h3>

                <button
                    class="secondary-btn"
                    data-search-open="${category.id}">
                    Open
                </button>

            `;


            list.appendChild(
                card
            );

        }
    );


    list.querySelectorAll(
        "[data-search-open]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openCategory(
                    button.dataset.searchOpen
                );

            }
        );

    });

}


/*
 * ============================================================
 *  MODAL
 * ============================================================
 */

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


/*
 * ============================================================
 *  THEME
 * ============================================================
 */

function initTheme() {

    if (
        localStorage.getItem(
            "theme"
        ) === "dark"
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


    localStorage.setItem(
        "theme",

        document.body.classList.contains(
            "dark-mode"
        )
            ? "dark"
            : "light"
    );

}


/*
 * ============================================================
 *  UTILITIES
 * ============================================================
 */

function generateId(prefix) {

    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2000
    );

}
