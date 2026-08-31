/* =========================================
   Notification System Module (With Edit Option & Clean Design)
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
        <div class="modal-content notification-modal-content" style="max-width: 600px; width: 95%;">
            <div class="modal-header">
                <h2>📢 নোটিফিকেশন ম্যানেজমেন্ট প্যানেল</h2>
                <button class="close-btn" data-close="notificationModal" type="button">✕</button>
            </div>
            <div class="notification-body" style="max-height: 70vh; overflow-y: auto; padding: 15px;">
                
                <!-- নতুন বা এডিট নোটিশ পাঠানোর ফর্ম -->
                <div class="card" style="padding: 15px; margin-bottom: 20px; background: var(--bg-card, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd);">
                    <h3 id="noticeFormTitle" style="margin-bottom: 12px; font-size: 16px; color: var(--text-main);">নতুন নোটিশ তৈরি করুন</h3>
                    
                    <input type="hidden" id="editNoticeId" value="">

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

                    <div style="display: flex; gap: 10px;">
                        <button id="sendNoticeBtn" class="primary-btn" type="button" style="flex: 1; padding: 10px; background: var(--primary-color, #0d6efd); color: #fff; border: none; border-radius: 4px; cursor: pointer;">নোটিশ পাঠান / প্রকাশ করুন</button>
                        <button id="cancelEditBtn" class="secondary-btn hidden" type="button" style="padding: 10px; cursor: pointer;">বাতিল</button>
                    </div>
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

    if (sendBtn) {
        sendBtn.addEventListener("click", () => {
            handleSaveOrUpdateNotice();
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            resetForm();
        });
    }
}

function handleSaveOrUpdateNotice() {
    const editId = document.getElementById("editNoticeId").value;
    const type = document.getElementById("noticeTypeSelect").value;
    const title = document.getElementById("noticeTitleInput").value.trim();
    const message = document.getElementById("noticeMessageInput").value.trim();

    if (!title || !message) {
        alert("দয়া করে শিরোনাম এবং বিবরণ উভয়ই লিখুন।");
        return;
    }

    let notices = JSON.parse(localStorage.getItem("app_custom_notices") || "[]");

    if (editId) {
        // এডিট বা আপডেট করা
        notices = notices.map(n => {
            if (n.id == editId) {
                return { ...n, type, title, message, time: new Date().toLocaleString('bn-BD') + " (এডিটেড)" };
            }
            return n;
        });
        alert("নোটিশ সফলভাবে আপডেট করা হয়েছে!");
    } else {
        // নতুন নোটিশ যোগ করা
        const newNotice = {
            id: Date.now(),
            type,
            title,
            message,
            time: new Date().toLocaleString('bn-BD')
        };
        notices.unshift(newNotice);

        if (type === 'sliding') {
            localStorage.setItem("active_sliding_notice", JSON.stringify(newNotice));
            showSlidingBanner(newNotice);
        } else {
            executeNoticeAction(newNotice);
        }
        alert("নোটিশ সফলভাবে পাঠানো হয়েছে!");
    }

    localStorage.setItem("app_custom_notices", JSON.stringify(notices));

    // যদি এটি স্লাইডিং নোটিশ হয় এবং এডিট করা হয়ে থাকে, তবে লাইভ ব্যানার আপডেট করা
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

function renderActiveSlidingNotice() {
    const activeNotice = JSON.parse(localStorage.getItem("active_sliding_notice"));
    if (activeNotice) {
        showSlidingBanner(activeNotice);
    }
}

// স্লাইডিং নোটিশের ডিজাইন (লম্বা লাল দাগের পরিবর্তে মানানসই ও প্রিমিয়াম লুক)
function showSlidingBanner(notice) {
    let ticker = document.getElementById("slidingNoticeTicker");
    
    if (!ticker) {
        ticker = document.createElement("div");
        ticker.id = "slidingNoticeTicker";
        // প্রিমিয়াম ও মানানসই বর্ডার স্টাইল (হালকা শেড ও পরিপাটি ডিজাইন)
        ticker.style.cssText = "background: var(--bg-card, #ffffff); border-bottom: 1px solid var(--border-color, #e0e0e0); border-top: 1px solid var(--border-color, #e0e0e0); display: flex; align-items: center; overflow: hidden; white-space: nowrap; width: 100%; z-index: 999; box-shadow: 0 1px 3px rgba(0,0,0,0.05);";
        
        const subToolbar = document.querySelector(".sub-toolbar");
        if (subToolbar && subToolbar.parentNode) {
            subToolbar.parentNode.insertBefore(ticker, subToolbar);
        } else {
            document.body.insertBefore(ticker, document.body.firstChild);
        }
    }

    ticker.innerHTML = `
        <div style="background: var(--primary-color, #0d6efd); color: #fff; padding: 5px 10px; font-weight: 600; font-size: 12px; display: flex; align-items: center; gap: 4px; flex-shrink: 0; border-radius: 0 4px 4px 0;">
            🔥 ${notice.title}
        </div>
        <div style="overflow: hidden; width: 100%;">
            <marquee scrollamount="5" style="color: var(--text-main, #333); font-weight: 500; font-size: 13px; padding-top: 3px;">${notice.message}</marquee>
        </div>
    `;
}

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

function triggerPushBackgroundNotification(notice) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notice.title, { body: notice.message, icon: "icons/icon-192.png" });
    } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(notice.title, { body: notice.message, icon: "icons/icon-192.png" });
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
                <small style="font-size: 11px; color: gray;">সময়: ${notif.time}</small>
            </div>
            <div style="display: flex; gap: 5px; flex-shrink: 0;">
                <button class="edit-notice-btn" data-id="${notif.id}" style="padding: 5px 8px; font-size: 12px; cursor: pointer; background: #ffc107; color: #000; border: none; border-radius: 4px; font-weight: 500;">এডিট</button>
                <button class="delete-notice-btn" data-id="${notif.id}" data-type="${notif.type}" style="padding: 5px 8px; font-size: 12px; cursor: pointer; background: #dc3545; color: #fff; border: none; border-radius: 4px;">ডিলিট</button>
            </div>
        </div>
    `).join('');

    // এডিট বাটনের ইভেন্ট হ্যান্ডলার
    listContainer.querySelectorAll(".edit-notice-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = Number(e.target.getAttribute("data-id"));
            const noticeToEdit = notices.find(n => n.id === id);
            if (noticeToEdit) {
                document.getElementById("editNoticeId").value = noticeToEdit.id;
                document.getElementById("noticeTypeSelect").value = noticeToEdit.type;
                document.getElementById("noticeTitleInput").value = noticeToEdit.title;
                document.getElementById("noticeMessageInput").value = noticeToEdit.message;
                
                document.getElementById("noticeFormTitle").innerText = "নোটিশ এডিট করুন";
                document.getElementById("sendNoticeBtn").innerText = "আপডেট করুন";
                document.getElementById("cancelEditBtn").classList.remove("hidden");
                
                // মডালের উপরের দিকে স্ক্রল করা যাতে ফর্মটি সহজে দেখা যায়
                document.querySelector(".notification-body").scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // ডিলিট বাটনের ইভেন্ট হ্যান্ডলার
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
    document.getElementById("noticeTitleInput").value = "";
    document.getElementById("noticeMessageInput").value = "";
    document.getElementById("noticeFormTitle").innerText = "নতুন নোটিশ তৈরি করুন";
    document.getElementById("sendNoticeBtn").innerText = "নোটিশ পাঠান / প্রকাশ করুন";
    document.getElementById("cancelEditBtn").classList.add("hidden");
}
