/* =========================================
   Notification System Module (Fully Firebase Active)
========================================= */

import { database } from "./firebase.js"; // আপনার প্রজেক্টের firebase.js ফাইলের সঠিক পাথ দিন
import { ref, push, set, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-database.js";

export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
    loadAllFirebaseListsAndListen(); // রিয়েল-টাইম ফায়ারবেজ লিসেনার চালু হবে
}

function createNotificationUI() {
    if (document.getElementById("notificationModal")) return;

    const notificationHTML = `
    <div id="notificationModal" class="modal hidden">
        <div class="modal-content notification-modal-content" style="max-width: 680px; width: 95%;">
            <div class="modal-header">
                <h2>📢 ফায়ারবেজ রিয়েল-টাইম নোটিফিকেশন প্যানেল</h2>
                <button class="close-btn" data-close="notificationModal" type="button">✕</button>
            </div>
            
            <div class="notification-body" style="max-height: 78vh; overflow-y: auto; padding: 15px;">
                
                <!-- View Pager / Tabs Navigation -->
                <div class="notice-tabs" style="display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 2px solid var(--border-color, #ddd); padding-bottom: 10px;">
                    <button type="button" class="tab-btn active-tab" data-target="tabSliding" style="flex: 1; padding: 8px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Scrolling Notice</button>
                    <button type="button" class="tab-btn" data-target="tabHome" style="flex: 1; padding: 8px; background: #e9ecef; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Home Notice (Popup)</button>
                    <button type="button" class="tab-btn" data-target="tabPush" style="flex: 1; padding: 8px; background: #e9ecef; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Push Notice</button>
                </div>

                <input type="hidden" id="editNoticeId" value="">

                <!-- TAB 1: SCROLLING NOTICE -->
                <div id="tabSliding" class="notice-tab-content">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h3 class="form-title-sliding" style="margin: 0; font-size: 16px; color: var(--text-main);">স্লাইডিং নোটিশ তৈরি করুন</h3>
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
                        <button type="button" class="submit-notice-btn primary-btn" data-type="sliding" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">স্লাইডিং নোটিশ প্রকাশ করুন</button>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px; color: var(--text-main);">স্লাইডিং নোটিশের তালিকা</h4>
                        <div id="sentSlidingList" class="notification-list">
                            <p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">ফায়ারবেজ থেকে লোড হচ্ছে...</p>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: HOME NOTICE (POPUP) -->
                <div id="tabHome" class="notice-tab-content hidden">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h3 class="form-title-home" style="margin: 0; font-size: 16px; color: var(--text-main);">হোম নোটিশ পপআপ তৈরি করুন</h3>
                            <button type="button" id="toggleHomeGlobalBtn" style="padding: 4px 10px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; background: #28a745; color: #fff;">স্ট্যাটাস: চালু আছে</button>
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">১. শিরোনাম (বড় আকৃতির):</label>
                            <input type="text" id="homeTitle" placeholder="নোটিশের শিরোনাম..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">২. বিস্তারিত বিবরণ (ছোট আকৃতির):</label>
                            <textarea id="homeMessage" rows="2" placeholder="ছোট বিবরণ লিখুন..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">৩. মিডিয়া বা সাইট লিংক (ইমেজ / ভিডিও / ওয়েবসাইট URL):</label>
                            <input type="url" id="homeMediaLink" placeholder="https://example.com/image.jpg বা video/site link" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="home" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">হোম নোটিশ প্রকাশ করুন</button>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px; color: var(--text-main);">হোম নোটিশের তালিকা</h4>
                        <div id="sentHomeList" class="notification-list">
                            <p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">ফায়ারবেজ থেকে লোড হচ্ছে...</p>
                        </div>
                    </div>
                </div>

                <!-- TAB 3: PUSH NOTICE -->
                <div id="tabPush" class="notice-tab-content hidden">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <h3 class="form-title-push" style="margin: 0; font-size: 16px; color: var(--text-main);">পুশ নোটিশ তৈরি করুন</h3>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">১. শিরোনাম:</label>
                            <input type="text" id="pushTitle" placeholder="পুশ নোটিফিকেশন শিরোনাম..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">২. বিস্তারিত:</label>
                            <textarea id="pushMessage" rows="2" placeholder="পুশ মেসেজ..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">৩. ইমেজ লিংক (নোটিফিকেশন ব্যানার ইমেজ):</label>
                            <input type="url" id="pushImageLink" placeholder="https://example.com/banner.jpg" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="push" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">পুশ নোটিশ পাঠান</button>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px; color: var(--text-main);">পুশ নোটিশের তালিকা</h4>
                        <div id="sentPushList" class="notification-list">
                            <p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">ফায়ারবেজ থেকে লোড হচ্ছে...</p>
                        </div>
                    </div>
                </div>

                <button id="cancelEditBtn" class="secondary-btn hidden" type="button" style="width: 100%; padding: 8px; margin-top: 15px; background: #6c757d; color: #fff; border: none; border-radius: 4px; cursor: pointer;">এডিট বাতিল করুন</button>

            </div>
            <div class="modal-actions" style="padding: 10px 15px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 10px;">
                <button class="secondary-btn" data-close="notificationModal" type="button">বন্ধ করুন</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', notificationHTML);
}

function setupNotificationEvents() {
    const notifBtn = document.getElementById("notificationBtn");
    const modal = document.getElementById("notificationModal");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const toggleSlidingBtn = document.getElementById("toggleSlidingGlobalBtn");
    const toggleHomeBtn = document.getElementById("toggleHomeGlobalBtn");

    if (notifBtn) {
        notifBtn.addEventListener("click", () => {
            modal.classList.remove("hidden");
            updateToggleButtonsUI();
        });
    }

    modal?.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            modal.classList.add("hidden");
            resetForm();
        });
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

    const tabBtns = modal.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
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
            });

            const targetTab = e.target.getAttribute("data-target");
            document.getElementById(targetTab).classList.remove("hidden");
        });
    });

    modal.querySelectorAll(".submit-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const type = e.target.getAttribute("data-type");
            saveOrUpdateToFirebase(type);
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

// ফায়ারবেজে ডাটা সরাসরি সেভ বা আপডেট করার কাজ
async function saveOrUpdateToFirebase(type) {
    const editId = document.getElementById("editNoticeId").value;
    let title = "";
    let message = "";
    let mediaLink = "";

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

    try {
        if (editId) {
            // ফায়ারবেজে বিদ্যমান আইডি আপডেট করা
            const noticeRef = ref(database, 'notices/' + editId);
            await update(noticeRef, {
                title,
                message,
                mediaLink,
                time: new Date().toLocaleString('bn-BD') + " (এডিটেড)"
            });
            alert("ফায়ারবেজে নোটিশ সফলভাবে আপডেট করা হয়েছে!");
        } else {
            // ফায়ারবেজে নতুন নোটিশ পুশ করা
            const noticesRef = ref(database, 'notices');
            const newNoticeRef = push(noticesRef);
            const noticeData = {
                id: newNoticeRef.key,
                type,
                title,
                message,
                mediaLink,
                time: new Date().toLocaleString('bn-BD')
            };
            await set(newNoticeRef, noticeData);

            if (type === 'push') {
                triggerPushBackgroundNotification(noticeData);
            }
            alert("ফায়ারবেজে নোটিশ সফলভাবে পাঠানো হয়েছে!");
        }

        resetForm();
    } catch (error) {
        console.error("Firebase Save Error: ", error);
        alert("ফায়ারবেজে ডাটা সেভ করতে সমস্যা হয়েছে। কনসোলে ত্রুটি দেখুন।");
    }
}

// ফায়ারবেজ থেকে রিয়েল-টাইমে ডাটা নিয়ে আসার লিসেনার
function loadAllFirebaseListsAndListen() {
    const noticesRef = ref(database, 'notices');

    onValue(noticesRef, (snapshot) => {
        const data = snapshot.val();
        let notices = [];

        if (data) {
            notices = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        }

        // রিভার্স অর্ডারে সাজানো যাতে নতুন নোটিশ উপরে থাকে
        notices.reverse();

        const slidingList = document.getElementById("sentSlidingList");
        const homeList = document.getElementById("sentHomeList");
        const pushList = document.getElementById("sentPushList");

        const slidingNotices = notices.filter(n => n.type === 'sliding');
        const homeNotices = notices.filter(n => n.type === 'home');
        const pushNotices = notices.filter(n => n.type === 'push');

        if (slidingList) slidingList.innerHTML = slidingNotices.length === 0 ? `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো স্লাইডিং নোটিশ নেই।</p>` : slidingNotices.map(n => renderNoticeCard(n)).join('');
        if (homeList) homeList.innerHTML = homeNotices.length === 0 ? `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো হোম নোটিশ নেই।</p>` : homeNotices.map(n => renderNoticeCard(n)).join('');
        if (pushList) pushList.innerHTML = pushNotices.length === 0 ? `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো পুশ নোটিশ নেই।</p>` : pushNotices.map(n => renderNoticeCard(n)).join('');

        // স্বয়ংক্রিয়ভাবে লেটেস্ট অ্যাক্টিভ নোটিশ সেট করা
        if (slidingNotices.length > 0) {
            localStorage.setItem("active_sliding_notice", JSON.stringify(slidingNotices[0]));
        } else {
            localStorage.removeItem("active_sliding_notice");
        }

        if (homeNotices.length > 0) {
            localStorage.setItem("active_home_notice", JSON.stringify(homeNotices[0]));
        } else {
            localStorage.removeItem("active_home_notice");
        }

        attachListActionEvents();
        renderActiveNotices();
    }, (error) => {
        console.error("Firebase Read Error: ", error);
    });
}

function triggerPushBackgroundNotification(notice) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notice.title, { 
            body: notice.message, 
            icon: notice.mediaLink || "icons/icon-192.png",
            image: notice.mediaLink || ""
        });
    }
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

    const homeDisabled = localStorage.getItem("home_notice_disabled") === "true";
    const existingPopup = document.getElementById("activeHomeNoticePopupModal");
    if (homeDisabled) {
        if (existingPopup) existingPopup.remove();
    } else {
        const activeHome = JSON.parse(localStorage.getItem("active_home_notice"));
        if (activeHome) showHomeNoticePopup(activeHome);
    }
}

function showSlidingBanner(notice) {
    let ticker = document.getElementById("slidingNoticeTicker");
    if (!ticker) {
        ticker = document.createElement("div");
        ticker.id = "slidingNoticeTicker";
        ticker.style.cssText = "background: var(--bg-card, #ffffff); border-bottom: 1px solid var(--border-color, #e0e0e0); border-top: 1px solid var(--border-color, #e0e0e0); display: flex; align-items: center; overflow: hidden; width: 100%; z-index: 999; box-shadow: 0 1px 3px rgba(0,0,0,0.05);";
        
        const subToolbar = document.querySelector(".sub-toolbar");
        if (subToolbar && subToolbar.parentNode) {
            subToolbar.parentNode.insertBefore(ticker, subToolbar);
        } else {
            document.body.insertBefore(ticker, document.body.firstChild);
        }
    }

    ticker.innerHTML = `
        <div style="background: var(--primary-color, #0d6efd); color: #fff; padding: 6px 12px; font-weight: 600; font-size: 12px; display: flex; align-items: center; gap: 4px; flex-shrink: 0; z-index: 2;">
            🔥 ${notice.title}
        </div>
        <div style="flex: 1; overflow: hidden; white-space: nowrap; padding: 0 10px;">
            <marquee scrollamount="5" style="color: var(--text-main, #333); font-weight: 500; font-size: 13px; display: block; padding-top: 2px;">
                &nbsp;&nbsp;&nbsp;${notice.message}&nbsp;&nbsp;&nbsp;
            </marquee>
        </div>
    `;
}

function showHomeNoticePopup(notice) {
    if (document.getElementById("activeHomeNoticePopupModal")) return;

    let mediaHtml = "";
    let actionBtnHtml = "";

    if (notice.mediaLink) {
        const link = notice.mediaLink.toLowerCase();
        
        if (link.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
            mediaHtml = `
                <div style="margin: 12px 0; text-align: center; background: #000; border-radius: 6px; overflow: hidden;">
                    <img src="${notice.mediaLink}" style="width: 100%; max-height: 280px; object-fit: contain;" alt="Notice Media">
                </div>`;
            actionBtnHtml = `<a href="${notice.mediaLink}" target="_blank" class="primary-btn" style="flex: 1; padding: 10px; background: #0d6efd; color: #fff; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; text-align: center;">ফুল সাইজ ছবি দেখুন</a>`;
        } 
        else if (link.includes("youtube.com") || link.includes("youtu.be") || link.match(/\.(mp4|webm)$/i)) {
            let embedUrl = notice.mediaLink;
            if (link.includes("watch?v=")) {
                embedUrl = notice.mediaLink.replace("watch?v=", "embed/");
            } else if (link.includes("youtu.be/")) {
                embedUrl = notice.mediaLink.replace("youtu.be/", "www.youtube.com/embed/");
            }

            if (link.match(/\.(mp4|webm)$/i)) {
                mediaHtml = `
                    <div style="margin: 12px 0; border-radius: 6px; overflow: hidden; background: #000;">
                        <video controls style="width: 100%; max-height: 250px;"><source src="${notice.mediaLink}" type="video/mp4">আপনার ব্রাউজার ভিডিও সাপোর্ট করে না।</video>
                    </div>`;
            } else {
                mediaHtml = `
                    <div style="margin: 12px 0; border-radius: 6px; overflow: hidden; background: #000; position: relative; padding-bottom: 56.25%; height: 0;">
                        <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allowfullscreen></iframe>
                    </div>`;
            }
            actionBtnHtml = `<a href="${notice.mediaLink}" target="_blank" class="primary-btn" style="flex: 1; padding: 10px; background: #dc3545; color: #fff; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; text-align: center;">ইউটিউব/ভিডিও লিংকে যান</a>`;
        } 
        else {
            actionBtnHtml = `<a href="${notice.mediaLink}" target="_blank" class="primary-btn" style="flex: 1; padding: 10px; background: #0d6efd; color: #fff; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; text-align: center;">লিংকে প্রবেশ করুন</a>`;
        }
    }

    const popupOverlay = document.createElement("div");
    popupOverlay.id = "activeHomeNoticePopupModal";
    popupOverlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 15px;";

    popupOverlay.innerHTML = `
        <div style="background: var(--bg-card, #ffffff); width: 100%; max-width: 500px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.3); overflow: hidden;">
            <div style="background: #0d6efd; color: #fff; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 600;">📢 বিশেষ ঘোষণা</span>
                <button type="button" id="closeHomePopupBtn" style="background: transparent; border: none; color: #fff; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            <div style="padding: 20px; max-height: 75vh; overflow-y: auto;">
                <h2 style="color: var(--text-main, #222); font-size: 22px; font-weight: 700; margin-bottom: 12px; line-height: 1.3;">${notice.title}</h2>
                <p style="color: var(--text-muted, #555); font-size: 13px; line-height: 1.5; margin-bottom: 10px;">${notice.message}</p>
                ${mediaHtml}
                <small style="color: gray; display: block; margin-top: 10px; font-size: 11px;">প্রকাশিত: ${notice.time}</small>
            </div>
            <div style="padding: 12px 20px; background: #f1f3f5; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid var(--border-color, #ddd);">
                ${actionBtnHtml}
                <button type="button" id="closeHomePopupBottomBtn" style="padding: 10px 16px; background: #6c757d; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">বন্ধ করুন</button>
            </div>
        </div>
    `;

    document.body.appendChild(popupOverlay);

    const closePopup = () => popupOverlay.remove();
    document.getElementById("closeHomePopupBtn").addEventListener("click", closePopup);
    document.getElementById("closeHomePopupBottomBtn").addEventListener("click", closePopup);
    popupOverlay.addEventListener("click", (e) => {
        if (e.target === popupOverlay) closePopup();
    });
}

function renderNoticeCard(notif) {
    return `
        <div style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 8px; background: var(--bg-main); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1; padding-right: 8px;">
                <strong style="font-size: 13px; color: var(--text-main); display:block; margin-bottom: 2px;">${notif.title}</strong>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px; line-height: 1.3;">${notif.message}</p>
                ${notif.mediaLink ? `<small style="color: #0d6efd; font-size: 11px; display:block;">লিংক/মিডিয়া সংযুক্ত আছে</small>` : ''}
                <small style="font-size: 10px; color: gray;">${notif.time}</small>
            </div>
            <div style="display: flex; gap: 4px; flex-shrink: 0;">
                <button class="edit-notice-btn" data-id="${notif.id}" style="padding: 4px 8px; font-size: 11px; cursor: pointer; background: #ffc107; color: #000; border: none; border-radius: 4px; font-weight: 500;">এডিট</button>
                <button class="delete-notice-btn" data-id="${notif.id}" data-type="${notif.type}" style="padding: 4px 8px; font-size: 11px; cursor: pointer; background: #dc3545; color: #fff; border: none; border-radius: 4px;">ডিলিট</button>
            </div>
        </div>
    `;
}

function attachListActionEvents() {
    const modal = document.getElementById("notificationModal");

    modal.querySelectorAll(".edit-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            // ফায়ারবেজ থেকে ডাটা নিয়ে এডিট ফর্ম পূরণ করা
            const noticeRef = ref(database, 'notices/' + id);
            import("https://www.gstatic.com/firebasejs/10.x.x/firebase-database.js").then(async ({ get, child }) => {
                const snapshot = await get(noticeRef);
                if (snapshot.exists()) {
                    const noticeToEdit = snapshot.val();
                    document.getElementById("editNoticeId").value = id;
                    
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
                    document.getElementById("cancelEditBtn").classList.remove("hidden");
                    document.querySelector(".notification-body").scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    });

    modal.querySelectorAll(".delete-notice-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            const type = e.target.getAttribute("data-type");
            
            if (confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি ডিলিট করতে চান?")) {
                try {
                    await remove(ref(database, 'notices/' + id));
                    
                    if (type === 'sliding') {
                        const active = JSON.parse(localStorage.getItem("active_sliding_notice"));
                        if (active && active.id === id) {
                            localStorage.removeItem("active_sliding_notice");
                            const ticker = document.getElementById("slidingNoticeTicker");
                            if (ticker) ticker.remove();
                        }
                    } else if (type === 'home') {
                        const active = JSON.parse(localStorage.getItem("active_home_notice"));
                        if (active && active.id === id) {
                            localStorage.removeItem("active_home_notice");
                            const popup = document.getElementById("activeHomeNoticePopupModal");
                            if (popup) popup.remove();
                        }
                    }

                    alert("নোটিশটি সফলভাবে ডিলিট করা হয়েছে!");
                } catch (error) {
                    console.error("Delete Error: ", error);
                    alert("ডিলিট করতে সমস্যা হয়েছে!");
                }
            }
        });
    });
}

function resetForm() {
    document.getElementById("editNoticeId").value = "";
    document.getElementById("slidingTitle").value = "";
    document.getElementById("slidingMessage").value = "";
    document.getElementById("homeTitle").value = "";
    document.getElementById("homeMessage").value = "";
    document.getElementById("homeMediaLink").value = "";
    document.getElementById("pushTitle").value = "";
    document.getElementById("pushMessage").value = "";
    document.getElementById("pushImageLink").value = "";

    document.querySelector(".form-title-sliding").innerText = "স্লাইডিং নোটিশ তৈরি করুন";
    document.querySelector(".form-title-home").innerText = "হোম নোটিশ পপআপ তৈরি করুন";
    document.querySelector(".form-title-push").innerText = "পুশ নোটিশ তৈরি করুন";
    
    document.querySelectorAll(".submit-notice-btn").forEach((el, idx) => {
        const texts = ["স্লাইডিং নোটিশ প্রকাশ করুন", "হোম নোটিশ প্রকাশ করুন", "পুশ নোটিশ পাঠান"];
        el.innerText = texts[idx];
    });

    document.getElementById("cancelEditBtn").classList.add("hidden");
}
