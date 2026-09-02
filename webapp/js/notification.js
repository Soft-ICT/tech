/* =========================================
   Notification System
   Path: tech/webapp/js/notification.js

   Firebase:
   webapp/notices
   webapp/push_requests
========================================= */

import { db } from "./firebase.js";

import {
    ref,
    push,
    set,
    update,
    remove,
    onValue,
    get
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


/* =========================================
   INIT
========================================= */

export function initNotificationSystem() {

    createNotificationUI();

    setupNotificationEvents();

    loadAllFirebaseListsAndListen();

}


/* =========================================
   CREATE UI
========================================= */

function createNotificationUI() {

    if (document.getElementById("notificationModal")) {
        return;
    }


    const notificationHTML = `

    <div id="notificationModal"
         style="
            display:none;
            position:fixed;
            inset:0;
            z-index:99999;
            background:rgba(0,0,0,.65);
            overflow:auto;
         ">

        <div style="
            width:min(95%,700px);
            margin:40px auto;
            background:var(--card-bg,#fff);
            color:var(--text-color,#111);
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 10px 40px rgba(0,0,0,.3);
        ">

            <!-- HEADER -->

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                padding:15px 18px;
                border-bottom:1px solid rgba(128,128,128,.2);
            ">

                <strong style="font-size:19px;">
                    🔔 নোটিফিকেশন ম্যানেজমেন্ট
                </strong>

                <button id="closeNotificationModal"
                        style="
                            border:0;
                            background:none;
                            font-size:25px;
                            cursor:pointer;
                        ">
                    ×
                </button>

            </div>


            <!-- TABS -->

            <div style="
                display:flex;
                gap:6px;
                padding:10px;
                overflow-x:auto;
                border-bottom:1px solid rgba(128,128,128,.15);
            ">

                <button class="notificationTab active"
                        data-tab="sliding">
                    📢 Sliding
                </button>

                <button class="notificationTab"
                        data-tab="home">
                    🏠 Home
                </button>

                <button class="notificationTab"
                        data-tab="push">
                    📲 Push
                </button>

            </div>


            <!-- BODY -->

            <div style="padding:18px;">


                <!-- EDIT ID -->

                <input
                    type="hidden"
                    id="editNoticeId"
                    value=""
                />


                <!-- SLIDING -->

                <div class="notificationPanel"
                     id="panel-sliding">

                    <h3>📢 Sliding Notice</h3>

                    <label>শিরোনাম</label>

                    <input
                        id="slidingTitle"
                        type="text"
                        placeholder="Sliding notice title"
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    >


                    <label>বিস্তারিত</label>

                    <textarea
                        id="slidingMessage"
                        rows="4"
                        placeholder="Sliding notice message"
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    ></textarea>


                    <button
                        class="saveNotificationBtn"
                        data-type="sliding">
                        💾 Sliding Notice প্রকাশ
                    </button>

                </div>


                <!-- HOME -->

                <div class="notificationPanel"
                     id="panel-home"
                     style="display:none;">

                    <h3>🏠 Home Notice</h3>


                    <label>শিরোনাম</label>

                    <input
                        id="homeTitle"
                        type="text"
                        placeholder="Home notice title"
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    >


                    <label>বিস্তারিত</label>

                    <textarea
                        id="homeMessage"
                        rows="5"
                        placeholder="Home notice message"
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    ></textarea>


                    <label>Image URL</label>

                    <input
                        id="homeImage"
                        type="url"
                        placeholder="https://..."
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    >


                    <label>Video URL</label>

                    <input
                        id="homeVideo"
                        type="url"
                        placeholder="https://..."
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    >


                    <label>Website / Button URL</label>

                    <input
                        id="homeKeys"
                        type="url"
                        placeholder="https://..."
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    >


                    <button
                        class="saveNotificationBtn"
                        data-type="home">
                        💾 Home Notice প্রকাশ
                    </button>

                </div>


                <!-- PUSH -->

                <div class="notificationPanel"
                     id="panel-push"
                     style="display:none;">

                    <h3>📲 Push Notification</h3>


                    <div style="
                        padding:12px;
                        border-radius:10px;
                        background:rgba(0,128,255,.08);
                        margin-bottom:15px;
                    ">

                        এই ফর্ম থেকে Push request তৈরি হবে।
                        Firebase Cloud Function request পেয়ে
                        subscribed devices-এ FCM notification পাঠাবে।

                    </div>


                    <label>Push Title</label>

                    <input
                        id="pushTitle"
                        type="text"
                        placeholder="নতুন নোটিশ"
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    >


                    <label>Push Message</label>

                    <textarea
                        id="pushMessage"
                        rows="5"
                        placeholder="নোটিফিকেশনের বিস্তারিত..."
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    ></textarea>


                    <label>Image URL (Optional)</label>

                    <input
                        id="pushImageLink"
                        type="url"
                        placeholder="https://..."
                        style="width:100%;padding:11px;margin:7px 0 14px;"
                    >


                    <button
                        class="saveNotificationBtn"
                        data-type="push">
                        📲 পুশ নোটিশ পাঠান
                    </button>

                </div>


                <!-- RESET -->

                <button
                    id="resetNotificationForm"
                    style="
                        margin-top:15px;
                        padding:9px 15px;
                        border:0;
                        border-radius:8px;
                        cursor:pointer;
                    ">
                    ↻ Form Reset
                </button>


                <!-- LIST -->

                <hr style="margin:25px 0;">


                <h3>📋 প্রকাশিত নোটিশ</h3>

                <div id="notificationList">

                    <p>লোড হচ্ছে...</p>

                </div>


            </div>

        </div>

    </div>
    `;


    document.body.insertAdjacentHTML(
        "beforeend",
        notificationHTML
    );


    addNotificationStyles();

}


/* =========================================
   CSS
========================================= */

function addNotificationStyles() {

    if (document.getElementById("notificationSystemStyles")) {
        return;
    }


    const style = document.createElement("style");

    style.id = "notificationSystemStyles";

    style.textContent = `

        .notificationTab,
        .saveNotificationBtn {

            border:0;
            border-radius:9px;
            padding:10px 14px;
            cursor:pointer;

        }


        .notificationTab {

            background:rgba(128,128,128,.12);
            white-space:nowrap;

        }


        .notificationTab.active {

            background:#1976d2;
            color:white;

        }


        .saveNotificationBtn {

            width:100%;
            background:#1976d2;
            color:white;
            font-size:15px;

        }


        .noticeAdminCard {

            padding:14px;
            border-radius:12px;
            margin:10px 0;
            background:rgba(128,128,128,.10);

        }


        .noticeAdminCard h4 {

            margin:0 0 7px;

        }


        .noticeAdminActions {

            display:flex;
            gap:7px;
            flex-wrap:wrap;
            margin-top:10px;

        }


        .noticeAdminActions button {

            border:0;
            padding:7px 11px;
            border-radius:7px;
            cursor:pointer;

        }

    `;


    document.head.appendChild(style);

}


/* =========================================
   EVENTS
========================================= */

function setupNotificationEvents() {


    /* Close */

    document
        .getElementById("closeNotificationModal")
        ?.addEventListener("click", () => {

            document
                .getElementById("notificationModal")
                .style.display = "none";

        });


    /* Outside click */

    document
        .getElementById("notificationModal")
        ?.addEventListener("click", (event) => {

            if (
                event.target.id ===
                "notificationModal"
            ) {

                event.target.style.display = "none";

            }

        });


    /* Tabs */

    document
        .querySelectorAll(".notificationTab")
        .forEach(button => {

            button.addEventListener("click", () => {

                const tab =
                    button.dataset.tab;


                document
                    .querySelectorAll(".notificationTab")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );


                button.classList.add("active");


                document
                    .querySelectorAll(".notificationPanel")
                    .forEach(panel => {

                        panel.style.display = "none";

                    });


                const panel =
                    document.getElementById(
                        "panel-" + tab
                    );


                if (panel) {
                    panel.style.display = "block";
                }

            });

        });


    /* Save buttons */

    document
        .querySelectorAll(".saveNotificationBtn")
        .forEach(button => {

            button.addEventListener("click", () => {

                saveOrUpdateToFirebase(
                    button.dataset.type
                );

            });

        });


    /* Reset */

    document
        .getElementById("resetNotificationForm")
        ?.addEventListener("click", resetForm);

}


/* =========================================
   OPEN MODAL
========================================= */

export function openNotificationModal() {

    const modal =
        document.getElementById(
            "notificationModal"
        );


    if (modal) {

        modal.style.display = "block";

    }

}


/* =========================================
   SAVE / UPDATE
========================================= */

async function saveOrUpdateToFirebase(type) {

    const editId =
        document.getElementById(
            "editNoticeId"
        ).value.trim();


    let title = "";
    let message = "";
    let img = "";
    let video = "";
    let keys = "";


    if (type === "sliding") {

        title =
            document.getElementById(
                "slidingTitle"
            ).value.trim();

        message =
            document.getElementById(
                "slidingMessage"
            ).value.trim();

    }


    else if (type === "home") {

        title =
            document.getElementById(
                "homeTitle"
            ).value.trim();

        message =
            document.getElementById(
                "homeMessage"
            ).value.trim();

        img =
            document.getElementById(
                "homeImage"
            ).value.trim();

        video =
            document.getElementById(
                "homeVideo"
            ).value.trim();

        keys =
            document.getElementById(
                "homeKeys"
            ).value.trim();

    }


    else if (type === "push") {

        title =
            document.getElementById(
                "pushTitle"
            ).value.trim();

        message =
            document.getElementById(
                "pushMessage"
            ).value.trim();

        img =
            document.getElementById(
                "pushImageLink"
            ).value.trim();

    }


    if (!title || !message) {

        alert(
            "দয়া করে শিরোনাম এবং বিস্তারিত বিবরণ লিখুন।"
        );

        return;

    }


    try {


        /* =================================
           EDIT
        ================================= */

        if (editId) {

            const noticeRef =
                ref(
                    db,
                    "webapp/notices/" +
                    editId
                );


            await update(noticeRef, {

                title: title,

                message: message,

                img: img,

                Video: video,

                keys: keys,

                time:
                    new Date().toLocaleString(
                        "bn-BD"
                    ) + " (এডিটেড)"

            });


            alert(
                "ফায়ারবেজে নোটিশ সফলভাবে আপডেট হয়েছে।"
            );


        }


        /* =================================
           NEW
        ================================= */

        else {

            const noticesRef =
                ref(
                    db,
                    "webapp/notices"
                );


            const newNoticeRef =
                push(noticesRef);


            await set(
                newNoticeRef,
                {

                    id: newNoticeRef.key,

                    type: type,

                    title: title,

                    message: message,

                    img: img,

                    Video: video,

                    keys: keys,

                    time:
                        new Date().toLocaleString(
                            "bn-BD"
                        )

                }
            );


            /* Push */

            if (type === "push") {

                await triggerFCMNotification(
                    title,
                    message,
                    img
                );

            }


            alert(
                type === "push"
                    ? "Push request তৈরি হয়েছে।"
                    : "নোটিশ সফলভাবে প্রকাশ হয়েছে।"
            );

        }


        resetForm();


        document
            .getElementById(
                "notificationModal"
            )
            .style.display = "none";


    } catch (error) {

        console.error(
            "Firebase Error:",
            error
        );


        alert(
            "নোটিশ প্রকাশ করতে ব্যর্থ হয়েছে।"
        );

    }

}


/* =========================================
   CREATE FCM PUSH REQUEST
========================================= */

async function triggerFCMNotification(
    title,
    body,
    imageUrl
) {

    const pushRequestsRef =
        ref(
            db,
            "webapp/push_requests"
        );


    const newPushRef =
        push(pushRequestsRef);


    await set(
        newPushRef,
        {

            id: newPushRef.key,

            title: title,

            body: body,

            image: imageUrl || "",

            url: "./index.html",

            time:
                new Date().toISOString(),

            status: "pending"

        }
    );


    console.log(
        "FCM push request created:",
        newPushRef.key
    );

}


/* =========================================
   LOAD NOTICES
========================================= */

function loadAllFirebaseListsAndListen() {

    const noticesRef =
        ref(
            db,
            "webapp/notices"
        );


    onValue(
        noticesRef,
        snapshot => {

            const data =
                snapshot.val() || {};


            const notices =
                Object.values(data);


            notices.sort(
                (a, b) =>
                    String(b.time || "")
                    .localeCompare(
                        String(a.time || "")
                    )
            );


            renderNotificationList(
                notices
            );


            renderLatestHomeNotice(
                notices
            );


            renderLatestSlidingNotice(
                notices
            );

        },

        error => {

            console.error(
                "Notice listener error:",
                error
            );

        }
    );

}


/* =========================================
   ADMIN LIST
========================================= */

function renderNotificationList(notices) {

    const container =
        document.getElementById(
            "notificationList"
        );


    if (!container) return;


    if (!notices.length) {

        container.innerHTML =
            "<p>কোনো নোটিশ পাওয়া যায়নি।</p>";

        return;

    }


    container.innerHTML =
        notices
            .map(notice => {

                const type =
                    notice.type || "unknown";


                return `

                <div class="noticeAdminCard">

                    <h4>
                        ${escapeHTML(
                            notice.title || ""
                        )}
                    </h4>

                    <div>
                        ${escapeHTML(
                            notice.message || ""
                        )}
                    </div>

                    <small>
                        Type: ${escapeHTML(type)}
                        <br>
                        ${escapeHTML(
                            notice.time || ""
                        )}
                    </small>


                    <div class="noticeAdminActions">

                        <button
                            data-edit-id="${escapeAttr(
                                notice.id
                            )}">
                            ✏️ Edit
                        </button>


                        <button
                            data-delete-id="${escapeAttr(
                                notice.id
                            )}">
                            🗑️ Delete
                        </button>

                    </div>

                </div>

                `;

            })
            .join("");


    container
        .querySelectorAll(
            "[data-edit-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editNotice(
                        button.dataset.editId,
                        notices
                    );

                }
            );

        });


    container
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteNotice(
                        button.dataset.deleteId
                    );

                }
            );

        });

}


/* =========================================
   EDIT
========================================= */

function editNotice(id, notices) {

    const notice =
        notices.find(
            item => item.id === id
        );


    if (!notice) return;


    document.getElementById(
        "editNoticeId"
    ).value = id;


    const type =
        notice.type || "sliding";


    document
        .querySelectorAll(".notificationTab")
        .forEach(btn => {

            btn.classList.toggle(
                "active",
                btn.dataset.tab === type
            );

        });


    document
        .querySelectorAll(".notificationPanel")
        .forEach(panel => {

            panel.style.display =
                "none";

        });


    const panel =
        document.getElementById(
            "panel-" + type
        );


    if (panel) {
        panel.style.display = "block";
    }


    if (type === "sliding") {

        document.getElementById(
            "slidingTitle"
        ).value = notice.title || "";


        document.getElementById(
            "slidingMessage"
        ).value = notice.message || "";

    }


    if (type === "home") {

        document.getElementById(
            "homeTitle"
        ).value = notice.title || "";


        document.getElementById(
            "homeMessage"
        ).value = notice.message || "";


        document.getElementById(
            "homeImage"
        ).value = notice.img || "";


        document.getElementById(
            "homeVideo"
        ).value = notice.Video || "";


        document.getElementById(
            "homeKeys"
        ).value = notice.keys || "";

    }


    if (type === "push") {

        document.getElementById(
            "pushTitle"
        ).value = notice.title || "";


        document.getElementById(
            "pushMessage"
        ).value = notice.message || "";


        document.getElementById(
            "pushImageLink"
        ).value = notice.img || "";

    }


    openNotificationModal();

}


/* =========================================
   DELETE
========================================= */

async function deleteNotice(id) {

    if (
        !confirm(
            "এই নোটিশটি মুছে ফেলতে চান?"
        )
    ) {
        return;
    }


    try {

        await remove(
            ref(
                db,
                "webapp/notices/" + id
            )
        );


        alert(
            "নোটিশ মুছে ফেলা হয়েছে।"
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "নোটিশ মুছতে ব্যর্থ হয়েছে।"
        );

    }

}


/* =========================================
   RESET
========================================= */

function resetForm() {

    const ids = [

        "editNoticeId",

        "slidingTitle",
        "slidingMessage",

        "homeTitle",
        "homeMessage",
        "homeImage",
        "homeVideo",
        "homeKeys",

        "pushTitle",
        "pushMessage",
        "pushImageLink"

    ];


    ids.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.value = "";

        }

    });

}


/* =========================================
   LATEST HOME NOTICE
========================================= */

function renderLatestHomeNotice(notices) {

    const homeNotices =
        notices.filter(
            item => item.type === "home"
        );


    if (!homeNotices.length) {
        return;
    }


    const latest =
        homeNotices[0];


    const sessionKey =
        "home_notice_seen_" +
        latest.id;


    if (
        sessionStorage.getItem(
            sessionKey
        )
    ) {
        return;
    }


    sessionStorage.setItem(
        sessionKey,
        "1"
    );


    showHomeNoticePopup(latest);

}


/* =========================================
   HOME POPUP
========================================= */

function showHomeNoticePopup(notice) {

    let modal =
        document.getElementById(
            "homeNoticePopupModal"
        );


    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "homeNoticePopupModal";


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:99998;
            background:rgba(0,0,0,.65);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:15px;
        `;


        document.body.appendChild(
            modal
        );

    }


    const imageHTML =
        notice.img
            ? `
                <img
                    src="${escapeAttr(notice.img)}"
                    style="
                        width:100%;
                        max-height:250px;
                        object-fit:cover;
                        border-radius:12px;
                        margin-bottom:12px;
                    "
                >
              `
            : "";


    const buttonHTML =
        notice.keys
            ? `
                <a
                    href="${escapeAttr(notice.keys)}"
                    target="_blank"
                    rel="noopener"
                    style="
                        display:inline-block;
                        margin-top:12px;
                        padding:10px 16px;
                        border-radius:9px;
                        background:#1976d2;
                        color:white;
                        text-decoration:none;
                    ">
                    🌐 Website
                </a>
              `
            : "";


    modal.innerHTML = `

        <div style="
            width:min(95%,550px);
            background:var(--card-bg,#fff);
            color:var(--text-color,#111);
            padding:20px;
            border-radius:18px;
            max-height:90vh;
            overflow:auto;
        ">

            ${imageHTML}


            <h2>
                ${escapeHTML(
                    notice.title || ""
                )}
            </h2>


            <div style="
                white-space:pre-wrap;
                line-height:1.6;
            ">
                ${escapeHTML(
                    notice.message || ""
                )}
            </div>


            ${buttonHTML}


            <div style="text-align:right;margin-top:15px;">

                <button
                    id="closeHomeNoticePopup"
                    style="
                        padding:9px 15px;
                        border:0;
                        border-radius:8px;
                        cursor:pointer;
                    ">
                    বন্ধ করুন
                </button>

            </div>

        </div>
    `;


    document
        .getElementById(
            "closeHomeNoticePopup"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

}


/* =========================================
   LATEST SLIDING
========================================= */

function renderLatestSlidingNotice(notices) {

    const sliding =
        notices.filter(
            item => item.type === "sliding"
        );


    if (!sliding.length) {
        return;
    }


    const latest =
        sliding[0];


    const element =
        document.getElementById(
            "slidingNoticeText"
        );


    if (element) {

        element.textContent =
            latest.title +
            " — " +
            latest.message;

    }

}


/* =========================================
   HTML SECURITY HELPERS
========================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttr(value) {

    return escapeHTML(value);

}
