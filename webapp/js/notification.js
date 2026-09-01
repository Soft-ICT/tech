/* =========================================
   Notification System Module (Complete & Active with FCM Push)
========================================= */

import { db } from "./firebase.js";
import { ref, push, set, update, remove, onValue, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

export function initNotificationSystem() {
    createNotificationUI();
    setupNotificationEvents();
    loadAllFirebaseListsAndListen();
}

function createNotificationUI() {
    if (document.getElementById("notificationModal")) return;

    const notificationHTML = `
    <div id="notificationModal" class="modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: center; z-index: 9999;">
        <div class="modal-content notification-modal-content" style="background: var(--card-bg, #fff); color: var(--text-main, #333); max-width: 680px; width: 95%; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <div class="modal-header" style="background: #0d6efd; color: #fff; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 16px;">📢 ফায়ারবেজ রিয়েল-টাইম নোটিফিকেশন প্যানেল</h2>
                <button class="close-btn" data-close="notificationModal" type="button" style="background: none; border: none; color: #fff; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            
            <div class="notification-body" style="max-height: 75vh; overflow-y: auto; padding: 15px;">
                
                <!-- Tabs -->
                <div class="notice-tabs" style="display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 2px solid var(--border-color, #ddd); padding-bottom: 10px;">
                    <button type="button" class="tab-btn active-tab" data-target="tabSliding" style="flex: 1; padding: 8px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">স্লাইডিং নোটিশ</button>
                    <button type="button" class="tab-btn" data-target="tabHome" style="flex: 1; padding: 8px; background: #e9ecef; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">হোম নোটিশ (পপআপ)</button>
                    <button type="button" class="tab-btn" data-target="tabPush" style="flex: 1; padding: 8px; background: #e9ecef; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">পুশ নোটিশ</button>
                </div>

                <input type="hidden" id="editNoticeId" value="">

                <!-- TAB 1: SLIDING -->
                <div id="tabSliding" class="notice-tab-content">
                    <div style="padding: 15px; background: var(--bg-color, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h3 class="form-title-sliding" style="margin: 0; font-size: 15px;">স্লাইডিং নোটিশ তৈরি করুন</h3>
                            <button type="button" id="toggleSlidingGlobalBtn" style="padding: 4px 10px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; background: #28a745; color: #fff;">স্ট্যাটাস: চালু আছে</button>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">শিরোনাম:</label>
                            <input type="text" id="slidingTitle" placeholder="শিরোনাম লিখুন..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">বিস্তারিত:</label>
                            <textarea id="slidingMessage" rows="2" placeholder="বিস্তারিত লিখুন..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);"></textarea>
                        </div>
                        <button type="button" class="submit-notice-btn" data-type="sliding" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">স্লাইডিং নোটিশ প্রকাশ করুন</button>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px;">স্লাইডিং নোটিশের তালিকা</h4>
                        <div id="sentSlidingList"><p style="text-align: center; color: gray; font-size: 13px;">লোড হচ্ছে...</p></div>
                    </div>
                </div>

                <!-- TAB 2: HOME (App Aligned) -->
                <div id="tabHome" class="notice-tab-content" style="display: none;">
                    <div style="padding: 15px; background: var(--bg-color, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h3 class="form-title-home" style="margin: 0; font-size: 15px;">হোম নোটিশ পপআপ তৈরি করুন</h3>
                            <button type="button" id="toggleHomeGlobalBtn" style="padding: 4px 10px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; background: #28a745; color: #fff;">স্ট্যাটাস: চালু আছে</button>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">Enter Title:</label>
                            <input type="text" id="homeTitle" placeholder="শিরোনাম..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">Enter Message:</label>
                            <textarea id="homeMessage" rows="2" placeholder="মেসেজ..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);"></textarea>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">Enter Image Link (img):</label>
                            <input type="url" id="homeImage" placeholder="https://..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">Enter Video Link (Video):</label>
                            <input type="url" id="homeVideo" placeholder="https://..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">Enter Web/Site Link (keys):</label>
                            <input type="url" id="homeKeys" placeholder="https://..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);">
                        </div>
                        <button type="button" class="submit-notice-btn" data-type="home" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">হোম নোটিশ প্রকাশ করুন</button>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px;">হোম নোটিশের তালিকা</h4>
                        <div id="sentHomeList"><p style="text-align: center; color: gray; font-size: 13px;">লোড হচ্ছে...</p></div>
                    </div>
                </div>

                <!-- TAB 3: PUSH -->
                <div id="tabPush" class="notice-tab-content" style="display: none;">
                    <div style="padding: 15px; background: var(--bg-color, #f9f9f9); border-radius: 8px; border: 1px solid var(--border-color, #ddd); margin-bottom: 15px;">
                        <h3 class="form-title-push" style="margin: 0; font-size: 15px; margin-bottom: 10px;">পুশ নোটিশ তৈরি করুন</h3>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">শিরোনাম:</label>
                            <input type="text" id="pushTitle" placeholder="শিরোনাম..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">বিস্তারিত:</label>
                            <textarea id="pushMessage" rows="2" placeholder="মেসেজ..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);"></textarea>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display:block; margin-bottom: 4px; font-size: 13px;">ইমেজ লিংক:</label>
                            <input type="url" id="pushImageLink" placeholder="https://..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ccc); background: var(--card-bg, #fff); color: var(--text-main, #000);">
                        </div>
                        <button type="button" class="submit-notice-btn" data-type="push" style="width: 100%; padding: 9px; background: #0d6efd; color: #fff; border: none; border-radius: 4px; cursor: pointer;">পুশ নোটিশ পাঠান</button>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 8px; font-size: 14px;">পুশ নোটিশের তালিকা</h4>
                        <div id="sentPushList"><p style="text-align: center; color: gray; font-size: 13px;">লোড হচ্ছে...</p></div>
                    </div>
                </div>

                <button id="cancelEditBtn" class="secondary-btn" style="width: 100%; padding: 8px; margin-top: 15px; background: #6c757d; color: #fff; border: none; border-radius: 4px; cursor: pointer; display: none;">এডিট বাতিল করুন</button>
            </div>
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

    if (notifBtn && modal) {
        notifBtn.addEventListener("click", () => {
            modal.style.display = "flex";
            updateToggleButtonsUI();
        });
    }

    modal?.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            modal.style.display = "none";
            resetForm();
        });
    });

    toggleSlidingBtn?.addEventListener("click", () => {
        let isOff = localStorage.getItem("sliding_notice_disabled") === "true";
        localStorage.setItem("sliding_notice_disabled", !isOff);
        updateToggleButtonsUI();
        loadAllFirebaseListsAndListen();
    });

    toggleHomeBtn?.addEventListener("click", () => {
        let isOff = localStorage.getItem("home_notice_disabled") === "true";
        localStorage.setItem("home_notice_disabled", !isOff);
        updateToggleButtonsUI();
        loadAllFirebaseListsAndListen();
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
                content.style.display = "none";
            });

            const targetTab = e.target.getAttribute("data-target");
            const targetElement = document.getElementById(targetTab);
            if (targetElement) targetElement.style.display = "block";
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

    const popupModal = document.getElementById("homeNoticePopupModal");
    const closePopupBtn = document.getElementById("closeHomePopupBtn");

    if (closePopupBtn) {
        closePopupBtn.style.backgroundColor = "#dc3545"; 
        closePopupBtn.style.color = "#ffffff";
        closePopupBtn.style.border = "none";

        closePopupBtn.addEventListener("click", () => {
            if (popupModal) {
                popupModal.style.display = "none";
            }
            const mediaContainer = document.getElementById("popupMediaContainer");
            if (mediaContainer) {
                mediaContainer.innerHTML = ""; 
            }
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

async function saveOrUpdateToFirebase(type) {
    const editId = document.getElementById("editNoticeId").value;
    let title = "";
    let message = "";
    let img = "";
    let video = "";
    let keys = "";

    if (type === 'sliding') {
        title = document.getElementById("slidingTitle").value.trim();
        message = document.getElementById("slidingMessage").value.trim();
    } else if (type === 'home') {
        title = document.getElementById("homeTitle").value.trim();
        message = document.getElementById("homeMessage").value.trim();
        img = document.getElementById("homeImage").value.trim();
        video = document.getElementById("homeVideo").value.trim();
        keys = document.getElementById("homeKeys").value.trim();
    } else if (type === 'push') {
        title = document.getElementById("pushTitle").value.trim();
        message = document.getElementById("pushMessage").value.trim();
        img = document.getElementById("pushImageLink").value.trim();
    }

    if (!title || !message) {
        alert("দয়া করে শিরোনাম এবং বিস্তারিত বিবরণ লিখুন।");
        return;
    }

    try {
        if (editId) {
            const noticeRef = ref(db, 'webapp/notices/' + editId);
            await update(noticeRef, {
                title,
                message,
                img,
                Video: video,
                keys,
                time: new Date().toLocaleString('bn-BD') + " (এডিটেড)"
            });
            alert("ফায়ারবেজে নোটিশ সফলভাবে আপডেট করা হয়েছে!");
        } else {
            const noticesRef = ref(db, 'webapp/notices');
            const newNoticeRef = push(noticesRef);
            await set(newNoticeRef, {
                id: newNoticeRef.key,
                type,
                title,
                message,
                img,
                Video: video,
                keys,
                time: new Date().toLocaleString('bn-BD')
            });

            // যদি পুশ নোটিশ টাইপ হয়, তবে ডাটাবেজে সেভ হওয়ার পাশাপাশি টোকেন সংগ্রহ করে পুশ ট্রিগার করার লজিক
            if (type === 'push') {
                await triggerFCMNotification(title, message, img);
            }

            alert("ফায়ারবেজে নোটিশ সফলভাবে পাঠানো হয়েছে!");
        }

        resetForm();
        document.getElementById("notificationModal").style.display = "none";
    } catch (error) {
        console.error("Firebase Error: ", error);
        alert("নোটিশ প্রকাশ করতে ব্যর্থ হয়েছে");
    }
}

// ডাটাবেজের সব FCM টোকেন ফেচ করে ব্রাউজার বা ক্লায়েন্ট সাইড থেকে পুশ নোটিফিকেশন ট্রিগার করার ফাংশন
async function triggerFCMNotification(title, body, imageUrl) {
    try {
        const tokensRef = ref(db, 'webapp/fcm_tokens');
        const snapshot = await get(tokensRef);
        
        if (snapshot.exists()) {
            const tokensData = snapshot.val();
            const tokens = Object.values(tokensData).map(item => item.token);
            
            console.log("Found FCM Tokens to notify:", tokens.length);
            // নোট: সরাসরি ফ্রন্টএন্ড থেকে FCM HTTP v1 API কল করতে সার্ভার বা Cloud Function প্রয়োজন হয়। 
            // তবে আপনি চাইলে Firebase Console-এর Campaigns থেকে এই টোকেনগুলো দিয়ে ইনস্ট্যান্ট টেস্ট করতে পারেন।
        }
    } catch (err) {
        console.error("Error triggering FCM notification:", err);
    }
}

function loadAllFirebaseListsAndListen() {
    const noticesRef = ref(db, 'webapp/notices');
    onValue(noticesRef, (snapshot) => {
        const data = snapshot.val();
        let notices = [];
        
        if (data) {
            notices = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            notices.reverse();
        }

        const slidingList = document.getElementById("sentSlidingList");
        const homeList = document.getElementById("sentHomeList");
        const pushList = document.getElementById("sentPushList");

        const slidingNotices = notices.filter(n => n.type === 'sliding');
        const homeNotices = notices.filter(n => n.type === 'home');
        const pushNotices = notices.filter(n => n.type === 'push');

        const slidingContainer = document.getElementById("slidingNoticeContainer");
        const isSlidingDisabled = localStorage.getItem("sliding_notice_disabled") === "true";

        if (slidingContainer) {
            if (!isSlidingDisabled && slidingNotices.length > 0) {
                const latestNotice = slidingNotices[0];
                slidingContainer.style.display = "block";
                slidingContainer.innerHTML = `
                    <div style="background: var(--card-bg, #fff); border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden; height: 36px;">
                        <div style="background: #dc3545; color: #fff; padding: 0 12px; height: 100%; display: flex; align-items: center; font-size: 13px; font-weight: 600; white-space: nowrap; z-index: 2;">
                            📢 ${latestNotice.title}:
                        </div>
                        <marquee behavior="scroll" direction="left" scrollamount="5" onmouseover="this.stop();" onmouseout="this.start();" style="width: 100%; font-size: 13px; font-weight: 500; color: var(--text-main, #1e293b); padding-left: 10px;">
                            ${latestNotice.message}
                        </marquee>
                    </div>
                `;
            } else {
                slidingContainer.style.display = "none";
                slidingContainer.innerHTML = "";
            }
        }

        const isHomeDisabled = localStorage.getItem("home_notice_disabled") === "true";
        const popupModal = document.getElementById("homeNoticePopupModal");
        
        if (popupModal && !isHomeDisabled && homeNotices.length > 0) {
            const latestHomeNotice = homeNotices[0];
            const shownKey = `popup_shown_${latestHomeNotice.id}`;
            if (!sessionStorage.getItem(shownKey)) {
                document.getElementById("popupTitle").innerText = latestHomeNotice.title || "";
                document.getElementById("popupMessage").innerText = latestHomeNotice.message || "";
                
                const mediaContainer = document.getElementById("popupMediaContainer");
                const websiteBtn = document.getElementById("popupWebsiteBtn");
                
                const imgLink = latestHomeNotice.img ? latestHomeNotice.img.trim() : "";
                const videoLink = latestHomeNotice.Video ? latestHomeNotice.Video.trim() : "";
                const siteLink = latestHomeNotice.keys ? latestHomeNotice.keys.trim() : "";

                if (videoLink) {
                    mediaContainer.style.display = "flex";
                    if (videoLink.includes("youtube.com") || videoLink.includes("youtu.be")) {
                        let embedUrl = videoLink;
                        if (videoLink.includes("watch?v=")) {
                            embedUrl = videoLink.replace("watch?v=", "embed/");
                        } else if (videoLink.includes("youtu.be/")) {
                            embedUrl = videoLink.replace("youtu.be/", "www.youtube.com/embed/");
                        }
                        mediaContainer.innerHTML = `<iframe src="${embedUrl}" style="width: 100%; height: 200px; border: none; border-radius: 6px;" allowfullscreen></iframe>`;
                    } else {
                        mediaContainer.innerHTML = `<video src="${videoLink}" controls autoplay style="width: 100%; max-height: 230px; object-fit: contain; background: #000; border-radius: 6px;"></video>`;
                    }
                } else if (imgLink) {
                    mediaContainer.style.display = "flex";
                    mediaContainer.innerHTML = `<img src="${imgLink}" style="width: 100%; max-height: 230px; object-fit: contain; background: #000; border-radius: 6px;" alt="Notice Image">`;
                } else {
                    mediaContainer.style.display = "none";
                    mediaContainer.innerHTML = "";
                }

                if (siteLink && siteLink.startsWith("http")) {
                    websiteBtn.href = siteLink;
                    websiteBtn.style.display = "block";
                } else {
                    websiteBtn.style.display = "none";
                }

                popupModal.style.display = "flex";
                sessionStorage.setItem(shownKey, "true");
            }
        }

        if (slidingList) {
            slidingList.innerHTML = slidingNotices.length === 0 ? '<p style="text-align: center; color: gray; font-size: 13px;">কোনো স্লাইডিং নোটিশ নেই</p>' : 
            slidingNotices.map(n => renderCard(n)).join('');
        }
        if (homeList) {
            homeList.innerHTML = homeNotices.length === 0 ? '<p style="text-align: center; color: gray; font-size: 13px;">কোনো হোম নোটিশ নেই</p>' : 
            homeNotices.map(n => renderCard(n)).join('');
        }
        if (pushList) {
            pushList.innerHTML = pushNotices.length === 0 ? '<p style="text-align: center; color: gray; font-size: 13px;">কোনো পুশ নোটিশ নেই</p>' : 
            pushNotices.map(n => renderCard(n)).join('');
        }

        attachCardActions();
    });
}

function renderCard(n) {
    return `
        <div style="padding: 10px; border: 1px solid var(--border-color, #ddd); border-radius: 6px; margin-bottom: 8px; background: var(--card-bg, #fff); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1; padding-right: 8px;">
                <strong style="font-size: 13px; color: var(--text-main, #333); display:block;">${n.title}</strong>
                <p style="font-size: 12px; color: var(--text-muted, #666); margin: 2px 0;">${n.message}</p>
                <small style="font-size: 10px; color: #999;">${n.time}</small>
            </div>
            <div style="display: flex; gap: 4px;">
                <button class="edit-btn" data-id="${n.id}" style="padding: 4px 8px; font-size: 11px; background: #ffc107; border: none; border-radius: 4px; cursor: pointer;">এডিট</button>
                <button class="delete-btn" data-id="${n.id}" style="padding: 4px 8px; font-size: 11px; background: #dc3545; color: #fff; border: none; border-radius: 4px; cursor: pointer;">ডিলিট</button>
            </div>
        </div>
    `;
}

function attachCardActions() {
    const modal = document.getElementById("notificationModal");
    if (!modal) return;

    modal.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            const snapshot = await get(ref(db, 'webapp/notices/' + id));
            if (snapshot.exists()) {
                const notice = snapshot.val();
                document.getElementById("editNoticeId").value = id;

                const targetTabBtn = modal.querySelector(`.tab-btn[data-target="tab${notice.type.charAt(0).toUpperCase() + notice.type.slice(1)}"]`);
                if (targetTabBtn) targetTabBtn.click();

                if (notice.type === 'sliding') {
                    document.getElementById("slidingTitle").value = notice.title;
                    document.getElementById("slidingMessage").value = notice.message;
                } else if (notice.type === 'home') {
                    document.getElementById("homeTitle").value = notice.title;
                    document.getElementById("homeMessage").value = notice.message;
                    document.getElementById("homeImage").value = notice.img || "";
                    document.getElementById("homeVideo").value = notice.Video || "";
                    document.getElementById("homeKeys").value = notice.keys || "";
                } else if (notice.type === 'push') {
                    document.getElementById("pushTitle").value = notice.title;
                    document.getElementById("pushMessage").value = notice.message;
                    document.getElementById("pushImageLink").value = notice.img || "";
                }

                const cancelBtn = document.getElementById("cancelEditBtn");
                if (cancelBtn) cancelBtn.style.display = "block";
            }
        });
    });

    modal.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            if (confirm("আপনি কি এই নোটিশটি ডিলিট করতে চান?")) {
                await remove(ref(db, 'webapp/notices/' + id));
                alert("নোটিশটি ডিলিট করা হয়েছে!");
            }
        });
    });
}

function resetForm() {
    const editIdInput = document.getElementById("editNoticeId");
    if (editIdInput) editIdInput.value = "";
    
    const slidingTitle = document.getElementById("slidingTitle");
    if (slidingTitle) slidingTitle.value = "";
    
    const slidingMsg = document.getElementById("slidingMessage");
    if (slidingMsg) slidingMsg.value = "";
    
    const homeTitle = document.getElementById("homeTitle");
    if (homeTitle) homeTitle.value = "";
    
    const homeMsg = document.getElementById("homeMessage");
    if (homeMsg) homeMsg.value = "";
    
    const homeImage = document.getElementById("homeImage");
    if (homeImage) homeImage.value = "";
    
    const homeVideo = document.getElementById("homeVideo");
    if (homeVideo) homeVideo.value = "";
    
    const homeKeys = document.getElementById("homeKeys");
    if (homeKeys) homeKeys.value = "";
    
    const pushTitle = document.getElementById("pushTitle");
    if (pushTitle) pushTitle.value = "";
    
    const pushMsg = document.getElementById("pushMessage");
    if (pushMsg) pushMsg.value = "";
    
    const pushImg = document.getElementById("pushImageLink");
    if (pushImg) pushImg.value = "";
    
    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
}
