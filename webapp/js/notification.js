/* =========================================
   Notification System Module (Popup Dialog for Home Notice)
========================================= */

export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
    renderActiveNotices();
}

function createNotificationUI() {
    if (document.getElementById("notificationModal")) return;

    const notificationHTML = `
    <!-- নোটিফিকেশন ম্যানেজমেন্ট প্যানেল মোডাল -->
    <div id="notificationModal" class="modal hidden">
        <div class="modal-content notification-modal-content" style="max-width: 680px; width: 95%;">
            <div class="modal-header">
                <h2>📢 নোটিফিকেশন ম্যানেজমেন্ট প্যানেল</h2>
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
                            <p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো স্লাইডিং নোটিশ নেই।</p>
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
                            <p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো হোম নোটিশ নেই।</p>
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
                            <p class="text-muted" style="text-align: center; padding: 10px; font-size: 13px;">কোনো পুশ নোটিশ নেই।</p>
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

    <!-- হোম নোটিশ পপ-আপ ডায়লগ (User Popup Dialog) -->
    <div id="homeNoticePopupModal" class="modal hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center;">
        <div class="modal-content" style="background: var(--bg-card, #ffffff); max-width: 450px; width: 90%; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.3); animation: scaleUp 0.3s ease;">
            <div style="background: #0d6efd; color: #fff; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
                <h3 id="popupNoticeTitle" style="margin: 0; font-size: 16px;">📢 নোটিশ</h3>
                <button type="button" id="closeHomePopupBtn" style="background: none; border: none; color: #fff; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            <div style="padding: 18px; max-height: 60vh; overflow-y: auto;">
                <p id="popupNoticeMessage" style="margin: 0 0 15px 0; font-size: 14px; color: var(--text-main); line-height: 1.5;"></p>
                <div id="popupNoticeMediaContainer"></div>
                <small id="popupNoticeTime" style="color: gray; display: block; margin-top: 12px; font-size: 11px;"></small>
            </div>
            <div style="padding: 10px 18px; background: var(--bg-main, #f1f1f1); display: flex; justify-content: flex-end;">
                <button type="button" id="popupOkBtn" style="background: #0d6efd; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;">ঠিক আছে</button>
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

    // Home Popup Close Events
    const closePopupAction = () => {
        if (popupModal) popupModal.classList.add("hidden");
    };
    closePopupBtn?.addEventListener("click", closePopupAction);
    popupOkBtn?.addEventListener("click", closePopupAction);

    // Global Toggle Listeners
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

    // Tab Switching Logic
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

function handleSaveOrUpdateNotice(type) {
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

    let notices = JSON.parse(localStorage.getItem("app_custom_notices") || "[]");

    if (editId) {
        notices = notices.map(n => {
            if (n.id == editId) {
                return { ...n, type, title, message, mediaLink, time: new Date().toLocaleString('bn-BD') + " (এডিটেড)" };
            }
            return n;
        });
        alert("নোটিশ সফলভাবে আপডেট করা হয়েছে!");
    } else {
        const newNotice = {
            id: Date.now(),
            type,
            title,
            message,
            mediaLink,
            time: new Date().toLocaleString('bn-BD')
        };
        notices.unshift(newNotice);

        if (type === 'sliding') {
            localStorage.setItem("active_sliding_notice", JSON.stringify(newNotice));
        } else if (type === 'home') {
            localStorage.setItem("active_home_notice", JSON.stringify(newNotice));
            showHomeNoticePopup(newNotice); // প্রকাশ করার সাথে সাথেই পপ-আপ দেখাবে
        } else if (type === 'push') {
            triggerPushBackgroundNotification(newNotice);
        }
        alert("নোটিশ সফলভাবে প্রকাশ করা হয়েছে!");
    }

    localStorage.setItem("app_custom_notices", JSON.stringify(notices));

    const latestOfType = notices.find(n => n.type === type);
    if (latestOfType) {
        if (type === 'sliding') localStorage.setItem("active_sliding_notice", JSON.stringify(latestOfType));
        if (type === 'home') localStorage.setItem("active_home_notice", JSON.stringify(latestOfType));
    }

    resetForm();
    loadAllSeparateLists();
    renderActiveNotices();
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

export function renderActiveNotices() {
    // 1. Render Sliding Notice
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

    // 2. Render Home Notice Popup on App Load (যদি হোম নোটিশ বন্ধ না থাকে)
    const homeDisabled = localStorage.getItem("home_notice_disabled") === "true";
    if (!homeDisabled) {
        const activeHome = JSON.parse(localStorage.getItem("active_home_notice"));
        if (activeHome) {
            // পেজ লোড হওয়ার পর পপ-আপ দেখানোর জন্য সামান্য ডিলে
            setTimeout(() => {
                showHomeNoticePopup(activeHome);
            }, 500);
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
    const popupModal = document.getElementById("homeNoticePopupModal");
    if (!popupModal) return;

    document.getElementById("popupNoticeTitle").innerText = "📌 " + notice.title;
    document.getElementById("popupNoticeMessage").innerText = notice.message;
    document.getElementById("popupNoticeTime").innerText = "প্রকাশিত: " + notice.time;

    const mediaContainer = document.getElementById("popupNoticeMediaContainer");
    mediaContainer.innerHTML = "";

    if (notice.mediaLink) {
        const link = notice.mediaLink.toLowerCase();
        if (link.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
            mediaContainer.innerHTML = `<div style="margin-top: 10px; text-align: center;"><img src="${notice.mediaLink}" style="max-width: 100%; max-height: 250px; border-radius: 6px; object-fit: contain;" alt="Notice Image"></div>`;
        } else if (link.includes("youtube.com") || link.includes("youtu.be") || link.match(/\.(mp4|webm)$/i)) {
            mediaContainer.innerHTML = `<div style="margin-top: 10px; text-align: center;"><a href="${notice.mediaLink}" target="_blank" class="primary-btn" style="display: inline-block; padding: 8px 16px; background: #dc3545; color: #fff; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 500;">🎥 ভিডিও লিংক ওপেন করুন</a></div>`;
        } else {
            mediaContainer.innerHTML = `<div style="margin-top: 10px; text-align: center;"><a href="${notice.mediaLink}" target="_blank" class="primary-btn" style="display: inline-block; padding: 8px 18px; background: #0d6efd; color: #fff; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 500;">ওপেন লিংক</a></div>`;
        }
    }

    popupModal.classList.remove("hidden");
}

function loadAllSeparateLists() {
    let notices = JSON.parse(localStorage.getItem("app_custom_notices") || "[]");

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
                <button class="delete-notice-btn" data-id="${notif.id}" data-type="${notif.type}" style="padding: 4px 8px; font-size: 11px; cursor: pointer; background: #dc3545; color: #fff; border: none; border-radius: 4px;">ডিলিট</button>
            </div>
        </div>
    `;
}

function attachListActionEvents() {
    const modal = document.getElementById("notificationModal");

    modal.querySelectorAll(".edit-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = Number(e.target.getAttribute("data-id"));
            let notices = JSON.parse(localStorage.getItem("app_custom_notices") || "[]");
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
        btn.addEventListener("click", (e) => {
            const id = Number(e.target.getAttribute("data-id"));
            const type = e.target.getAttribute("data-type");
            
            let notices = JSON.parse(localStorage.getItem("app_custom_notices") || "[]");
            notices = notices.filter(n => n.id !== id);
            localStorage.setItem("app_custom_notices", JSON.stringify(notices));

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
                    const popup = document.getElementById("homeNoticePopupModal");
                    if (popup) popup.classList.add("hidden");
                }
            }

            loadAllSeparateLists();
            renderActiveNotices();
            alert("নোটিশটি সফলভাবে ডিলিট করা হয়েছে!");
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
