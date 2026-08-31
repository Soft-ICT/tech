/* =========================================
   Notification System Module (Firebase Controlled & Centered Popup with In-App Media)
========================================= */
import { db } from "./firebase-config.js"; // আপনার ফায়ারবেজ কনফিগারেশন ফাইল পাথ অনুযায়ী ঠিক করে নিবেন
import { ref, set, get, update, remove, child, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
    listenToFirebaseNotices();
}

function createNotificationUI() {
    if (document.getElementById("notificationModal")) return;

    const notificationHTML = `
    <!-- নোটিফিকেশন ম্যানেজমেন্ট প্যানেল মোডাল -->
    <div id="notificationModal" class="modal hidden">
        <div class="modal-content notification-modal-content" style="max-width: 680px; width: 95%;">
            <div class="modal-header">
                <h2>📢 নোটিফিকেশন ম্যানেজমেন্ট প্যানেল (ফায়ারবেজ নিয়ন্ত্রিত)</h2>
                <button class="close-btn" data-close="notificationModal" type="button">✕</button>
            </div>
            
            <div class="notification-body" style="max-height: 78vh; overflow-y: auto; padding: 15px;">
                
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
                        <button type="button" class="submit-notice-btn primary-btn" data-type="sliding" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">ফায়ারবেজে প্রকাশ করুন</button>
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
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">৩. মিডিয়া বা ওয়েবসাইট লিংক (ছবি, ইউটিউব ভিডিও বা ওয়েবসাইট URL):</label>
                            <input type="url" id="homeMediaLink" placeholder="https://example.com/image.jpg বা ইউটিউব লিংক" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="home" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">ফায়ারবেজে প্রকাশ করুন</button>
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
                            <label style="display:block; margin-bottom: 4px; font-weight: 500;">৩. ইমেজ লিংক:</label>
                            <input type="url" id="pushImageLink" placeholder="https://example.com/banner.jpg" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="push" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">ফায়ারবেজে পাঠান</button>
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
    </div>

    <!-- সেন্ট্রালাইজড হোম নোটিশ পপ-আপ ডায়লগ (ব্লু কালারবিহীন, সেন্টার অ্যালাইন টেক্সট এবং ইন-অ্যাপ মিডিয়া প্রিভিউ) -->
    <div id="homeNoticePopupModal" class="modal hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(2px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 15px;">
        <div class="modal-content" style="background: var(--bg-card, #ffffff); max-width: 450px; width: 100%; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.25); border: 1px solid var(--border-color, #ddd);">
            
            <div style="background: var(--bg-card, #ffffff); color: var(--text-main, #333); padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, #eee);">
                <span style="font-size: 14px; font-weight: 500; color: #666;">জরুরি নোটিশ</span>
                <button type="button" id="closeHomePopupBtn" style="background: #f1f1f1; border: none; color: #333; width: 28px; height: 28px; border-radius: 50%; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
            </div>

            <!-- মূল বডি: শিরোনাম ও বিস্তারিত সম্পূর্ণ সেন্টারে -->
            <div style="padding: 22px 20px; max-height: 65vh; overflow-y: auto; text-align: center;">
                <h3 id="popupNoticeTitle" style="margin: 0 0 12px 0; font-size: 19px; font-weight: 700; color: var(--text-main, #111); line-height: 1.4;"></h3>
                <p id="popupNoticeMessage" style="margin: 0 0 16px 0; font-size: 13px; color: var(--text-muted, #555); line-height: 1.5; white-space: pre-line;"></p>
                
                <!-- ইন-অ্যাপ মিডিয়া বা ওয়েবসাইট লিংক কন্টেইনার -->
                <div id="popupNoticeMediaContainer" style="margin-bottom: 15px;"></div>
                
                <small id="popupNoticeTime" style="color: #999; font-size: 10px; display: block; margin-top: 10px;"></small>
            </div>

            <div style="padding: 12px 20px; background: var(--bg-main, #f9f9f9); display: flex; justify-content: center; border-top: 1px solid var(--border-color, #eee);">
                <button type="button" id="popupOkBtn" style="background: #333; color: #fff; border: none; padding: 8px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">ঠিক আছে</button>
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
    const closePopupBtn = document.getElementById("closeHomePopupBtn");
    const popupOkBtn = document.getElementById("popupOkBtn");
    const popupModal = document.getElementById("homeNoticePopupModal");

    if (notifBtn) {
        notifBtn.addEventListener("click", () => {
            modal.classList.remove("hidden");
            loadFirebaseNoticesLists();
            updateToggleButtonsUI();
        });
    }

    modal?.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            modal.classList.add("hidden");
            resetForm();
        });
    });

    const closePopupAction = () => {
        if (popupModal) popupModal.classList.add("hidden");
    };
    closePopupBtn?.addEventListener("click", closePopupAction);
    popupOkBtn?.addEventListener("click", closePopupAction);
    
    popupModal?.addEventListener("click", (e) => {
        if (e.target === popupModal) closePopupAction();
    });

    toggleSlidingBtn?.addEventListener("click", () => {
        let isOff = localStorage.getItem("sliding_notice_disabled") === "true";
        localStorage.setItem("sliding_notice_disabled", !isOff);
        updateToggleButtonsUI();
        triggerActiveNoticesRender();
    });

    toggleHomeBtn?.addEventListener("click", () => {
        let isOff = localStorage.getItem("home_notice_disabled") === "true";
        localStorage.setItem("home_notice_disabled", !isOff);
        updateToggleButtonsUI();
        triggerActiveNoticesRender();
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
            handleFirebaseSaveOrUpdate(type);
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

function handleFirebaseSaveOrUpdate(type) {
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
            if (type === 'home' && !editId) {
                showHomeNoticePopup(noticeData);
            }
            resetForm();
            loadFirebaseNoticesLists();
        })
        .catch((error) => {
            alert("ত্রুটি: " + error.message);
        });
}

function listenToFirebaseNotices() {
    const noticesRef = ref(db, 'notices');
    onValue(noticesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const noticesArray = Object.values(data);
            localStorage.setItem("app_custom_notices_firebase", JSON.stringify(noticesArray));
            
            const activeSliding = noticesArray.filter(n => n.type === 'sliding').pop();
            const activeHome = noticesArray.filter(n => n.type === 'home').pop();

            if (activeSliding) localStorage.setItem("active_sliding_notice", JSON.stringify(activeSliding));
            if (activeHome) {
                const prevHomeId = localStorage.getItem("last_shown_home_id");
                localStorage.setItem("active_home_notice", JSON.stringify(activeHome));
                
                if (prevHomeId !== String(activeHome.id)) {
                    setTimeout(() => {
                        const homeDisabled = localStorage.getItem("home_notice_disabled") === "true";
                        if (!homeDisabled) {
                            showHomeNoticePopup(activeHome);
                            localStorage.setItem("last_shown_home_id", activeHome.id);
                        }
                    }, 800);
                }
            }
        }
        triggerActiveNoticesRender();
    });
}

function triggerActiveNoticesRender() {
    const slidingDisabled = localStorage.getItem("sliding_notice_disabled") === "true";
    const ticker = document.getElementById("slidingNoticeTicker");
    if (slidingDisabled) {
        if (ticker) ticker.remove();
    } else {
        const activeSliding = JSON.parse(localStorage.getItem("active_sliding_notice"));
        if (activeSliding) {
            showSlidingBanner(activeSliding);
        }
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
        <div style="background: #333; color: #fff; padding: 6px 12px; font-weight: 600; font-size: 12px; display: flex; align-items: center; gap: 4px; flex-shrink: 0; z-index: 2;">
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
    const popupModal = document.getElementById("homeNoticePopupModal");
    if (!popupModal) return;

    document.getElementById("popupNoticeTitle").innerText = notice.title;
    document.getElementById("popupNoticeMessage").innerText = notice.message;
    document.getElementById("popupNoticeTime").innerText = "প্রকাশিত: " + notice.time;

    const mediaContainer = document.getElementById("popupNoticeMediaContainer");
    mediaContainer.innerHTML = "";

    if (notice.mediaLink) {
        const link = notice.mediaLink.trim();
        const lowerLink = link.toLowerCase();
        
        // ১. ছবি বা ইমেজ ফাইল হলে সরাসরি পপআপের ভেতরে দেখাবে
        if (lowerLink.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
            mediaContainer.innerHTML = `
                <div style="text-align: center; background: rgba(0,0,0,0.02); border-radius: 8px; padding: 6px; border: 1px solid var(--border-color, #eee);">
                    <img src="${link}" style="max-width: 100%; max-height: 220px; border-radius: 6px; object-fit: contain;" alt="Notice Image">
                </div>`;
        } 
        // ২. ইউটিউব ভিডিও লিংক হলে পপআপের ভেতরে ইন-অ্যাপ ভিডিও প্লেয়ার (iframe) দেখাবে
        else if (lowerLink.includes("youtube.com") || lowerLink.includes("youtu.be")) {
            let videoId = "";
            if (lowerLink.includes("youtu.be/")) {
                videoId = link.split("youtu.be/")[1]?.split("?")[0];
            } else if (lowerLink.includes("watch?v=")) {
                videoId = link.split("watch?v=")[1]?.split("&")[0];
            }

            if (videoId) {
                mediaContainer.innerHTML = `
                    <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; border-radius: 8px; overflow: hidden; background: #000;">
                        <iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allowfullscreen></iframe>
                    </div>`;
            } else {
                mediaContainer.innerHTML = `
                    <div style="text-align: center; padding: 5px;">
                        <a href="${link}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #0d6efd; color: #fff; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">ভিডিও দেখতে ক্লিক করুন</a>
                    </div>`;
            }
        } 
        // ৩. ডাইরেক্ট ভিডিও ফাইল (.mp4 ইত্যাদি) হলে
        else if (lowerLink.match(/\.(mp4|webm|ogg)$/i)) {
            mediaContainer.innerHTML = `
                <div style="text-align: center; background: #000; border-radius: 8px; overflow: hidden;">
                    <video controls style="width: 100%; max-height: 200px;">
                        <source src="${link}" type="video/mp4">
                        আপনার ব্রাউজার ভিডিও ট্যাগ সমর্থন করছে না।
                    </video>
                </div>`;
        } 
        // ৪. সাধারণ ওয়েবসাইট লিংক হলে সুন্দর বাটন হিসেবে দেখাবে
        else {
            mediaContainer.innerHTML = `
                <div style="text-align: center; padding: 5px;">
                    <a href="${link}" target="_blank" style="display: inline-block; width: 100%; padding: 10px 16px; background: #0d6efd; color: #fff; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; box-sizing: border-box; text-align: center;">🌐 ওয়েবসাইট ভিজিট করুন</a>
                </div>`;
        }
    }

    popupModal.classList.remove("hidden");
}

function loadFirebaseNoticesLists() {
    const notices = JSON.parse(localStorage.getItem("app_custom_notices_firebase") || "[]");

    const slidingList = document.getElementById("sentSlidingList");
    const homeList = document.getElementById("sentHomeList");
    const pushList = document.getElementById("sentPushList");

    const slidingNotices = notices.filter(n => n.type === 'sliding');
    const homeNotices = notices.filter(n => n.type === 'home');
    const pushNotices = notices.filter(n => n.type === 'push');

    slidingList.innerHTML = slidingNotices.length === 0 ? `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো স্লাইডিং নোটিশ নেই।</p>` : slidingNotices.map(n => renderNoticeCard(n)).join('');
    homeList.innerHTML = homeNotices.length === 0 ? `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো হোম নোটিশ নেই।</p>` : homeNotices.map(n => renderNoticeCard(n)).join('');
    pushList.innerHTML = pushNotices.length === 0 ? `<p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো পুশ নোটিশ নেই।</p>` : pushNotices.map(n => renderNoticeCard(n)).join('');

    attachListActionEvents();
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
                <button class="delete-notice-btn" data-id="${notif.id}" style="padding: 4px 8px; font-size: 11px; cursor: pointer; background: #dc3545; color: #fff; border: none; border-radius: 4px;">ডিলিট</button>
            </div>
        </div>
    `;
}

function attachListActionEvents() {
    const modal = document.getElementById("notificationModal");

    modal.querySelectorAll(".edit-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            let notices = JSON.parse(localStorage.getItem("app_custom_notices_firebase") || "[]");
            const noticeToEdit = notices.find(n => n.id === id);
            
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
                
                modal.querySelectorAll(".submit-notice-btn").forEach(el => el.innerText = "ফায়ারবেজে আপডেট করুন");
                document.getElementById("cancelEditBtn").classList.remove("hidden");
                document.querySelector(".notification-body").scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    modal.querySelectorAll(".delete-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            
            if (confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি ডিলিট করতে চান?")) {
                remove(ref(db, 'notices/' + id))
                    .then(() => {
                        alert("নোটিশটি সফলভাবে ডিলিট করা হয়েছে!");
                        loadFirebaseNoticesLists();
                    })
                    .catch((error) => {
                        alert("ডিলিট করতে সমস্যা হয়েছে: " + error.message);
                    });
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
    
    document.querySelectorAll(".submit-notice-btn").forEach((el, idx) => {
        const texts = ["ফায়ারবেজে প্রকাশ করুন", "ফায়ারবেজে প্রকাশ করুন", "ফায়ারবেজে পাঠান"];
        el.innerText = texts[idx];
    });

    document.getElementById("cancelEditBtn").classList.add("hidden");
}
