/* =========================================
   Render Category Details (Fixed Search Logic)
========================================= */
function renderCategoryDetails(searchVal = "") {
    const container = document.getElementById("detailsContent");
    if (!container) return;

    container.innerHTML = "";
    const isAdmin = window.currentUserRole === "admin";

    /* 1. Sub Categories */
    let subCategories = database.categories.filter(cat => cat.parentId === currentCategoryId);

    if (searchVal) {
        subCategories = subCategories.filter(sub =>
            sub.name.toLowerCase().includes(searchVal)
        );
    }

    subCategories = sortItemsByPin(subCategories);

    if (subCategories.length > 0) {
        const subWrapper = document.createElement("div");
        subWrapper.style.marginBottom = "20px";

        subCategories.forEach(sub => {
            const item = document.createElement("div");
            item.className = "subcategory-card";

            const pinIcon = sub.pinned ? "📌" : "📍";

            const adminActions = isAdmin
                ? `
                    <div>
                        <button class="btn-pin-sub custom-action-btn" title="পিন">${pinIcon}</button>
                        <button class="btn-edit-sub custom-action-btn">✏️</button>
                        <button class="btn-del-sub custom-action-btn" style="color:#ef4444">🗑️</button>
                    </div>
                `
                : "";

            const subPinBadge = (isAdmin && sub.pinned)
                ? '<span class="pinned-badge">Pinned</span>'
                : "";

            item.innerHTML = `
                <div class="sub-click">
                    <h3>${escapeHTML(sub.name)} ${subPinBadge}</h3>
                </div>
                ${adminActions}
            `;

            item.querySelector(".sub-click").addEventListener("click", () => openCategory(sub.id));

            if (isAdmin) {
                item.querySelector(".btn-pin-sub")?.addEventListener("click", () => togglePinCategory(sub.id));
                item.querySelector(".btn-edit-sub")?.addEventListener("click", () => editCategory(sub.id));
                item.querySelector(".btn-del-sub")?.addEventListener("click", () => deleteCategory(sub.id));
            }

            subWrapper.appendChild(item);
        });

        container.appendChild(subWrapper);
    }

    /* Current Category-র সমস্ত ডাটা ফিল্টার ও সর্টিং */
    let categoryData = database.data.filter(d => d.categoryId === currentCategoryId);
    categoryData = sortItemsByPin(categoryData);

    /* 2. Data Without Header (হেডার ছাড়া ডাটা) */
    let noHeaderData = categoryData.filter(d => !d.headerId);

    if (searchVal) {
        noHeaderData = noHeaderData.filter(d =>
            (d.name && d.name.toLowerCase().includes(searchVal)) ||
            (d.mobile && d.mobile.toLowerCase().includes(searchVal)) ||
            (d.phone && d.phone.toLowerCase().includes(searchVal)) ||
            (d.designation && d.designation.toLowerCase().includes(searchVal))
        );
    }

    if (noHeaderData.length > 0) {
        const noHeaderWrapper = document.createElement("div");
        noHeaderWrapper.style.marginBottom = "15px";

        noHeaderData.forEach(item => {
            noHeaderWrapper.appendChild(createDataCardElement(item));
        });

        container.appendChild(noHeaderWrapper);
    }

    /* 3. Headers & Header-based Data (স্মার্ট সার্চ লজিক) */
    let headers = database.headers.filter(h => h.categoryId === currentCategoryId);
    headers = sortItemsByPin(headers);

    headers.forEach(header => {
        // হেডারের নির্দিষ্ট সব ডাটা
        const headerAllData = categoryData.filter(d => d.headerId === header.id);
        
        // সার্চ করা কি-ওয়ার্ড হেডার টাইটেলের সাথে মেলে কিনা
        const isHeaderMatched = searchVal && header.title.toLowerCase().includes(searchVal);

        // সার্চ করা কি-ওয়ার্ড ডাটার সাথে মেলে কিনা ফিল্টার
        let matchedData = headerAllData;
        if (searchVal && !isHeaderMatched) {
            matchedData = headerAllData.filter(d =>
                (d.name && d.name.toLowerCase().includes(searchVal)) ||
                (d.mobile && d.mobile.toLowerCase().includes(searchVal)) ||
                (d.phone && d.phone.toLowerCase().includes(searchVal)) ||
                (d.designation && d.designation.toLowerCase().includes(searchVal))
            );
        }

        // যদি কোনো সার্চ না থাকে অথবা হেডার ম্যাচ করে অথবা অভ্যন্তরের কোনো ডাটা ম্যাচ করে
        if (!searchVal || isHeaderMatched || matchedData.length > 0) {
            // যদি হেডার ম্যাচ করে তবে হেডারের সমস্ত ডাটা দেখাবে, আর ডাটা ম্যাচ করলে শুধু ম্যাচ করা ডাটা দেখাবে
            const displayData = isHeaderMatched ? headerAllData : matchedData;

            const headerBox = document.createElement("div");
            headerBox.className = "header-box";

            const pinIcon = header.pinned ? "📌" : "📍";

            const adminActions = isAdmin
                ? `
                    <div>
                        <button class="btn-pin-head custom-action-btn" title="পিন">${pinIcon}</button>
                        <button class="btn-edit-head custom-action-btn">✏️</button>
                        <button class="btn-del-head custom-action-btn" style="color:#ef4444">🗑️</button>
                    </div>
                `
                : "";

            const headerPinMark = (isAdmin && header.pinned) ? "📌" : "";

            headerBox.innerHTML = `
                <div class="header-banner">
                    <span>${escapeHTML(header.title)} ${headerPinMark}</span>
                    ${adminActions}
                </div>
            `;

            if (isAdmin) {
                headerBox.querySelector(".btn-pin-head")?.addEventListener("click", () => togglePinHeader(header.id));
                headerBox.querySelector(".btn-edit-head")?.addEventListener("click", () => editHeader(header.id));
                headerBox.querySelector(".btn-del-head")?.addEventListener("click", () => deleteHeader(header.id));
            }

            displayData.forEach(item => {
                headerBox.appendChild(createDataCardElement(item));
            });

            container.appendChild(headerBox);
        }
    });

    updateAdminUI();
}
