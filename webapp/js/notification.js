/* =========================================
   Notification System Module (Tabbed View Pager & Media Support)
========================================= */

export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
    renderActiveSlidingNotice();
}

function createNotificationUI() {
    if (document.getElementById("notificationModal")) return;

    const notificationHTML = `
    <div id="notificationModal" class="modal hidden">
        <div class="modal-content notification-modal-content" style="max-width: 650px; width: 95%;">
            <div class="modal-header">
                <h2>📢 নোটিফিকেশন ম্যানেজমেন্ট প্যানেল</h2>
                <button class="close-btn" data-close="notificationModal" type="button">✕</button>
            </div>
            
            <div class="notification-body" style="max-height: 75vh; overflow-y: auto; padding: 15px;">
                
                <!-- View Pager / Tabs Navigation -->
                <div class="notice-tabs" style="display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 2px solid var(--border-color, #ddd); padding-bottom: 10px;">
                    <button type="button" class="tab-btn active-tab" data-target="tabSliding" style="flex: 1; padding: 8px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Scrolling Notice</button>
                    <button type="button" class="tab-btn" data-target="tabHome" style="flex: 1; padding: 8px; background: #e9ecef; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Home Notice</button>
                    <button type="button" class="tab-btn" data-target="tabPush" style="flex: 1; padding: 8px; background: #e9ecef; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Push Notice</button>
                </div>

                <input type="hidden" id="editNoticeId" value="">
                <input type="hidden" id="activeNoticeType" value="sliding">

                <!-- TAB 1: SCROLLING NOTICE -->
                <div id="tabSliding" class="notice-tab-content">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 20px;">
                        <h3 class="form-title-text" style="margin-bottom: 12px; font-size: 16px; color: var(--text-main);">স্লাইডিং নোটিশ তৈরি করুন</h3>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display:block; margin-bottom: 5px; font-weight: 500;">১. শিরোনাম:</label>
                            <input type="text" id="slidingTitle" placeholder="যেমন: BREAKING NEWS" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display:block; margin-bottom: 5px; font-weight: 500;">২. বিস্তারিত:</label>
                            <textarea id="slidingMessage" rows="3" placeholder="বিস্তারিত লিখুন..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="sliding" style="width: 100%; padding: 10px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">স্লাইডিং নোটিশ প্রকাশ করুন</button>
                    </div>
                </div>

                <!-- TAB 2: HOME NOTICE -->
                <div id="tabHome" class="notice-tab-content hidden">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 20px;">
                        <h3 class="form-title-text" style="margin-bottom: 12px; font-size: 16px; color: var(--text-main);">হোম নোটিশ তৈরি করুন</h3>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display:block; margin-bottom: 5px; font-weight: 500;">১. শিরোনাম:</label>
                            <input type="text" id="homeTitle" placeholder="নোটিশের শিরোনাম..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display:block; margin-bottom: 5px; font-weight: 500;">২. বিস্তারিত:</label>
                            <textarea id="homeMessage" rows="3" placeholder="বিস্তারিত বিবরণ..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display:block; margin-bottom: 5px; font-weight: 500;">৩. মিডিয়া বা সাইট লিংক (ইমেজ / ভিডিও / ওয়েবসাইট URL):</label>
                            <input type="url" id="homeMediaLink" placeholder="https://example.com/image.jpg বা video/site link" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="home" style="width: 100%; padding: 10px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">হোম নোটিশ প্রকাশ করুন</button>
                    </div>
                </div>

                <!-- TAB 3: PUSH NOTICE -->
                <div id="tabPush" class="notice-tab-content hidden">
                    <div class="card" style="padding: 15px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 20px;">
                        <h3 class="form-title-text" style="margin-bottom: 12px; font-size: 16px; color: var(--text-main);">পুশ নোটিশ তৈরি করুন</h3>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display:block; margin-bottom: 5px; font-weight: 500;">১. শিরোনাম:</label>
                            <input type="text" id="pushTitle" placeholder="পুশ নোটিফিকেশন শিরোনাম..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display:block; margin-bottom: 5px; font-weight: 500;">২. বিস্তারিত:</label>
                            <textarea id="pushMessage" rows="3" placeholder="পুশ মেসেজ..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display:block; margin-bottom: 5px; font-weight: 500;">৩. ইমেজ লিংক (নোটিফিকেশন ব্যানার ইমেজ):</label>
                            <input type="url" id="pushImageLink" placeholder="https://example.com/banner.jpg" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                        </div>
                        <button type="button" class="submit-notice-btn primary-btn" data-type="push" style="width: 100%; padding: 10px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">পুশ নোটিশ পাঠান</button>
                    </div>
                </div>

                <button id="cancelEditBtn" class="secondary-btn hidden" type="button" style="width: 100%; padding: 8px; margin-bottom: 15px; background: #6c757d; color: #fff; border: none; border-radius: 4px; cursor: pointer;">এডিট বাতিল করুন</button>

                <!-- পাঠানো নোটিশগুলোর তালিকা -->
                <div>
                    <h3 style="margin-bottom: 10px; font-size: 16px; color: var(--text-main);">সাম্প্রতিক পাঠানো নোটিশসমূহ</h3>
                    <div id="sentNoticeList" class="notification-list">
                        <p class="text-muted" style="text-align: center; padding: 15px;">কোনো নোটিশ পাঠানো হয়নি।</p>
                    </div>
                </div>

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

    if (notifBtn) {
        notifBtn.addEventListener("click", () => {
            modal.classList.remove("hidden");
            loadSentNotices();
        });
    }

    modal?.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            modal.classList.add("hidden");
            resetForm();
        });
    });

    // Tab Switching Logic (View Pager)
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

            if (targetTab === 'tabSliding') document.getElementById("activeNoticeType").value = "sliding";
            if (targetTab === 'tabHome') document.getElementById("activeNoticeType").value = "home";
            if (targetTab === 'tabPush') document.getElementById("activeNoticeType").value = "push";
        });
    });

    // Submit / Save Buttons
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
            showSlidingBanner(newNotice);
        } else {
            executeNoticeAction(newNotice);
        }
        alert("নোটিশ সফলভাবে প্রকাশ করা হয়েছে!");
    }

    localStorage.setItem("app_custom_notices", JSON.stringify(notices));

    if (type === 'sliding') {
        const updatedActive = notices.find(n => n.id == (editId || notices[0].id));
        if (updatedActive) {
            localStorage.setItem("active_sliding_notice", JSON.stringify(updatedActive));
            showSlidingBanner(updatedActive);
        }
    }

    resetForm();
    loadSentNotices();
}

function executeNoticeAction(notice) {
    if (notice.type === 'home') {
        showHomeNoticeBanner(notice);
    } else if (notice.type === 'push') {
        triggerPushBackgroundNotification(notice);
    }
}

export function renderActiveSlidingNotice() {
    const activeNotice = JSON.parse(localStorage.getItem("active_sliding_notice"));
    if (activeNotice) {
        showSlidingBanner(activeNotice);
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
        
        let mediaHtml = "";
        if (notice.mediaLink) {
            const link = notice.mediaLink.toLowerCase();
            if (link.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                mediaHtml = `<div style="margin-top: 10px;"><img src="${notice.mediaLink}" style="max-width: 100%; max-height: 200px; border-radius: 6px;" alt="Notice Media"></div>`;
            } else if (link.includes("youtube.com") || link.includes("youtu.be") || link.match(/\.(mp4|webm)$/i)) {
                mediaHtml = `<div style="margin-top: 10px; font-size: 13px;"><a href="${notice.mediaLink}" target="_blank" style="color: #0d6efd; text-decoration: underline;">🎥 ভিডিও লিংক ওপেন করুন</a></div>`;
            } else {
                mediaHtml = `<div style="margin-top: 10px;"><a href="${notice.mediaLink}" target="_blank" class="primary-btn" style="display: inline-block; padding: 6px 12px; background: #0d6efd; color: #fff; border-radius: 4px; text-decoration: none; font-size: 13px;">ওপেন লিংক</a></div>`;
            }
        }

        container.innerHTML = `
            <div style="background: var(--bg-card, #e3f2fd); border-left: 4px solid #0d6efd; padding: 12px; border-radius: 4px; margin-bottom: 15px;">
                <h4 style="color: #0d6efd; margin-bottom: 5px;">📌 ${notice.title}</h4>
                <p style="margin: 0; font-size: 14px;">${notice.message}</p>
                ${mediaHtml}
                <small style="color: gray; display: block; margin-top: 5px;">প্রকাশিত: ${notice.time}</small>
            </div>
        ` + container.innerHTML;
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

function loadSentNotices() {
    const listContainer = document.getElementById("sentNoticeList");
    let notices = JSON.parse(localStorage.getItem("app_custom_notices") || "[]");

    if (notices.length === 0) {
        listContainer.innerHTML = `<p class="text-muted" style="text-align: center; padding: 15px;">কোনো নোটিশ পাঠানো হয়নি।</p>`;
        return;
    }

    const typeNames = {
        'sliding': 'স্লাইডিং নোটিশ',
        'push': 'পুশ নোটিশ',
        'home': 'হোম নোটিশ'
    };

    listContainer.innerHTML = notices.map(notif => `
        <div style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 8px; background: var(--bg-main); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1; padding-right: 10px;">
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                    <strong style="font-size: 14px; color: var(--text-main);">${notif.title}</strong>
                    <span style="font-size: 10px; background: #0d6efd; color: #fff; padding: 2px 6px; border-radius: 4px;">${typeNames[notif.type] || notif.type}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 2px;">${notif.message}</p>
                ${notif.mediaLink ? `<small style="color: #0d6efd; display:block;">লিংক/ইমেজ সংযুক্ত আছে</small>` : ''}
                <small style="font-size: 11px; color: gray;">সময়: ${notif.time}</small>
            </div>
            <div style="display: flex; gap: 5px; flex-shrink: 0;">
                <button class="edit-notice-btn" data-id="${notif.id}" style="padding: 5px 8px; font-size: 12px; cursor: pointer; background: #ffc107; color: #000; border: none; border-radius: 4px; font-weight: 500;">এডিট</button>
                <button class="delete-notice-btn" data-id="${notif.id}" data-type="${notif.type}" style="padding: 5px 8px; font-size: 12px; cursor: pointer; background: #dc3545; color: #fff; border: none; border-radius: 4px;">ডিলিট</button>
            </div>
        </div>
    `).join('');

    listContainer.querySelectorAll(".edit-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = Number(e.target.getAttribute("data-id"));
            const noticeToEdit = notices.find(n => n.id === id);
            if (noticeToEdit) {
                document.getElementById("editNoticeId").value = noticeToEdit.id;
                
                // Switch tab and fill data according to notice type
                const targetTabBtn = document.querySelector(`.tab-btn[data-target="tab${noticeToEdit.type.charAt(0).toUpperCase() + noticeToEdit.type.slice(1)}"]`);
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
                
                document.querySelectorAll(".form-title-text").forEach(el => el.innerText = "নোটিশ এডিট করুন");
                document.querySelectorAll(".submit-notice-btn").forEach(el => el.innerText = "আপডেট করুন");
                document.getElementById("cancelEditBtn").classList.remove("hidden");
                
                document.querySelector(".notification-body").scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    listContainer.querySelectorAll(".delete-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = Number(e.target.getAttribute("data-id"));
            const type = e.target.getAttribute("data-type");
            
            notices = notices.filter(n => n.id !== id);
            localStorage.setItem("app_custom_notices", JSON.stringify(notices));

            if (type === 'sliding') {
                const active = JSON.parse(localStorage.getItem("active_sliding_notice"));
                if (active && active.id === id) {
                    localStorage.removeItem("active_sliding_notice");
                    const ticker = document.getElementById("slidingNoticeTicker");
                    if (ticker) ticker.remove();
                }
            }

            loadSentNotices();
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

    document.querySelectorAll(".form-title-text").forEach((el, idx) => {
        const titles = ["স্লাইডিং নোটিশ তৈরি করুন", "হোম নোটিশ তৈরি করুন", "পুশ নোটিশ তৈরি করুন"];
        el.innerText = titles[idx];
    });
    
    const submitTexts = ["স্লাইডিং নোটিশ প্রকাশ করুন", "হোম নোটিশ প্রকাশ করুন", "পুশ নোটিশ পাঠান"];
    document.querySelectorAll(".submit-notice-btn").forEach((el, idx) => {
        el.innerText = submitTexts[idx];
    });

    document.getElementById("cancelEditBtn").classList.add("hidden");
}
