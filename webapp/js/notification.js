/* =========================================
   Notification System Module (Fully Fixed & Stable)
========================================= */
import { db } from "./firebase-config.js";
import { ref, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// মডিউলটি ইম্পোর্ট বা লোড হওয়ার সাথে সাথে UI ও ইভেন্ট সেটআপ কল করা
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initNotificationSystem);
} else {
    initNotificationSystem();
}

export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
    listenToFirebaseNotices();
}

function createNotificationUI() {
    if (document.getElementById("notificationModal")) return;

    const notificationHTML = `
    <!-- নোটিফিকেশন ম্যানেজমেন্ট প্যানেল মোডাল -->
    <div id="notificationModal" class="modal hidden" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
        <div class="modal-content notification-modal-content" style="max-width: 680px; width: 95%; background: var(--bg-card, #fff); border-radius: 8px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
            <div class="modal-header" style="padding: 15px; border-bottom: 1px solid var(--border-color, #ddd); display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin:0; font-size: 18px;">📢 নোটিফিকেশন ম্যানেজমেন্ট প্যানেল</h2>
                <button class="close-btn" data-close="notificationModal" type="button" style="background:none; border:none; font-size: 18px; cursor:pointer;">✕</button>
            </div>
            
            <div class="notification-body" style="max-height: 78vh; overflow-y: auto; padding: 15px;">
                
                <!-- View Pager / Tabs Navigation -->
                <div class="notice-tabs" style="display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 2px solid var(--border-color, #ddd); padding-bottom: 10px;">
                    <button type="button" class="tab-btn active-tab" data-target="tabSliding" style="flex: 1; padding: 8px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Scrolling Notice</button>
                    <button type="button" class="tab-btn" data-target="tabHome" style="flex: 1; padding: 8px; background: #e9ecef; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Home Notice</button>
                    <button type="button" class="tab-btn" data-target="tabPush" style="flex: 1; padding: 8px; background: #e9ecef; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Push Notice</button>
                </div>

                <input type="hidden" id="editNoticeId" value="">

                <!-- TAB 1: SCROLLING NOTICE -->
                <div id="tabSliding" class="notice-tab-content">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h3 class="form-title-sliding" style="margin: 0; font-size: 16px;">স্লাইডিং নোটিশ তৈরি করুন</h3>
                            <button type="button" id="toggleSlidingGlobalBtn" style="padding: 4px 10px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; background: #28a745; color: #fff;">স্ট্যাটাস: চালু আছে</button>
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">১. শিরোনাম:</label>
                            <input type="text" id="slidingTitle" placeholder="যেমন: BREAKING NEWS" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">২. বিস্তারিত:</label>
                            <textarea id="slidingMessage" rows="2" placeholder="বিস্তারিত লিখুন..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="sliding" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">ফায়ারবেজে প্রকাশ করুন</button>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px;">স্লাইডিং নোটিশের তালিকা</h4>
                        <div id="sentSlidingList" class="notification-list"><p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">লোড হচ্ছে...</p></div>
                    </div>
                </div>

                <!-- TAB 2: HOME NOTICE -->
                <div id="tabHome" class="notice-tab-content hidden" style="display: none;">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h3 class="form-title-home" style="margin: 0; font-size: 16px;">হোম নোটিশ তৈরি করুন</h3>
                            <button type="button" id="toggleHomeGlobalBtn" style="padding: 4px 10px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; background: #28a745; color: #fff;">স্ট্যাটাস: চালু আছে</button>
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">১. শিরোনাম:</label>
                            <input type="text" id="homeTitle" placeholder="নোটিশের শিরোনাম..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">২. বিস্তারিত:</label>
                            <textarea id="homeMessage" rows="2" placeholder="বিস্তারিত বিবরণ..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">৩. মিডিয়া বা সাইট লিংক (ইমেজ / ভিডিও / ওয়েবসাইট URL):</label>
                            <input type="url" id="homeMediaLink" placeholder="https://example.com/image.jpg" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="home" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">ফায়ারবেজে প্রকাশ করুন</button>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px;">হোম নোটিশের তালিকা</h4>
                        <div id="sentHomeList" class="notification-list"><p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">লোড হচ্ছে...</p></div>
                    </div>
                </div>

                <!-- TAB 3: PUSH NOTICE -->
                <div id="tabPush" class="notice-tab-content hidden" style="display: none;">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <h3 class="form-title-push" style="margin: 0; font-size: 16px;">পুশ নোটিশ তৈরি করুন</h3>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">১. শিরোনাম:</label>
                            <input type="text" id="pushTitle" placeholder="পুশ নোটিফিকেশন শিরোনাম..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">২. বিস্তারিত:</label>
                            <textarea id="pushMessage" rows="2" placeholder="পুশ মেসেজ..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">৩. ইমেজ লিংক:</label>
                            <input type="url" id="pushImageLink" placeholder="https://example.com/banner.jpg" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="push" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">ফায়ারবেজে পাঠান</button>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px;">পুশ নোটিশের তালিকা</h4>
                        <div id="sentPushList" class="notification-list"><p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">লোড হচ্ছে...</p></div>
                    </div>
                </div>

                <button id="cancelEditBtn" class="secondary-btn hidden" type="button" style="width: 100%; padding: 8px; margin-top: 15px; background: #6c757d; color: #fff; border: none; border-radius: 4px; cursor: pointer; display: none;">এডিট বাতিল করুন</button>
            </div>
            
            <div class="modal-actions" style="padding: 10px 15px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
                <button class="secondary-btn" data-close="notificationModal" type="button" style="padding: 6px 14px; background: #6c757d; color: #fff; border:none; border-radius:4px; cursor:pointer;">বন্ধ করুন</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', notificationHTML);
}

function setupNotificationEvents() {
    // গ্লোবাল ডকুমেন্ট বা ইভেন্ট ডেলিগেশনের মাধ্যমে বাটন ক্লিক হ্যান্ডেল করা যাতে বাটন পরেও লোড হলে সমস্যা না হয়
    document.addEventListener("click", (e) => {
        const notifBtn = e.target.closest("#notificationBtn");
        if (notifBtn) {
            const modal = document.getElementById("notificationModal");
            if (modal) {
                modal.classList.remove("hidden");
                modal.style.display = "flex";
                loadAllSeparateLists();
                updateToggleButtonsUI();
            }
        }
    });

    const modal = document.getElementById("notificationModal");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const toggleSlidingBtn = document.getElementById("toggleSlidingGlobalBtn");
    const toggleHomeBtn = document.getElementById("toggleHomeGlobalBtn");

    document.addEventListener("click", (e) => {
        if (e.target.matches("[data-close='notificationModal']") || e.target.closest("[data-close='notificationModal']")) {
            const m = document.getElementById("notificationModal");
            if (m) {
                m.classList.add("hidden");
                m.style.display = "none";
                resetForm();
            }
        }
    });

    toggleSlidingBtn?.addEventListener("click", () => {
        let isOff = localStorage.getItem("sliding_notice_disabled") === "true";
        localStorage.setItem("sliding_notice_disabled", !isOff);
        updateToggleButtonsUI();
        renderActiveNotices();
    });

    toggleHomeBtn?.addEventListener("click", () => {
        let isOff = localStorage.getItem("home_notice_disabled") === "true";
        localStorage.setItem("home_notice_disabled", !isOff);
        updateToggleButtonsUI();
        renderActiveNotices();
    });

    const tabBtns = modal?.querySelectorAll(".tab-btn");
    tabBtns?.forEach(btn => {
        btn.addEventListener("click", (e) => {
            tabBtns.forEach(b => {
                b.classList.remove("active-tab");
                b.style.background = "#e9ecef";
                b.style.color = "#333";
            });
            e.target.classList.add("active-tab");
            e.target.style.background = "#0d6efd";
            e.target.style.color = "#fff";

            modal.querySelectorAll(".notice-tab-content").forEach(content => {
                content.classList.add("hidden");
                content.style.display = "none";
            });

            const targetTab = e.target.getAttribute("data-target");
            const activeContent = document.getElementById(targetTab);
            if (activeContent) {
                activeContent.classList.remove("hidden");
                activeContent.style.display = "block";
            }
        });
    });

    modal?.querySelectorAll(".submit-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const type = e.target.getAttribute("data-type");
            handleFirebaseSaveOrUpdate(type);
        });
    });

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => resetForm());
    }
}

function updateToggleButtonsUI() {
    const slidingBtn = document.getElementById("toggleSlidingGlobalBtn");
    const homeBtn = document.getElementById("toggleHomeGlobalBtn");

    if (slidingBtn) {
        const isOff = localStorage.getItem("sliding_notice_disabled") === "true";
        slidingBtn.innerText = isOff ? "স্ট্যাটাস: বন্ধ আছে" : "স্ট্যাটাস: চালু আছে";
        slidingBtn.style.background = isOff ? "#dc3545" : "#28a745";
    }

    if (homeBtn) {
        const isOff = localStorage.getItem("home_notice_disabled") === "true";
        homeBtn.innerText = isOff ? "স্ট্যাটাস: বন্ধ আছে" : "স্ট্যাটাস: চালু আছে";
        homeBtn.style.background = isOff ? "#dc3545" : "#28a745";
    }
}

function handleFirebaseSaveOrUpdate(type) {
    const editId = document.getElementById("editNoticeId").value;
    let title = "", message = "", mediaLink = "";

    if (type === 'sliding') {
        title = document.getElementById("slidingTitle").value.trim();
        message = document.getElementById("slidingMessage").value.trim();
    } else if (type === 'home') {
        title = document.getElementById("homeTitle").value.trim();
        message = document.getElementById("homeMessage").value.trim();
        mediaLink = document.getElementById("homeMediaLink").value.trim();
    } else if (type === 'push') {
        title = document.getElementById("pushTitle").value.trim();
        message = document.getElementById("pushMessage").value.trim();
        mediaLink = document.getElementById("pushImageLink").value.trim();
    }

    if (!title || !message) {
        alert("দয়া করে শিরোনাম এবং বিস্তারিত বিবরণ উভয়ই লিখুন।");
        return;
    }

    const noticeId = editId ? editId : 'notice_' + Date.now();
    const noticeData = {
        id: noticeId,
        type,
        title,
        message,
        mediaLink,
        time: new Date().toLocaleString('bn-BD') + (editId ? " (এডিটেড)" : "")
    };

    set(ref(db, 'notices/' + noticeId), noticeData)
        .then(() => {
            alert(editId ? "নোটিশ সফলভাবে আপডেট হয়েছে!" : "নোটিশ সফলভাবে ফায়ারবেজে প্রকাশ করা হয়েছে!");
            resetForm();
            loadAllSeparateLists();
        })
        .catch((error) => alert("ত্রুটি: " + error.message));
}

function listenToFirebaseNotices() {
    const noticesRef = ref(db, 'notices');
    onValue(noticesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const noticesArray = Object.values(data);
            localStorage.setItem("app_custom_notices_firebase", JSON.stringify(noticesArray));
            
            const activeSliding = noticesArray.filter(n => n.type === 'sliding').pop();
            if (activeSliding) localStorage.setItem("active_sliding_notice", JSON.stringify(activeSliding));
        } else {
            localStorage.setItem("app_custom_notices_firebase", JSON.stringify([]));
            localStorage.removeItem("active_sliding_notice");
        }
        renderActiveNotices();
        loadAllSeparateLists();
    });
}

export function renderActiveNotices() {
    const slidingDisabled = localStorage.getItem("sliding_notice_disabled") === "true";
    const ticker = document.getElementById("slidingNoticeTicker");
    if (slidingDisabled) {
        if (ticker) ticker.remove();
    } else {
        const activeSliding = JSON.parse(localStorage.getItem("active_sliding_notice"));
        if (activeSliding) showSlidingBanner(activeSliding);
    }
}

function showSlidingBanner(notice) {
    let ticker = document.getElementById("slidingNoticeTicker");
    if (!ticker) {
        ticker = document.createElement("div");
        ticker.id = "slidingNoticeTicker";
        ticker.style.cssText = "background: #fff; border-bottom: 1px solid #ddd; display: flex; align-items: center; overflow: hidden; width: 100%; z-index: 999;";
        document.body.insertBefore(ticker, document.body.firstChild);
    }
    ticker.innerHTML = `
        <div style="background: #0d6efd; color: #fff; padding: 6px 12px; font-weight: 600; font-size: 12px;">🔥 ${notice.title}</div>
        <div style="flex: 1; overflow: hidden; white-space: nowrap; padding: 0 10px;">
            <marquee scrollamount="5" style="font-size: 13px;">${notice.message}</marquee>
        </div>`;
}

function loadAllSeparateLists() {
    const notices = JSON.parse(localStorage.getItem("app_custom_notices_firebase") || "[]");
    const slidingList = document.getElementById("sentSlidingList");
    const homeList = document.getElementById("sentHomeList");
    const pushList = document.getElementById("sentPushList");

    const slidingNotices = notices.filter(n => n.type === 'sliding');
    const homeNotices = notices.filter(n => n.type === 'home');
    const pushNotices = notices.filter(n => n.type === 'push');

    if (slidingList) slidingList.innerHTML = slidingNotices.length === 0 ? `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো স্লাইডিং নোটিশ নেই।</p>` : slidingNotices.map(n => renderNoticeCard(n)).join('');
    if (homeList) homeList.innerHTML = homeNotices.length === 0 ? `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো হোম নোটিশ নেই।</p>` : homeNotices.map(n => renderNoticeCard(n)).join('');
    if (pushList) pushList.innerHTML = pushNotices.length === 0 ? `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো পুশ নোটিশ নেই।</p>` : pushNotices.map(n => renderNoticeCard(n)).join('');

    attachListActionEvents();
}

function renderNoticeCard(notif) {
    return `
        <div style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 8px; background: #fff; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1; padding-right: 8px;">
                <strong style="font-size: 13px; display:block;">${notif.title}</strong>
                <p style="font-size: 12px; color: #666; margin: 2px 0;">${notif.message}</p>
                <small style="font-size: 10px; color: gray;">${notif.time}</small>
            </div>
            <div style="display: flex; gap: 4px;">
                <button class="edit-notice-btn" data-id="${notif.id}" style="padding: 4px 8px; font-size: 11px; background: #ffc107; border: none; border-radius: 4px; cursor:pointer;">এডিট</button>
                <button class="delete-notice-btn" data-id="${notif.id}" style="padding: 4px 8px; font-size: 11px; background: #dc3545; color: #fff; border: none; border-radius: 4px; cursor:pointer;">ডিলিট</button>
            </div>
        </div>`;
}

function attachListActionEvents() {
    const modal = document.getElementById("notificationModal");
    if (!modal) return;

    modal.querySelectorAll(".edit-notice-btn").forEach(btn => {
        btn.onclick = (e) => {
            const id = e.target.getAttribute("data-id");
            let notices = JSON.parse(localStorage.getItem("app_custom_notices_firebase") || "[]");
            const noticeToEdit = notices.find(n => n.id == id);
            
            if (noticeToEdit) {
                document.getElementById("editNoticeId").value = noticeToEdit.id;
                const targetTabBtn = modal.querySelector(`.tab-btn[data-target="tab${noticeToEdit.type.charAt(0).toUpperCase() + noticeToEdit.type.slice(1)}"]`);
                if (targetTabBtn) targetTabBtn.click();

                if (noticeToEdit.type === 'sliding') {
                    document.getElementById("slidingTitle").value = noticeToEdit.title;
                    document.getElementById("slidingMessage").value = noticeToEdit.message;
                } else if (noticeToEdit.type === 'home') {
                    document.getElementById("homeTitle").value = noticeToEdit.title;
                    document.getElementById("homeMessage").value = noticeToEdit.message;
                    document.getElementById("homeMediaLink").value = noticeToEdit.mediaLink || "";
                } else if (noticeToEdit.type === 'push') {
                    document.getElementById("pushTitle").value = noticeToEdit.title;
                    document.getElementById("pushMessage").value = noticeToEdit.message;
                    document.getElementById("pushImageLink").value = noticeToEdit.mediaLink || "";
                }
                
                modal.querySelectorAll(".submit-notice-btn").forEach(el => el.innerText = "আপডেট করুন");
                const cancelBtn = document.getElementById("cancelEditBtn");
                if (cancelBtn) cancelBtn.style.display = "block";
            }
        };
    });

    modal.querySelectorAll(".delete-notice-btn").forEach(btn => {
        btn.onclick = (e) => {
            const id = e.target.getAttribute("data-id");
            if (confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি ডিলিট করতে চান?")) {
                remove(ref(db, 'notices/' + id)).then(() => {
                    alert("ডিলিট সফল হয়েছে!");
                    loadAllSeparateLists();
                });
            }
        };
    });
}

function resetForm() {
    const editIdInput = document.getElementById("editNoticeId");
    if (editIdInput) editIdInput.value = "";
    
    ["slidingTitle", "slidingMessage", "homeTitle", "homeMessage", "homeMediaLink", "pushTitle", "pushMessage", "pushImageLink"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    
    document.querySelectorAll(".submit-notice-btn").forEach((el, idx) => {
        el.innerText = ["ফায়ারবেজে প্রকাশ করুন", "ফায়ারবেজে প্রকাশ করুন", "ফায়ারবেজে পাঠান"][idx];
    });
    
    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
}
