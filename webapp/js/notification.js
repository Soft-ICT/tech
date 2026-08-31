/* =========================================
   Notification System Module (Updated for Exact Placement & Persistence)
========================================= */

export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
    renderActiveSlidingNotice(); // পেজ লোড বা রিফ্রেশ করলে আগের নোটিশ চালু রাখার জন্য
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
                            <option value="sliding">স্লাইডিং নোটিশ (টপ বার ও সাব-টুলবারের মাঝখানে)</option>
                            <option value="push">পুশ / ব্যাকগ্রাউন্ড নোটিশ</option>
                            <option value="home">হোম নোটিশ (ড্যাশবোর্ড ব্যানার)</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="display:block; margin-bottom: 5px; font-weight: 500;">নোটিশের শিরোনাম:</label>
                        <input type="text" id="noticeTitleInput" placeholder="যেমন: BREAKING NEWS বা জরুরি সতর্কতা" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                    </div>

                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="display:block; margin-bottom: 5px; font-weight: 500;">নোটিশের বিস্তারিত বিবরণ:</label>
                        <textarea id="noticeMessageInput" rows="3" placeholder="এখানে বিস্তারিত লিখুন..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);"></textarea>
                    </div>

                    <button id="sendNoticeBtn" class="primary-btn" type="button" style="width: 100%; padding: 10px; background: var(--primary-color, #0d6efd); color: #fff; border: none; border-radius: 4px; cursor: pointer;">নোটিশ পাঠান / প্রকাশ করুন</button>
                </div>

                <!-- পাঠানো নোটিশগুলোর তালিকা (ডিলিট অপশনসহ) -->
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
    const sendBtn = document.getElementById("sendNoticeBtn");

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

    // স্লাইডিং নোটিশ হলে সাথে সাথে লোকালস্টোরেজে একটি্টিভ হিসেবে সেভ করে দেবো
    if (type === 'sliding') {
        localStorage.setItem("active_sliding_notice", JSON.stringify(newNotice));
        showSlidingBanner(newNotice);
    } else {
        executeNoticeAction(newNotice);
    }

    document.getElementById("noticeTitleInput").value = "";
    document.getElementById("noticeMessageInput").value = "";

    loadSentNotices();
    alert("নোটিশ সফলভাবে পাঠানো হয়েছে!");
}

function executeNoticeAction(notice) {
    if (notice.type === 'home') {
        showHomeNoticeBanner(notice);
    } else if (notice.type === 'push') {
        triggerPushBackgroundNotification(notice);
    }
}

// পেজ রিফ্রেশ হলে একটি্টিভ স্লাইডিং নোটিশ রেন্ডার করার ফাংশন
function renderActiveSlidingNotice() {
    const activeNotice = JSON.parse(localStorage.getItem("active_sliding_notice"));
    if (activeNotice) {
        showSlidingBanner(activeNotice);
    }
}

// স্লাইডিং নোটিশ টুলবার এবং সাব-টুলবারের মাঝখানে বসানোর সঠিক ফাংশন
function showSlidingBanner(notice) {
    let ticker = document.getElementById("slidingNoticeTicker");
    
    if (!ticker) {
        ticker = document.createElement("div");
        ticker.id = "slidingNoticeTicker";
        ticker.style.cssText = "background: #fff; border-bottom: 2px solid #dc3545; display: flex; align-items: center; overflow: hidden; white-space: nowrap; width: 100%; z-index: 999; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
        
        // টুলবার (.topbar) এর ঠিক নিচে এবং সাব-টুলবার (.sub-toolbar) এর ঠিক উপরে ইনসার্ট করা
        const subToolbar = document.querySelector(".sub-toolbar");
        if (subToolbar && subToolbar.parentNode) {
            subToolbar.parentNode.insertBefore(ticker, subToolbar);
        } else {
            document.body.insertBefore(ticker, document.body.firstChild);
        }
    }

    ticker.innerHTML = `
        <div style="background: #dc3545; color: #fff; padding: 6px 12px; font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 5px; flex-shrink: 0;">
            🔥 ${notice.title}
        </div>
        <div style="overflow: hidden; width: 100%;">
            <marquee scrollamount="6" style="color: #333; font-weight: 500; padding-top: 4px;">${notice.message}</marquee>
        </div>
    `;
}

// হোম নোটিশ ড্যাশবোর্ডে দেখানোর ফাংশন
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

// পুশ বা ব্যাকগ্রাউন্ড নোটিশ সিমুলেশন
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
            <div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                    <strong style="font-size: 14px; color: var(--text-main);">${notif.title}</strong>
                    <span style="font-size: 10px; background: #0d6efd; color: #fff; padding: 2px 6px; border-radius: 4px;">${typeNames[notif.type] || notif.type}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 2px;">${notif.message}</p>
                <small style="font-size: 11px; color: gray;">সময়: ${notif.time}</small>
            </div>
            <button class="delete-notice-btn danger-btn" data-id="${notif.id}" data-type="${notif.type}" style="padding: 5px 10px; font-size: 12px; cursor: pointer; background: #dc3545; color: #fff; border: none; border-radius: 4px;">ডিলিট</button>
        </div>
    `).join('');

    // ডিলিট বাটনের ইভেন্ট হ্যান্ডলার
    listContainer.querySelectorAll(".delete-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = Number(e.target.getAttribute("data-id"));
            const type = e.target.getAttribute("data-type");
            
            // লিস্ট থেকে ফিল্টার করে বাদ দেওয়া
            notices = notices.filter(n => n.id !== id);
            localStorage.setItem("app_custom_notices", JSON.stringify(notices));

            // যদি এটি স্লাইডিং নোটিশ হয় এবং বর্তমানে চালু থাকে, তবে স্ক্রিন থেকেও রিমুভ করে দেওয়া
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
