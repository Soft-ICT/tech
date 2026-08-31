/* =========================================
   Notification System Module (Firebase Firestore Version)
========================================= */

import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    setDoc,
    getDoc,
    serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase-config.js"; // আপনার প্রজেক্টের ফায়ারবেজ কনফিগ ফাইলের পাথ এখানে দিন

export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
    renderActiveNotices();
}

function createNotificationUI() {
    if (document.getElementById("notificationModal")) return;

    const notificationHTML = `
    <div id="notificationModal" class="modal hidden">
        <div class="modal-content notification-modal-content" style="max-width: 680px; width: 95%;">
            <div class="modal-header">
                <h2>📢 নোটিফিকেশন ম্যানেজমেন্ট প্যানেল (ফায়ারবেজ)</h2>
                <button class="close-btn" data-close="notificationModal" type="button">✕</button>
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
                            <p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">লোড হচ্ছে...</p>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: HOME NOTICE -->
                <div id="tabHome" class="notice-tab-content hidden">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h3 class="form-title-home" style="margin: 0; font-size: 16px; color: var(--text-main);">হোম নোটিশ তৈরি করুন</h3>
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
                            <input type="url" id="homeMediaLink" placeholder="https://example.com/image.jpg বা video/site link" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="home" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">হোম নোটিশ প্রকাশ করুন</button>
                    </div>

                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px; color: var(--text-main);">হোম নোটিশের তালিকা</h4>
                        <div id="sentHomeList" class="notification-list">
                            <p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">লোড হচ্ছে...</p>
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
                            <p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">লোড হচ্ছে...</p>
                        </div>
                    </div>
                </div>

                <button id="cancelEditBtn" class="secondary-btn hidden" type="button" style="width: 100%; padding: 8px; margin-top: 15px; background: #6c757d; color: #fff; border: none; border-radius: 4px; cursor: pointer;">এডিট বাতিল করুন</button>

            </div>
            <div class="modal-actions" style="padding: 10px 15px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 10px;">
                <button class="secondary-btn" data-close="notificationModal" type="button">বন্ধ করুন</button>
            </div>
        </div>
    </div>`;

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
            loadAllSeparateLists();
            updateToggleButtonsUI();
        });
    }

    modal?.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            modal.classList.add("hidden");
            resetForm();
        });
    });

    toggleSlidingBtn?.addEventListener("click", async () => {
        let isOff = localStorage.getItem("sliding_notice_disabled") === "true";
        localStorage.setItem("sliding_notice_disabled", !isOff);
        updateToggleButtonsUI();
        renderActiveNotices();
    });

    toggleHomeBtn?.addEventListener("click", async () => {
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
            handleSaveOrUpdateNotice(type);
        });
    });

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            resetForm();
        });
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

async function handleSaveOrUpdateNotice(type) {
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
        const timeStr = new Date().toLocaleString('bn-BD');

        if (editId) {
            // Firestore-এ ডকুমেন্ট আপডেট করা
            const noticeRef = doc(db, "notices", editId);
            await updateDoc(noticeRef, {
                title,
                message,
                mediaLink,
                time: timeStr + " (এডিটেড)"
            });
            alert("নোটিশ সফলভাবে আপডেট করা হয়েছে!");
        } else {
            // Firestore-এ নতুন নোটিশ সেভ করা
            const newNoticeData = {
                type,
                title,
                message,
                mediaLink,
                time: timeStr,
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, "notices"), newNoticeData);

            // যদি স্লাইডিং বা হোম নোটিশ হয়, তবে ফায়ারবেজের একক একটিভ ডকুমেন্ট বা লোকাল স্টোরেজে লেটেস্ট সেট করা
            if (type === 'push') {
                triggerPushBackgroundNotification({ title, message, mediaLink });
            }
            alert("নোটিশ সফলভাবে প্রকাশ করা হয়েছে!");
        }

        resetForm();
        loadAllSeparateLists();
        renderActiveNotices();
    } catch (error) {
        console.error("Error saving notice: ", error);
        alert("নোটিশ সেভ করতে সমস্যা হয়েছে: " + error.message);
    }
}

function triggerPushBackgroundNotification(notice) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notice.title, { 
            body: notice.message, 
            icon: notice.mediaLink || "icons/icon-192.png",
            image: notice.mediaLink || ""
        });
    } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(notice.title, { 
                    body: notice.message, 
                    icon: notice.mediaLink || "icons/icon-192.png",
                    image: notice.mediaLink || ""
                });
            }
        });
    }
}

export async function renderActiveNotices() {
    const slidingDisabled = localStorage.getItem("sliding_notice_disabled") === "true";
    const ticker = document.getElementById("slidingNoticeTicker");
    
    try {
        const querySnapshot = await getDocs(collection(db, "notices"));
        let notices = [];
        querySnapshot.forEach((docSnap) => {
            notices.push({ id: docSnap.id, ...docSnap.data() });
        });

        // লেটেস্ট স্লাইডিং নোটিশ খুঁজে বের করা
        const slidingNotices = notices.filter(n => n.type === 'sliding');
        if (slidingDisabled) {
            if (ticker) ticker.remove();
        } else if (slidingNotices.length > 0) {
            // ক্রিয়েটেড টাইম অনুযায়ী সর্ট করে লেটেস্টটি নেওয়া
            slidingNotices.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            showSlidingBanner(slidingNotices[0]);
        }

        // লেটেস্ট হোম নোটিশ খুঁজে বের করা
        const homeDisabled = localStorage.getItem("home_notice_disabled") === "true";
        const homeContainer = document.getElementById("allSearchContainer");
        const homeNotices = notices.filter(n => n.type === 'home');

        if (homeContainer) {
            if (homeDisabled) {
                const bannerEl = document.getElementById("activeHomeNoticeBanner");
                if (bannerEl) bannerEl.remove();
            } else if (homeNotices.length > 0) {
                homeNotices.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                showHomeNoticeBanner(homeNotices[0]);
            }
        }
    } catch (error) {
        console.error("Error rendering active notices from Firebase:", error);
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

function showHomeNoticeBanner(notice) {
    let container = document.getElementById("allSearchContainer");
    if (container) {
        container.classList.remove("hidden");
        
        let existingBanner = document.getElementById("activeHomeNoticeBanner");
        if (existingBanner) existingBanner.remove();

        let mediaHtml = "";
        if (notice.mediaLink) {
            const link = notice.mediaLink.toLowerCase();
            if (link.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                mediaHtml = `<div style="margin-top: 10px;"><img src="${notice.mediaLink}" style="max-width: 100%; max-height: 220px; border-radius: 6px; object-fit: cover;" alt="Notice Media"></div>`;
            } else if (link.includes("youtube.com") || link.includes("youtu.be") || link.match(/\.(mp4|webm)$/i)) {
                mediaHtml = `<div style="margin-top: 10px; font-size: 13px;"><a href="${notice.mediaLink}" target="_blank" style="color: #0d6efd; text-decoration: underline; font-weight: 600;">🎥 ভিডিও লিংক ওপেন করুন</a></div>`;
            } else {
                mediaHtml = `<div style="margin-top: 10px;"><a href="${notice.mediaLink}" target="_blank" class="primary-btn" style="display: inline-block; padding: 6px 14px; background: #0d6efd; color: #fff; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500;">ওপেন লিংক</a></div>`;
            }
        }

        const bannerDiv = document.createElement("div");
        bannerDiv.id = "activeHomeNoticeBanner";
        bannerDiv.style.cssText = "background: var(--bg-card, #e3f2fd); border-left: 4px solid #0d6efd; padding: 12px; border-radius: 6px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);";
        bannerDiv.innerHTML = `
            <h4 style="color: #0d6efd; margin-bottom: 5px; font-size: 15px;">📌 ${notice.title}</h4>
            <p style="margin: 0; font-size: 14px; color: var(--text-main); line-height: 1.4;">${notice.message}</p>
            ${mediaHtml}
            <small style="color: gray; display: block; margin-top: 6px; font-size: 11px;">প্রকাশিত: ${notice.time}</small>
        `;

        container.prepend(bannerDiv);
    }
}

async function loadAllSeparateLists() {
    const slidingList = document.getElementById("sentSlidingList");
    const homeList = document.getElementById("sentHomeList");
    const pushList = document.getElementById("sentPushList");

    slidingList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">লোড হচ্ছে...</p>`;
    homeList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">লোড হচ্ছে...</p>`;
    pushList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">লোড হচ্ছে...</p>`;

    try {
        const querySnapshot = await getDocs(collection(db, "notices"));
        let notices = [];
        querySnapshot.forEach((docSnap) => {
            notices.push({ id: docSnap.id, ...docSnap.data() });
        });

        const slidingNotices = notices.filter(n => n.type === 'sliding');
        const homeNotices = notices.filter(n => n.type === 'home');
        const pushNotices = notices.filter(n => n.type === 'push');

        slidingList.innerHTML = slidingNotices.length === 0 ? 
            `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো স্লাইডিং নোটিশ নেই।</p>` : 
            slidingNotices.map(n => renderNoticeCard(n)).join('');

        homeList.innerHTML = homeNotices.length === 0 ? 
            `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো হোম নোটিশ নেই।</p>` : 
            homeNotices.map(n => renderNoticeCard(n)).join('');

        pushList.innerHTML = pushNotices.length === 0 ? 
            `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো পুশ নোটিশ নেই।</p>` : 
            pushNotices.map(n => renderNoticeCard(n)).join('');

        attachListActionEvents(notices);
    } catch (error) {
        console.error("Error loading notices from Firebase:", error);
        slidingList.innerHTML = `<p style="color:red; text-align:center;">লোড করতে সমস্যা হয়েছে।</p>`;
        homeList.innerHTML = `<p style="color:red; text-align:center;">লোড করতে সমস্যা হয়েছে।</p>`;
        pushList.innerHTML = `<p style="color:red; text-align:center;">লোড করতে সমস্যা হয়েছে।</p>`;
    }
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

function attachListActionEvents(notices) {
    const modal = document.getElementById("notificationModal");

    modal.querySelectorAll(".edit-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            const noticeToEdit = notices.find(n => n.id === id);
            
            if (noticeToEdit) {
                document.getElementById("editNoticeId").value = noticeToEdit.id;
                
                const targetTabBtn = modal.querySelector(`.tab-btn[data-target="tab${noticeToEdit.type.charAt(0).toUpperCase() + noticeToEdit.type.slice(1)}"]`);
                if (targetTabBtn) targetTabBtn.click();

                if (noticeToEdit.type === 'sliding') {
                    document.getElementById("slidingTitle").value = noticeToEdit.title;
                    document.getElementById("slidingMessage").value = noticeToEdit.message;
                    document.querySelector(".form-title-sliding").innerText = "স্লাইডিং নোটিশ এডিট করুন";
                } else if (noticeToEdit.type === 'home') {
                    document.getElementById("homeTitle").value = noticeToEdit.title;
                    document.getElementById("homeMessage").value = noticeToEdit.message;
                    document.getElementById("homeMediaLink").value = noticeToEdit.mediaLink || "";
                    document.querySelector(".form-title-home").innerText = "হোম নোটিশ এডিট করুন";
                } else if (noticeToEdit.type === 'push') {
                    document.getElementById("pushTitle").value = noticeToEdit.title;
                    document.getElementById("pushMessage").value = noticeToEdit.message;
                    document.getElementById("pushImageLink").value = noticeToEdit.mediaLink || "";
                    document.querySelector(".form-title-push").innerText = "পুশ নোটিশ এডিট করুন";
                }
                
                modal.querySelectorAll(".submit-notice-btn").forEach(el => el.innerText = "আপডেট করুন");
                document.getElementById("cancelEditBtn").classList.remove("hidden");
                document.querySelector(".notification-body").scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    modal.querySelectorAll(".delete-notice-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            const type = e.target.getAttribute("data-type");
            
            if (confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি ডিলিট করতে চান?")) {
                try {
                    await deleteDoc(doc(db, "notices", id));

                    if (type === 'sliding') {
                        const ticker = document.getElementById("slidingNoticeTicker");
                        if (ticker) ticker.remove();
                    } else if (type === 'home') {
                        const banner = document.getElementById("activeHomeNoticeBanner");
                        if (banner) banner.remove();
                    }

                    loadAllSeparateLists();
                    renderActiveNotices();
                    alert("নোটিশটি সফলভাবে ডিলিট করা হয়েছে!");
                } catch (error) {
                    console.error("Error deleting document: ", error);
                    alert("ডিলিট করতে সমস্যা হয়েছে: " + error.message);
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
    document.querySelector(".form-title-home").innerText = "হোম নোটিশ তৈরি করুন";
    document.querySelector(".form-title-push").innerText = "পুশ নোটিশ তৈরি করুন";
    
    document.querySelectorAll(".submit-notice-btn").forEach((el, idx) => {
        const texts = ["স্লাইডিং নোটিশ প্রকাশ করুন", "হোম নোটিশ প্রকাশ করুন", "পুশ নোটিশ পাঠান"];
        el.innerText = texts[idx];
    });

    document.getElementById("cancelEditBtn").classList.add("hidden");
}

