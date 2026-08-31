/* =========================================
   Notification System Module
========================================= */

// নোটিফিকেশন মডাল বা পেজ HTML-এ ইনজেক্ট করার ফাংশন
export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
}

function createNotificationUI() {
    // যদি আগে থেকেই না থাকে, তবে নোটিফিকেশন পেজ/মডাল DOM-এ যোগ করা
    if (document.getElementById("notificationModal")) return;

    const notificationHTML = `
    <div id="notificationModal" class="modal hidden">
        <div class="modal-content notification-modal-content">
            <div class="modal-header">
                <h2>সকল নোটিফিকেশন</h2>
                <button class="close-btn" data-close="notificationModal" type="button">✕</button>
            </div>
            <div class="notification-body">
                <div id="notificationList" class="notification-list">
                    <p class="text-muted" style="text-align: center; padding: 20px;">কোনো নতুন নোটিফিকেশন নেই।</p>
                </div>
            </div>
            <div class="modal-actions">
                <button id="clearNotificationsBtn" class="secondary-btn" type="button">সব ডিলিট করুন</button>
                <button class="primary-btn" data-close="notificationModal" type="button">বন্ধ করুন</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', notificationHTML);
}

function setupNotificationEvents() {
    const notifBtn = document.getElementById("notificationBtn");
    const modal = document.getElementById("notificationModal");
    const clearBtn = document.getElementById("clearNotificationsBtn");

    if (notifBtn) {
        notifBtn.addEventListener("click", () => {
            openNotificationPage();
        });
    }

    // বন্ধ করার ইভেন্ট
    modal?.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    });

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            clearAllNotifications();
        });
    }
}

// নোটিফিকেশন পেজ বা মডাল ওপেন করার ফাংশন
export function openNotificationPage() {
    const modal = document.getElementById("notificationModal");
    if (modal) {
        modal.classList.remove("hidden");
        loadNotifications();
    }
}

// নোটিফিকেশন লোড করার লজিক (Firebase বা LocalStorage থেকে ডেটা আনতে পারেন)
function loadNotifications() {
    const listContainer = document.getElementById("notificationList");
    
    // উদাহরণস্বরূপ ডেমো নোটিফিকেশন ডেটা (আপনার প্রয়োজনমতো রিয়েল ডেটা দিয়ে রিপ্লেস করতে পারেন)
    const sampleNotifications = [
        { title: "সিস্টেম আপডেট", message: "পুলিশ ফোনবুক অ্যাপটি সফলভাবে আপডেট করা হয়েছে।", time: "১০ মিনিট আগে" },
        { title: "নতুন জরুরি নম্বর", message: "নতুন একটি জরুরি হেল্পলাইন নম্বর যুক্ত করা হয়েছে।", time: "২ ঘণ্টা আগে" }
    ];

    if (sampleNotifications.length === 0) {
        listContainer.innerHTML = `<p class="text-muted" style="text-align: center; padding: 20px;">কোনো নতুন নোটিফিকেশন নেই।</p>`;
        return;
    }

    listContainer.innerHTML = sampleNotifications.map(notif => `
        <div class="notification-item" style="padding: 12px; border-bottom: 1px solid var(--border-color); margin-bottom: 8px;">
            <h4 style="font-size: 15px; margin-bottom: 4px; color: var(--text-main);">${notif.title}</h4>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">${notif.message}</p>
            <span style="font-size: 11px; color: var(--primary-color);">${notif.time}</span>
        </div>
    `).join('');
}

function clearAllNotifications() {
    const listContainer = document.getElementById("notificationList");
    if (listContainer) {
        listContainer.innerHTML = `<p class="text-muted" style="text-align: center; padding: 20px;">কোনো নোটিফিকেশন নেই।</p>`;
    }
}
