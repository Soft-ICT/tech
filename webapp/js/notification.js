/* =========================================
   Notification System Module (Sliding, Push, Home Notices)
========================================= */

export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
}

function createNotificationUI() {
    if (document.getElementById("notificationModal")) return;

    const notificationHTML = `
    <div id="notificationModal" class="modal hidden">
        <div class="modal-content notification-modal-content" style="max-width: 600px; width: 95%;">
            <div class="modal-header">
                <h2>📢 নোটিফিকেশন ম্যানেজমেন্ট প্যানেল</h2>
                <button class="close-btn" data-close="notificationModal" type="button">✕</button>
            </div>
            <div class="notification-body" style="max-height: 70vh; overflow-y: auto; padding: 15px;">
                
                <!-- নতুন নোটিশ পাঠানোর ফর্ম -->
                <div class="card" style="padding: 15px; margin-bottom: 20px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd);">
                    <h3 style="margin-bottom: 12px; font-size: 16px; color: var(--text-main);">নতুন নোটিশ তৈরি করুন</h3>
                    
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="display:block; margin-bottom: 5px; font-weight: 500;">নোটিশের ধরন নির্বাচন করুন:</label>
                        <select id="noticeTypeSelect" class="form-control" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                            <option value="sliding">স্লাইডিং নোটিশ (টপ বার)</option>
                            <option value="push">পুশ / ব্যাকগ্রাউন্ড নোটিশ</option>
                            <option value="home">হোম নোটিশ (ড্যাশবোর্ড ব্যানার)</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="display:block; margin-bottom: 5px; font-weight: 500;">নোটিশের শিরোনাম:</label>
                        <input type="text" id="noticeTitleInput" placeholder="যেমন: জরুরি সতর্কতা বা আপডেট" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="display:block; margin-bottom: 5px; font-weight: 500;">নোটিশের বিস্তারিত বিবরণ:</label>
                        <textarea id="noticeMessageInput" rows="3" placeholder="এখানে বিস্তারিত লিখুন..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                    </div>

                    <button id="sendNoticeBtn" class="primary-btn" type="button" style="width: 100%; padding: 10px; background: var(--primary-color, #0d6efd); color: #fff; border: none; border-radius: 4px; cursor: pointer;">নোটিশ পাঠান / প্রকাশ করুন</button>
                </div>

                <!-- পাঠানো নোটিশগুলোর তালিকা -->
                <div>
                    <h3 style="margin-bottom: 10px; font-size: 16px; color: var(--text-main);">সাম্প্রতিক পাঠানো নোটিশসমূহ</h3>
                    <div id="sentNoticeList" class="notification-list">
                        <p class="text-muted" style="text-align: center; padding: 15px;">কোনো নোটিশ পাঠানো হয়নি।</p>
                    </div>
                </div>

            </div>
            <div class="modal-actions" style="padding: 10px 15px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 10px;">
                <button id="clearAllNoticesBtn" class="danger-btn" type="button">সব মুছুন</button>
                <button class="secondary-btn" data-close="notificationModal" type="button">বন্ধ করুন</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', notificationHTML);
}

function setupNotificationEvents() {
    const notifBtn = document.getElementById("notificationBtn");
    const modal = document.getElementById("notificationModal");
    const sendBtn = document.getElementById("sendNoticeBtn");
    const clearBtn = document.getElementById("clearAllNoticesBtn");

    if (notifBtn) {
        notifBtn.addEventListener("click", () => {
            modal.classList.remove("hidden");
            loadSentNotices();
        });
    }

    modal?.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    });

    if (sendBtn) {
        sendBtn.addEventListener("click", () => {
            handleSendNotice();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            localStorage.removeItem("app_custom_notices");
            loadSentNotices();
        });
    }
}

function handleSendNotice() {
    const type = document.getElementById("noticeTypeSelect").value;
    const title = document.getElementById("noticeTitleInput").value.trim();
    const message = document.getElementById("noticeMessageInput").value.trim();

    if (!title || !message) {
        alert("দয়া করে শিরোনাম এবং বিবরণ উভয়ই লিখুন।");
        return;
    }

    const newNotice = {
        id: Date.now(),
        type,
        title,
        message,
        time: new Date().toLocaleString('bn-BD')
    };

    let notices = JSON.parse(localStorage.getItem("app_custom_notices") || "[]");
    notices.unshift(newNotice);
    localStorage.setItem("app_custom_notices", JSON.stringify(notices));

    executeNoticeAction(newNotice);

    document.getElementById("noticeTitleInput").value = "";
    document.getElementById("noticeMessageInput").value = "";

    loadSentNotices();
    alert("নোটিশ সফলভাবে পাঠানো হয়েছে!");
}

function executeNoticeAction(notice) {
    if (notice.type === 'sliding') {
        showSlidingBanner(notice);
    } else if (notice.type === 'home') {
        showHomeNoticeBanner(notice);
    } else if (notice.type === 'push') {
        triggerPushBackgroundNotification(notice);
    }
}

// ১. স্লাইডিং নোটিশ টপ বারে দেখানোর ফাংশন
function showSlidingBanner(notice) {
    let ticker = document.getElementById("slidingNoticeTicker");
    if (!ticker) {
        ticker = document.createElement("div");
        ticker.id = "slidingNoticeTicker";
        ticker.style.cssText = "background: #ffc107; color: #000; padding: 8px; overflow: hidden; white-space: nowrap; position: relative; font-weight: bold; z-index: 1000;";
        document.body.insertBefore(ticker, document.body.firstChild);
    }
    ticker.innerHTML = `<marquee scrollamount="5">⚡ ${notice.title}: ${notice.message}</marquee>`;
}

// ২. হোম নোটিশ ড্যাশবোর্ডে দেখানোর ফাংশন
function showHomeNoticeBanner(notice) {
    let container = document.getElementById("allSearchContainer");
    if (container) {
        container.classList.remove("hidden");
        container.innerHTML = `
            <div style="background: var(--bg-card, #e3f2fd); border-left: 4px solid #0d6efd; padding: 12px; border-radius: 4px; margin-bottom: 15px;">
                <h4 style="color: #0d6efd; margin-bottom: 5px;">📌 ${notice.title}</h4>
                <p style="margin: 0; font-size: 14px;">${notice.message}</p>
                <small style="color: gray;">প্রকাশিত: ${notice.time}</small>
            </div>
        ` + container.innerHTML;
    }
}

// ৩. পুশ বা ব্যাকগ্রাউন্ড নোটিশ সিমুলেশন (ব্রাউজার নোটিফিকেশন)
function triggerPushBackgroundNotification(notice) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notice.title, {
            body: notice.message,
            icon: "icons/icon-192.png"
        });
    } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(notice.title, {
                    body: notice.message,
                    icon: "icons/icon-192.png"
                });
            }
        });
    }
}

function loadSentNotices() {
    const listContainer = document.getElementById("sentNoticeList");
    const notices = JSON.parse(localStorage.getItem("app_custom_notices") || "[]");

    if (notices.length === 0) {
        listContainer.innerHTML = `<p class="text-muted" style="text-align: center; padding: 15px;">কোনো নোটিশ পাঠানো হয়নি।</p>`;
        return;
    }

    const typeNames = {
        'sliding': 'স্লাইডিং নোটিশ',
        'push': 'পুশ / ব্যাকগ্রাউন্ড নোটিশ',
        'home': 'হোম নোটিশ'
    };

    listContainer.innerHTML = notices.map(notif => `
        <div style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 8px; background: var(--bg-main);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="font-size: 14px; color: var(--text-main);">${notif.title}</strong>
                <span style="font-size: 11px; background: #0d6efd; color: #fff; padding: 2px 6px; border-radius: 4px;">${typeNames[notif.type] || notif.type}</span>
            </div>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">${notif.message}</p>
            <span style="font-size: 11px; color: gray;">সময়: ${notif.time}</span>
        </div>
    `).join('');
}
