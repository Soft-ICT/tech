import {
    ref,
    set,
    get,
    onValue,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { db } from "./firebase.js";

/* =========================================
   Notice System Module (notice.js)
========================================= */

let currentNoticeTab = 'sliding'; // 'sliding', 'home_popup', 'push'
let editingNoticeId = null;
let editingNoticeType = null;

// HTML Escape helper
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

// Initialize Notice System UI & Events
export function initNoticeSystem() {
    injectNoticeHTML();
    setupNoticeEvents();
    listenToActiveNotices();
}

// Inject Notice Modal HTML into DOM dynamically if not present
function injectNoticeHTML() {
    if (document.getElementById("noticeModal")) return;

    const modalHTML = `
    <div id="noticeModal" class="modal hidden">
        <div class="modal-content" style="max-width: 520px; width: 92%; max-height: 90vh; display: flex; flex-direction: column;">
            <div class="modal-header" style="background: #0d6efd; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0;">
                <h2 style="font-size: 18px; display: flex; align-items: center; gap: 8px; margin: 0;">ðŸ“¢ à¦«à¦¾à¦¯à¦¼à¦¾à¦°à¦¬à§‡à¦œ à¦°à¦¿à¦¯à¦¼à§‡à¦²-à¦Ÿà¦¾à¦‡à¦® à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦ªà§à¦¯à¦¾à¦¨à§‡à¦²</h2>
                <button class="close-btn" data-close="noticeModal" type="button" style="color: white; background: none; border: none; font-size: 20px; cursor: pointer;">âœ•</button>
            </div>
            
            <div style="padding: 15px; overflow-y: auto; flex: 1;">
                <!-- Tabs -->
                <div style="display: flex; gap: 6px; margin-bottom: 15px; background: #f1f5f9; padding: 5px; border-radius: 8px;">
                    <button type="button" class="notice-tab-btn active" data-tab="sliding" style="flex:1; padding: 8px 4px; font-size: 13px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; background: #0d6efd; color: white; transition: 0.2s;">à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¿à¦‚ à¦¨à§‹à¦Ÿà¦¿à¦¶</button>
                    <button type="button" class="notice-tab-btn" data-tab="home_popup" style="flex:1; padding: 8px 4px; font-size: 13px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: #475569; transition: 0.2s;">à¦¹à§‹à¦® à¦¨à§‹à¦Ÿà¦¿à¦¶ (à¦ªà¦ªà¦†à¦ª)</button>
                    <button type="button" class="notice-tab-btn" data-tab="push" style="flex:1; padding: 8px 4px; font-size: 13px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: #475569; transition: 0.2s;">à¦ªà§à¦¶ à¦¨à§‹à¦Ÿà¦¿à¦¶</button>
                </div>

                <!-- Form Section -->
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 id="noticeFormTitle" style="font-size: 15px; font-weight: 600; color: #1e293b; margin: 0;">à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¿à¦‚ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§à¦¨</h3>
                        <button type="button" id="noticeStatusToggleBtn" style="background: #10b981; color: white; border: none; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer;">à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸: à¦šà¦¾à¦²à§ à¦†à¦›à§‡</button>
                    </div>

                    <div class="form-group" style="margin-bottom: 10px;">
                        <label style="font-size: 12px; font-weight: 600; color: #64748b; display: block; margin-bottom: 4px;">à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦®:</label>
                        <input id="noticeTitleInput" type="text" placeholder="à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® à¦²à¦¿à¦–à§à¦¨..." style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="font-size: 12px; font-weight: 600; color: #64748b; display: block; margin-bottom: 4px;">à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤:</label>
                        <textarea id="noticeMessageInput" rows="3" placeholder="à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦²à¦¿à¦–à§à¦¨..." style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; resize: vertical;"></textarea>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button type="button" id="saveNoticeBtn" class="primary-btn" style="flex: 1; background: #0d6efd; color: white; border: none; padding: 9px; border-radius: 6px; font-weight: 600; cursor: pointer;">à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¿à¦‚ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà§à¦°à¦•à¦¾à¦¶ à¦•à¦°à§à¦¨</button>
                        <button type="button" id="cancelEditNoticeBtn" class="secondary-btn hidden" style="background: #64748b; color: white; border: none; padding: 9px 12px; border-radius: 6px; font-weight: 600; cursor: pointer;">à¦¬à¦¾à¦¤à¦¿à¦²</button>
                    </div>
                </div>

                <!-- List Section -->
                <div>
                    <h3 id="noticeListTitle" style="font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 10px;">à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¿à¦‚ à¦¨à§‹à¦Ÿà¦¿à¦¶à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾</h3>
                    <div id="noticeListContainer" style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                        <p style="text-align: center; color: #94a3b8; font-size: 13px; padding: 15px;">à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Also inject public notice display containers into index.html structure
    injectPublicNoticeUI();
}

function injectPublicNoticeUI() {
    // 1. Sliding Notice Bar (Below header or toolbar)
    if (!document.getElementById("publicSlidingNoticeBar")) {
        const slidingBarHTML = `
        <div id="publicSlidingNoticeBar" class="hidden" style="background: #eff6ff; border-bottom: 1px solid #bfdbfe; color: #1e40af; padding: 8px 12px; font-size: 13px; display: flex; align-items: center; gap: 10px; overflow: hidden; position: relative;">
            <span style="font-weight: 700; background: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; flex-shrink: 0;">ðŸ“¢ à¦¨à§‹à¦Ÿà¦¿à¦¶</span>
            <div style="overflow: hidden; white-space: nowrap; width: 100%;">
                <div id="slidingNoticeText" style="display: inline-block; animation: marquee 15s linear infinite; font-weight: 500;"></div>
            </div>
        </div>
        `;
        const topbar = document.querySelector(".topbar");
        if (topbar) {
            topbar.insertAdjacentHTML('afterend', slidingBarHTML);
        }
    }

    // 2. Home Popup Notice Modal for Users
    if (!document.getElementById("userPopupNoticeModal")) {
        const popupModalHTML = `
        <div id="userPopupNoticeModal" class="modal hidden" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 420px; width: 90%; background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                <div style="font-size: 32px; margin-bottom: 8px;">ðŸ””</div>
                <h3 id="userPopupTitle" style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 10px;">à¦œà¦°à§à¦°à¦¿ à¦¨à§‹à¦Ÿà¦¿à¦¶</h3>
                <p id="userPopupMessage" style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px; text-align: left; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;"></p>
                <button type="button" id="closeUserPopupBtn" class="primary-btn" style="background: #0d6efd; color: white; border: none; padding: 8px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%;">à¦ à¦¿à¦• à¦†à¦›à§‡</button>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', popupModalHTML);
    }
}

// Setup Event Listeners
function setupNoticeEvents() {
    // Add "Notification" button beside "+ Category" button in dashboard or admin toolbar
    // Let's hook it up dynamically when DOM is ready or check periodically / after render
    setTimeout(() => {
        const addCategoryBtn = document.getElementById("addCategoryBtn");
        if (addCategoryBtn && !document.getElementById("adminNoticeBtn")) {
            const noticeBtn = document.createElement("button");
            noticeBtn.id = "adminNoticeBtn";
            noticeBtn.type = "button";
            noticeBtn.className = "primary-btn admin-only";
            noticeBtn.style.cssText = "width: 100%; margin-top: 8px; background: #7c3aed; color: white;";
            noticeBtn.innerHTML = "ðŸ”” à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦ªà§à¦¯à¦¾à¦¨à§‡à¦²";
            
            noticeBtn.addEventListener("click", () => {
                document.getElementById("noticeModal")?.classList.remove("hidden");
                loadNoticesList();
            });

            addCategoryBtn.parentNode.insertBefore(noticeBtn, addCategoryBtn.nextSibling);
        }
    }, 1000);

    // Tab switching inside notice modal
    document.querySelectorAll(".notice-tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".notice-tab-btn").forEach(b => {
                b.style.background = "transparent";
                b.style.color = "#475569";
                b.classList.remove("active");
            });

            e.target.style.background = "#0d6efd";
            e.target.style.color = "white";
            e.target.classList.add("active");

            currentNoticeTab = e.target.dataset.tab;
            updateNoticeFormUI();
            loadNoticesList();
        });
    });

    // Status active/inactive toggle button inside form
    let isStatusActive = true;
    const statusBtn = document.getElementById("noticeStatusToggleBtn");
    if (statusBtn) {
        statusBtn.addEventListener("click", () => {
            isStatusActive = !isStatusActive;
            if (isStatusActive) {
                statusBtn.style.background = "#10b981";
                statusBtn.textContent = "à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸: à¦šà¦¾à¦²à§ à¦†à¦›à§‡";
            } else {
                statusBtn.style.background = "#ef4444";
                statusBtn.textContent = "à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸: à¦¬à¦¨à§à¦§ à¦†à¦›à§‡";
            }
        });
    }

    // Save / Publish Notice button
    document.getElementById("saveNoticeBtn")?.addEventListener("click", async () => {
        const title = document.getElementById("noticeTitleInput")?.value.trim();
        const message = document.getElementById("noticeMessageInput")?.value.trim();

        if (!title || !message) {
            alert("à¦¦à¦¯à¦¼à¦¾ à¦•à¦°à§‡ à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® à¦à¦¬à¦‚ à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦‰à¦­à§Ÿà¦‡ à¦ªà§‚à¦°à¦£ à¦•à¦°à§à¦¨à¥¤");
            return;
        }

        const noticeData = {
            id: editingNoticeId || "notice_" + Date.now(),
            type: currentNoticeTab,
            title: title,
            message: message,
            status: isStatusActive ? "active" : "inactive",
            updatedAt: Date.now()
        };

        try {
            await set(ref(db, `webapp/notices/${noticeData.id}`), noticeData);
            alert("à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¸à§‡à¦­ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!");
            
            // Reset form
            document.getElementById("noticeTitleInput").value = "";
            document.getElementById("noticeMessageInput").value = "";
            editingNoticeId = null;
            document.getElementById("saveNoticeBtn").textContent = getPublishButtonText(currentNoticeTab);
            document.getElementById("cancelEditNoticeBtn")?.classList.add("hidden");

            loadNoticesList();
        } catch (error) {
            console.error("Notice save error:", error);
            alert("à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¸à§‡à¦­ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
        }
    });

    document.getElementById("cancelEditNoticeBtn")?.addEventListener("click", () => {
        editingNoticeId = null;
        document.getElementById("noticeTitleInput").value = "";
        document.getElementById("noticeMessageInput").value = "";
        document.getElementById("saveNoticeBtn").textContent = getPublishButtonText(currentNoticeTab);
        document.getElementById("cancelEditNoticeBtn")?.classList.add("hidden");
    });

    // Close modal handlers
    document.querySelectorAll('[data-close="noticeModal"]').forEach(btn => {
        btn.addEventListener("click", () => {
            document.getElementById("noticeModal")?.classList.add("hidden");
        });
    });

    document.getElementById("closeUserPopupBtn")?.addEventListener("click", () => {
        document.getElementById("userPopupNoticeModal")?.classList.add("hidden");
    });
}

function getPublishButtonText(type) {
    if (type === 'sliding') return 'à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¿à¦‚ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà§à¦°à¦•à¦¾à¦¶ à¦•à¦°à§à¦¨';
    if (type === 'home_popup') return 'à¦¹à§‹à¦® à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà§à¦°à¦•à¦¾à¦¶ à¦•à¦°à§à¦¨';
    return 'à¦ªà§à¦¶ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà¦¾à¦ à¦¾à¦¨';
}

function updateNoticeFormUI() {
    const titleEl = document.getElementById("noticeFormTitle");
    const saveBtn = document.getElementById("saveNoticeBtn");
    const listTitle = document.getElementById("noticeListTitle");

    if (currentNoticeTab === 'sliding') {
        if (titleEl) titleEl.textContent = "à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¿à¦‚ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§à¦¨";
        if (saveBtn) saveBtn.textContent = "à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¿à¦‚ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà§à¦°à¦•à¦¾à¦¶ à¦•à¦°à§à¦¨";
        if (listTitle) listTitle.textContent = "à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¿à¦‚ à¦¨à§‹à¦Ÿà¦¿à¦¶à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾";
    } else if (currentNoticeTab === 'home_popup') {
        if (titleEl) titleEl.textContent = "à¦¹à§‹à¦® à¦¨à§‹à¦Ÿà¦¿à¦¶ (à¦ªà¦ªà¦†à¦ª) à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§à¦¨";
        if (saveBtn) saveBtn.textContent = "à¦¹à§‹à¦® à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà§à¦°à¦•à¦¾à¦¶ à¦•à¦°à§à¦¨";
        if (listTitle) listTitle.textContent = "à¦¹à§‹à¦® à¦¨à§‹à¦Ÿà¦¿à¦¶à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾";
    } else {
        if (titleEl) titleEl.textContent = "à¦ªà§à¦¶ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§à¦¨";
        if (saveBtn) saveBtn.textContent = "à¦ªà§à¦¶ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà¦¾à¦ à¦¾à¦¨";
        if (listTitle) listTitle.textContent = "à¦ªà§à¦¶ à¦¨à§‹à¦Ÿà¦¿à¦¶à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾";
    }
}

// Load Notices List inside Admin Modal
async function loadNoticesList() {
    const container = document.getElementById("noticeListContainer");
    if (!container) return;

    container.innerHTML = `<p style="text-align: center; color: #94a3b8; font-size: 13px; padding: 15px;">à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...</p>`;

    try {
        const snapshot = await get(ref(db, "webapp/notices"));
        if (!snapshot.exists()) {
            container.innerHTML = `<p style="text-align: center; color: #94a3b8; font-size: 13px; padding: 15px;">à¦•à§‹à¦¨à§‹ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿</p>`;
            return;
        }

        container.innerHTML = "";
        const notices = snapshot.val();

        let filteredNotices = Object.values(notices).filter(n => n.type === currentNoticeTab);

        if (filteredNotices.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #94a3b8; font-size: 13px; padding: 15px;">à¦à¦‡ à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿à¦¤à§‡ à¦•à§‹à¦¨à§‹ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¨à§‡à¦‡</p>`;
            return;
        }

        filteredNotices.sort((a, b) => b.updatedAt - a.updatedAt);

        filteredNotices.forEach(notice => {
            const card = document.createElement("div");
            card.style.cssText = "background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;";

            const isActive = notice.status === "active";
            const statusBadgeColor = isActive ? "#10b981" : "#ef4444";
            const statusText = isActive ? "à¦šà¦¾à¦²à§" : "à¦¬à¦¨à§à¦§";

            card.innerHTML = `
                <div style="flex: 1; overflow: hidden; padding-right: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                        <span style="font-size: 11px; font-weight: 700; background: ${statusBadgeColor}; color: white; padding: 1px 6px; border-radius: 4px;">${statusText}</span>
                        <strong style="font-size: 13px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(notice.title)}</strong>
                    </div>
                    <p style="font-size: 12px; color: #64748b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(notice.message)}</p>
                </div>
                <div style="display: flex; gap: 4px; flex-shrink: 0;">
                    <button type="button" class="btn-toggle-status" title="à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§à¦¨" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">ðŸ”„</button>
                    <button type="button" class="btn-edit-notice" title="à¦à¦¡à¦¿à¦Ÿ" style="background: #e0f2fe; color: #0284c7; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">âœï¸</button>
                    <button type="button" class="btn-del-notice" title="à¦¡à¦¿à¦²à¦¿à¦Ÿ" style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">ðŸ—‘ï¸</button>
                </div>
            `;

            // Toggle Status Button
            card.querySelector(".btn-toggle-status").addEventListener("click", async () => {
                const newStatus = notice.status === "active" ? "inactive" : "active";
                await update(ref(db, `webapp/notices/${notice.id}`), { status: newStatus });
                loadNoticesList();
            });

            // Edit Button
            card.querySelector(".btn-edit-notice").addEventListener("click", () => {
                editingNoticeId = notice.id;
                document.getElementById("noticeTitleInput").value = notice.title || "";
                document.getElementById("noticeMessageInput").value = notice.message || "";
                document.getElementById("saveNoticeBtn").textContent = "à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à¦°à§à¦¨";
                document.getElementById("cancelEditNoticeBtn")?.classList.remove("hidden");
            });

            // Delete Button
            card.querySelector(".btn-del-notice").addEventListener("click", async () => {
                if (confirm("à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦à¦‡ à¦¨à§‹à¦Ÿà¦¿à¦¶à¦Ÿà¦¿ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¤à§‡ à¦šà¦¾à¦¨?")) {
                    await remove(ref(db, `webapp/notices/${notice.id}`));
                    loadNoticesList();
                }
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading notice list:", error);
        container.innerHTML = `<p style="text-align: center; color: #ef4444; font-size: 13px; padding: 15px;">à¦¡à¦¾à¦Ÿà¦¾ à¦²à§‹à¦¡ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡</p>`;
    }
}

// Listen to Active Notices for Users in Real-Time
function listenToActiveNotices() {
    const noticesRef = ref(db, "webapp/notices");
    
    onValue(noticesRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const notices = snapshot.val();

        let slidingActiveText = "";
        let popupNotice = null;

        Object.values(notices).forEach(notice => {
            if (notice.status === "active") {
                if (notice.type === "sliding") {
                    slidingActiveText += `  ðŸ“¢  ${notice.title}: ${notice.message}     `;
                } else if (notice.type === "home_popup" || notice.type === "push") {
                    // Grab the latest active popup/push notice
                    if (!popupNotice || notice.updatedAt > popupNotice.updatedAt) {
                        popupNotice = notice;
                    }
                }
            }
        });

        // Render Sliding Bar
        const slidingBar = document.getElementById("publicSlidingNoticeBar");
        const slidingTextEl = document.getElementById("slidingNoticeText");
        if (slidingBar && slidingTextEl) {
            if (slidingActiveText) {
                slidingTextEl.textContent = slidingActiveText;
                slidingBar.classList.remove("hidden");
            } else {
                slidingBar.classList.add("hidden");
            }
        }

        // Render Popup Notice Modal for Users (Show once per session or when updated)
        if (popupNotice) {
            const lastShownId = sessionStorage.getItem("last_shown_popup_id");
            if (lastShownId !== popupNotice.id) {
                const popupModal = document.getElementById("userPopupNoticeModal");
                const popupTitle = document.getElementById("userPopupTitle");
                const popupMsg = document.getElementById("userPopupMessage");

                if (popupModal && popupTitle && popupMsg) {
                    popupTitle.textContent = popupNotice.title;
                    popupMsg.textContent = popupNotice.message;
                    popupModal.classList.remove("hidden");
                    sessionStorage.setItem("last_shown_popup_id", popupNotice.id);
                }
            }
        }
    });
}
