import { watchAuth, logoutUser } from "./auth.js";
import {
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

"use strict";

/* =========================================================
   MAIN ADMIN
   ========================================================= */

const ADMIN_UID =
    "1nTNmVJZ2oQ7EcVruulZoQFXg7b2";


/* =========================================================
   LOCAL DATABASE
   ========================================================= */

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


/* =========================================================
   AUTH
   ========================================================= */

watchAuth(async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    window.currentUser = user;

    /*
     * শুধু UID দেখে Admin নির্ধারণ।
     *
     * কোনো User profile দরকার নেই।
     */
    window.currentUserRole =
        user.uid === ADMIN_UID
            ? "admin"
            : "user";

    console.log(
        "Current UID:",
        user.uid
    );

    console.log(
        "Current Role:",
        window.currentUserRole
    );

    updateRoleUI();

    await loadDatabase();

});


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupEvents();

        initTheme();

    }
);


/* =========================================================
   ROLE UI
   ========================================================= */

function updateRoleUI() {

    const isAdmin =
        window.currentUserRole === "admin";


    /*
     * Admin-only buttons
     */

    const adminButtons = [
        "addCategoryBtn",
        "emptyAddBtn",
        "addSubCategoryBtn",
        "addHeaderBtn",
        "addDataBtn"
    ];


    adminButtons.forEach(id => {

        const button =
            document.getElementById(id);

        if (!button) return;

        button.style.display =
            isAdmin
                ? ""
                : "none";

    });


    /*
     * User-এর জন্য Admin modal বন্ধ
     */

    if (!isAdmin) {

        [
            "categoryModal",
            "headerModal",
            "dataModal",
            "moveDataModal"
        ].forEach(id => {

            const modal =
                document.getElementById(id);

            if (modal) {
                modal.classList.add("hidden");
            }

        });

    }

}


/* =========================================================
   LOAD SHARED DATA
   ========================================================= */

async function loadDatabase() {

    if (!window.currentUser) return;


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "webapp/shared_data"
                )
            );


        if (snapshot.exists()) {

            const value =
                snapshot.val();


            database = {

                categories:
                    Array.isArray(
                        value.categories
                    )
                        ? value.categories
                        : [],

                headers:
                    Array.isArray(
                        value.headers
                    )
                        ? value.headers
                        : [],

                data:
                    Array.isArray(
                        value.data
                    )
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


        renderCategories();


    } catch (error) {

        console.error(
            "Load error:",
            error
        );

        showToast(
            "ডাটা লোড করা যায়নি"
        );

    }

}


/* =========================================================
   SAVE SHARED DATA
   ========================================================= */

async function saveDatabase() {

    /*
     * User কোনোভাবেই Save করতে পারবে না।
     */

    if (
        window.currentUserRole !== "admin"
    ) {

        showToast(
            "আপনার অনুমতি নেই"
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
            "ডাটা সংরক্ষণ করা হয়েছে"
        );


        return true;


    } catch (error) {

        console.error(
            "Save error:",
            error
        );

        showToast(
            "ডাটা সেভ করা যায়নি"
        );

        return false;

    }

}


/* =========================================================
   RENDER CATEGORIES
   ========================================================= */

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
            category =>
                !category.parentId
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

                <div>
                    <h3>
                        📂 ${escapeHtml(
                            category.name
                        )}
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


    /*
     * Open
     */

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


    /*
     * Admin Edit/Delete
     */

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


/* =========================================================
   OPEN CATEGORY
   ========================================================= */

function openCategory(id) {

    currentCategoryId = id;

    const main =
        document.getElementById(
            "mainDashboardView"
        );

    const details =
        document.getElementById(
            "categoryDetailsView"
        );


    if (main) {
        main.classList.add(
            "hidden"
        );
    }


    if (details) {
        details.classList.remove(
            "hidden"
        );
    }


    renderCategoryDetails();

}


/* =========================================================
   CATEGORY DETAILS
   ========================================================= */

function renderCategoryDetails() {

    const category =
        database.categories.find(
            item =>
                item.id === currentCategoryId
        );


    if (!category) {

        goBack();

        return;
    }


    const title =
        document.getElementById(
            "detailsTitle"
        );


    const subtitle =
        document.getElementById(
            "detailsSubtitle"
        );


    const content =
        document.getElementById(
            "detailsContent"
        );


    if (title) {
        title.textContent =
            category.name;
    }


    if (subtitle) {

        subtitle.textContent =
            `${countCategoryItems(category.id)}টি Data`;

    }


    if (!content) return;


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

                const box =
                    document.createElement(
                        "div"
                    );


                box.className =
                    "category-card";


                box.innerHTML = `

                    <h3>
                        📁 ${escapeHtml(
                            sub.name
                        )}
                    </h3>

                    ${
                        window.currentUserRole === "admin"
                            ? `
                                <button
                                    class="secondary-btn"
                                    data-edit-sub="${sub.id}">
                                    Edit
                                </button>

                                <button
                                    class="secondary-btn"
                                    data-delete-sub="${sub.id}">
                                    Delete
                                </button>
                              `
                            : ""
                    }

                `;


                content.appendChild(
                    box
                );

            }
        );


        content.querySelectorAll(
            "[data-edit-sub]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openCategoryModal(
                        button.dataset.editSub
                    );

                }
            );

        });


        content.querySelectorAll(
            "[data-delete-sub]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteCategory(
                        button.dataset.deleteSub
                    );

                }
            );

        });

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

                <div class="section-header">

                    <h3>
                        ${escapeHtml(
                            header.name
                        )}
                    </h3>

                    ${
                        window.currentUserRole === "admin"
                            ? `
                                <button
                                    class="secondary-btn"
                                    data-edit-header="${header.id}">
                                    Edit
                                </button>

                                <button
                                    class="secondary-btn"
                                    data-delete-header="${header.id}">
                                    Delete
                                </button>
                              `
                            : ""
                    }

                </div>

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
                        createDataCard(item)
                    );

                }
            );


            content.appendChild(
                section
            );

        }
    );


    /*
     * Header events
     */

    content.querySelectorAll(
        "[data-edit-header]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openHeaderModal(
                    button.dataset.editHeader
                );

            }
        );

    });


    content.querySelectorAll(
        "[data-delete-header]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteHeader(
                    button.dataset.deleteHeader
                );

            }
        );

    });


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
                    createDataCard(item)
                );

            }
        );


        content.appendChild(
            section
        );

    }

}


/* =========================================================
   DATA CARD
   ========================================================= */

function createDataCard(item) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "category-card";


    card.innerHTML = `

        <div>

            <h3>
                ${escapeHtml(
                    item.title || ""
                )}
            </h3>

            <p>
                ${escapeHtml(
                    item.description || ""
                )}
            </p>

        </div>

        ${
            window.currentUserRole === "admin"
                ? `
                    <div>

                        <button
                            class="secondary-btn"
                            data-edit-data="${item.id}">
                            ✏️ Edit
                        </button>

                        <button
                            class="secondary-btn"
                            data-delete-data="${item.id}">
                            🗑️ Delete
                        </button>

                        <button
                            class="secondary-btn"
                            data-move-data="${item.id}">
                            ↔️ Move
                        </button>

                    </div>
                  `
                : ""
        }

    `;


    if (
        window.currentUserRole === "admin"
    ) {

        card.querySelector(
            "[data-edit-data]"
        )?.addEventListener(
            "click",
            () =>
                openDataModal(item.id)
        );


        card.querySelector(
            "[data-delete-data]"
        )?.addEventListener(
            "click",
            () =>
                deleteData(item.id)
        );


        card.querySelector(
            "[data-move-data]"
        )?.addEventListener(
            "click",
            () =>
                openMoveModal(item.id)
        );

    }


    return card;

}


/* =========================================================
   CATEGORY MODAL
   ========================================================= */

function openCategoryModal(id = null) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    editingCategoryId = id;


    const input =
        document.getElementById(
            "categoryNameInput"
        );


    const title =
        document.getElementById(
            "categoryModalTitle"
        );


    if (id) {

        const category =
            database.categories.find(
                item =>
                    item.id === id
            );


        if (!category) return;


        input.value =
            category.name || "";


        title.textContent =
            category.parentId
                ? "Sub-Category পরিবর্তন করুন"
                : "Category পরিবর্তন করুন";


    } else {

        input.value = "";

        title.textContent =
            "নতুন Category";

    }


    openModal(
        "categoryModal"
    );

}


/* =========================================================
   SAVE CATEGORY
   ========================================================= */

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

            category.name =
                name;

        }

    } else {

        database.categories.push({

            id:
                generateId("cat"),

            name:
                name,

            parentId:
                null,

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


/* =========================================================
   SUB CATEGORY
   ========================================================= */

function openSubCategoryModal() {

    if (
        window.currentUserRole !== "admin"
    ) return;


    if (!currentCategoryId) {

        showToast(
            "আগে Category নির্বাচন করুন"
        );

        return;
    }


    editingCategoryId = null;


    const input =
        document.getElementById(
            "categoryNameInput"
        );


    const title =
        document.getElementById(
            "categoryModalTitle"
        );


    input.value = "";

    title.textContent =
        "নতুন Sub-Category";


    openModal(
        "categoryModal"
    );

}


/*
 * saveCategory override for Sub-Category
 */

const originalSaveCategory =
    saveCategory;


/*
 * নতুন Sub Category আলাদা function
 */

async function saveSubCategory() {

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
            "Sub-Category Name লিখুন"
        );

        return;
    }


    if (!currentCategoryId) {

        showToast(
            "Category নির্বাচন করুন"
        );

        return;
    }


    database.categories.push({

        id:
            generateId("sub"),

        name:
            name,

        parentId:
            currentCategoryId,

        createdAt:
            Date.now()

    });


    if (
        await saveDatabase()
    ) {

        closeModal(
            "categoryModal"
        );

        renderCategoryDetails();

    }

}


/* =========================================================
   HEADER MODAL
   ========================================================= */

function openHeaderModal(id = null) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    editingHeaderId =
        id;


    const input =
        document.getElementById(
            "headerNameInput"
        );


    if (id) {

        const header =
            database.headers.find(
                item =>
                    item.id === id
            );


        if (!header) return;


        input.value =
            header.name || "";

    } else {

        input.value = "";

    }


    openModal(
        "headerModal"
    );

}


/* =========================================================
   SAVE HEADER
   ========================================================= */

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
            "Category নির্বাচন করুন"
        );

        return;
    }


    if (editingHeaderId) {

        const header =
            database.headers.find(
                item =>
                    item.id === editingHeaderId
            );


        if (header) {
            header.name = name;
        }

    } else {

        database.headers.push({

            id:
                generateId("header"),

            name:
                name,

            categoryId:
                currentCategoryId,

            createdAt:
                Date.now()

        });

    }


    if (
        await saveDatabase()
    ) {

        closeModal(
            "headerModal"
        );

        editingHeaderId = null;

        renderCategoryDetails();

    }

}


/* =========================================================
   DATA MODAL
   ========================================================= */

function openDataModal(id = null) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    if (!currentCategoryId) {

        showToast(
            "আগে Category নির্বাচন করুন"
        );

        return;
    }


    editingDataId =
        id;


    const titleInput =
        document.getElementById(
            "dataTitleInput"
        );


    const descriptionInput =
        document.getElementById(
            "dataDescriptionInput"
        );


    if (id) {

        const item =
            database.data.find(
                data =>
                    data.id === id
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


    populateHeaderSelect(
        id
    );


    openModal(
        "dataModal"
    );

}


/* =========================================================
   HEADER SELECT
   ========================================================= */

function populateHeaderSelect(dataId) {

    const select =
        document.getElementById(
            "dataHeaderSelect"
        );


    if (!select) return;


    select.innerHTML =
        `<option value="">Header ছাড়া</option>`;


    const headers =
        database.headers.filter(
            header =>
                header.categoryId ===
                currentCategoryId
        );


    let selectedHeader =
        "";


    if (dataId) {

        const item =
            database.data.find(
                data =>
                    data.id === dataId
            );


        selectedHeader =
            item?.headerId || "";

    }


    headers.forEach(
        header => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                header.id;


            option.textContent =
                header.name;


            if (
                header.id ===
                selectedHeader
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   SAVE DATA
   ========================================================= */

async function saveData() {

    if (
        window.currentUserRole !== "admin"
    ) return;


    const title =
        document.getElementById(
            "dataTitleInput"
        )
        .value
        .trim();


    const description =
        document.getElementById(
            "dataDescriptionInput"
        )
        .value
        .trim();


    const headerId =
        document.getElementById(
            "dataHeaderSelect"
        )
        .value;


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
                    data.id ===
                    editingDataId
            );


        if (item) {

            item.title =
                title;

            item.description =
                description;

            item.categoryId =
                currentCategoryId;

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


/* =========================================================
   DELETE CATEGORY
   ========================================================= */

async function deleteCategory(id) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    if (
        !confirm(
            "এই Category এবং এর সব Data মুছে ফেলবেন?"
        )
    ) return;


    /*
     * মূল Category এবং Sub-category
     */

    const idsToDelete =
        database.categories
            .filter(
                item =>
                    item.id === id ||
                    item.parentId === id
            )
            .map(
                item =>
                    item.id
            );


    database.categories =
        database.categories.filter(
            item =>
                !idsToDelete.includes(
                    item.id
                )
        );


    /*
     * Header delete
     */

    database.headers =
        database.headers.filter(
            header =>
                !idsToDelete.includes(
                    header.categoryId
                )
        );


    /*
     * Data delete
     */

    database.data =
        database.data.filter(
            item =>
                !idsToDelete.includes(
                    item.categoryId
                )
        );


    if (
        await saveDatabase()
    ) {

        currentCategoryId = null;

        goBack();

        renderCategories();

    }

}


/* =========================================================
   DELETE HEADER
   ========================================================= */

async function deleteHeader(id) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    if (
        !confirm(
            "এই Header মুছে ফেলবেন?"
        )
    ) return;


    database.headers =
        database.headers.filter(
            header =>
                header.id !== id
        );


    /*
     * Header-এর Data থাকবে,
     * তবে Header ছাড়া দেখাবে।
     */

    database.data.forEach(
        item => {

            if (
                item.headerId === id
            ) {

                item.headerId =
                    null;

            }

        }
    );


    if (
        await saveDatabase()
    ) {

        renderCategoryDetails();

    }

}


/* =========================================================
   DELETE DATA
   ========================================================= */

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


/* =========================================================
   MOVE DATA
   ========================================================= */

function openMoveModal(id) {

    if (
        window.currentUserRole !== "admin"
    ) return;


    targetMoveDataId =
        id;


    const categorySelect =
        document.getElementById(
            "moveCategorySelect"
        );


    const headerSelect =
        document.getElementById(
            "moveHeaderSelect"
        );


    if (!categorySelect) return;


    categorySelect.innerHTML =
        "";


    database.categories
        .filter(
            category =>
                !category.parentId
        )
        .forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.id;


                option.textContent =
                    category.name;


                categorySelect.appendChild(
                    option
                );

            }
        );


    categorySelect.onchange =
        () => {

            populateMoveHeaders(
                categorySelect.value
            );

        };


    if (headerSelect) {
        populateMoveHeaders(
            categorySelect.value
        );
    }


    openModal(
        "moveDataModal"
    );

}


/* =========================================================
   MOVE HEADER LIST
   ========================================================= */

function populateMoveHeaders(
    categoryId
) {

    const select =
        document.getElementById(
            "moveHeaderSelect"
        );


    if (!select) return;


    select.innerHTML =
        `<option value="">Header ছাড়া</option>`;


    database.headers
        .filter(
            header =>
                header.categoryId ===
                categoryId
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


/* =========================================================
   CONFIRM MOVE
   ========================================================= */

async function confirmMove() {

    if (
        window.currentUserRole !== "admin"
    ) return;


    const categoryId =
        document.getElementById(
            "moveCategorySelect"
        ).value;


    const headerId =
        document.getElementById(
            "moveHeaderSelect"
        ).value;


    const item =
        database.data.find(
            data =>
                data.id ===
                targetMoveDataId
        );


    if (!item) return;


    item.categoryId =
        categoryId;


    item.headerId =
        headerId || null;


    if (
        await saveDatabase()
    ) {

        closeModal(
            "moveDataModal"
        );

        targetMoveDataId = null;

        renderCategoryDetails();

    }

}


/* =========================================================
   SEARCH
   ========================================================= */

function performSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const list =
        document.getElementById(
            "categoryList"
        );


    const empty =
        document.getElementById(
            "emptyState"
        );


    if (!input || !list) return;


    const term =
        input.value
            .trim()
            .toLowerCase();


    if (!term) {

        renderCategories();

        return;

    }


    const results =
        database.categories.filter(
            category => {

                if (
                    category.parentId
                ) {
                    return false;
                }


                const categoryMatch =
                    String(
                        category.name || ""
                    )
                    .toLowerCase()
                    .includes(term);


                const headerMatch =
                    database.headers.some(
                        header =>
                            header.categoryId ===
                                category.id &&
                            String(
                                header.name || ""
                            )
                            .toLowerCase()
                            .includes(term)
                    );


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
                                .includes(term)

                                ||

                                String(
                                    item.description || ""
                                )
                                .toLowerCase()
                                .includes(term)
                            )
                    );


                return (
                    categoryMatch ||
                    headerMatch ||
                    dataMatch
                );

            }
        );


    list.innerHTML = "";


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
                    📂 ${escapeHtml(
                        category.name
                    )}
                </h3>

                <button
                    class="secondary-btn">
                    Open
                </button>

            `;


            card.querySelector(
                "button"
            ).addEventListener(
                "click",
                () =>
                    openCategory(
                        category.id
                    )
            );


            list.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

    /*
     * Logout
     */

    document
        .getElementById(
            "logoutBtn"
        )
        ?.addEventListener(
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


    /*
     * Theme
     */

    document
        .getElementById(
            "themeBtn"
        )
        ?.addEventListener(
            "click",
            toggleTheme
        );


    /*
     * Category
     */

    document
        .getElementById(
            "addCategoryBtn"
        )
        ?.addEventListener(
            "click",
            () =>
                openCategoryModal()
        );


    document
        .getElementById(
            "emptyAddBtn"
        )
        ?.addEventListener(
            "click",
            () =>
                openCategoryModal()
        );


    /*
     * Sub Category
     */

    document
        .getElementById(
            "addSubCategoryBtn"
        )
        ?.addEventListener(
            "click",
            openSubCategoryModal
        );


    /*
     * Header
     */

    document
        .getElementById(
            "addHeaderBtn"
        )
        ?.addEventListener(
            "click",
            () =>
                openHeaderModal()
        );


    /*
     * Data
     */

    document
        .getElementById(
            "addDataBtn"
        )
        ?.addEventListener(
            "click",
            () =>
                openDataModal()
        );


    /*
     * Save buttons
     */

    document
        .getElementById(
            "saveCategoryBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                /*
                 * Category modal title দেখে
                 * Sub-category কিনা বুঝবে।
                 */

                const title =
                    document
                        .getElementById(
                            "categoryModalTitle"
                        )
                        ?.textContent || "";


                if (
                    title.includes(
                        "Sub-Category"
                    )
                ) {

                    saveSubCategory();

                } else {

                    saveCategory();

                }

            }
        );


    document
        .getElementById(
            "saveHeaderBtn"
        )
        ?.addEventListener(
            "click",
            saveHeader
        );


    document
        .getElementById(
            "saveDataBtn"
        )
        ?.addEventListener(
            "click",
            saveData
        );


    /*
     * Move
     */

    document
        .getElementById(
            "confirmMoveBtn"
        )
        ?.addEventListener(
            "click",
            confirmMove
        );


    /*
     * Back
     */

    document
        .getElementById(
            "backToMainBtn"
        )
        ?.addEventListener(
            "click",
            goBack
        );


    /*
     * Search
     */

    document
        .getElementById(
            "searchBtn"
        )
        ?.addEventListener(
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


    document
        .getElementById(
            "searchInput"
        )
        ?.addEventListener(
            "input",
            performSearch
        );


    document
        .getElementById(
            "clearSearch"
        )
        ?.addEventListener(
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


    /*
     * Close modal buttons
     */

    document
        .querySelectorAll(
            "[data-close]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    closeModal(
                        button.dataset.close
                    );

                }
            );

        });

}


/* =========================================================
   BACK
   ========================================================= */

function goBack() {

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


/* =========================================================
   MODAL
   ========================================================= */

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


/* =========================================================
   THEME
   ========================================================= */

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


/* =========================================================
   UTILITIES
   ========================================================= */

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

    return String(
        value ?? ""
    )
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


function countCategoryItems(
    categoryId
) {

    return database.data.filter(
        item =>
            item.categoryId ===
            categoryId
    ).length;

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
