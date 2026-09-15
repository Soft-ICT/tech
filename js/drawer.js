// js/drawer.js

export function initDrawer() {

    const drawerHTML = `
        <div id="appDrawerOverlay" class="drawer-overlay"></div>

        <nav id="appDrawer" class="app-drawer">

            <div class="drawer-header">
                <div class="drawer-header-bg-glow"></div>

                <div class="drawer-profile-area">

                    <div class="drawer-avatar"
                         style="overflow:hidden;border-radius:12px;
                                display:flex;align-items:center;
                                justify-content:center;background:#fff;">
                        <img src="icon/icon-192.png"
                             alt=""
                             style="width:100%;height:100%;object-fit:cover;">
                    </div>

                    <div class="drawer-title-texts">
                        <h3>Police Phonebook</h3>
                        <p>Bangladesh Police</p>
                    </div>

                </div>

                <button id="closeDrawerBtn"
                        class="close-drawer-btn"
                        type="button"
                        title="বন্ধ করুন">
                    <span>✕</span>
                </button>
            </div>

            <div class="drawer-body">

                <ul class="drawer-menu-list">
                    <li data-action="home" class="active">
                        <span class="menu-ico">📖</span>
                        <span class="menu-text">Police Phonebook</span>
                    </li>

                    <li data-action="search">
                        <span class="menu-ico">🔍</span>
                        <span class="menu-text">Search All Unit & Number</span>
                    </li>

                    <li data-action="favorite" id="drawerFavoriteItem">
                        <span class="menu-ico">❤️</span>
                        <span class="menu-text">Favorite Number</span>
                    </li>

                    <li data-action="notice-box">
                        <span class="menu-ico">📢</span>
                        <span class="menu-text">Notice Box</span>
                    </li>
                </ul>

                <div class="drawer-divider"></div>
                <div class="drawer-section-title">Tools</div>

                <ul class="drawer-menu-list">
                    <li data-action="settings">
                        <span class="menu-ico">⚙️</span>
                        <span class="menu-text">Setting Menu</span>
                    </li>

                    <li data-action="delete-db" class="text-danger">
                        <span class="menu-ico">🗑️</span>
                        <span class="menu-text">Delete Database</span>
                    </li>

                    <li data-action="privacy">
                        <span class="menu-ico">🔒</span>
                        <span class="menu-text">Privacy Policy</span>
                    </li>
                </ul>

                <div class="drawer-divider"></div>
                <div class="drawer-section-title">Communicate</div>

                <ul class="drawer-menu-list">
                    <li data-action="about">
                        <span class="menu-ico">ℹ️</span>
                        <span class="menu-text">About App</span>
                    </li>

                    <li data-action="update-app">
                        <span class="menu-ico">📲</span>
                        <span class="menu-text">Update App</span>
                    </li>

                    <li data-action="share">
                        <span class="menu-ico">🔗</span>
                        <span class="menu-text">Share App</span>
                    </li>
                </ul>

            </div>

            <div class="drawer-footer">
                <span>Secure • Version 1.1.0</span>
            </div>

        </nav>
    `;

    const existingDrawer = document.getElementById("appDrawer");
    const existingOverlay =
        document.getElementById("appDrawerOverlay");

    if (existingDrawer) existingDrawer.remove();
    if (existingOverlay) existingOverlay.remove();

    document.body.insertAdjacentHTML("beforeend", drawerHTML);

    const drawer = document.getElementById("appDrawer");
    const overlay =
        document.getElementById("appDrawerOverlay");
    const navToggleBtn =
        document.getElementById("navToggleBtn");
    const closeDrawerBtn =
        document.getElementById("closeDrawerBtn");

    function openDrawer() {
        drawer.classList.add("open");
        overlay.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
        drawer.classList.remove("open");
        overlay.classList.remove("show");
        document.body.style.overflow = "";
    }

    if (navToggleBtn) {
        navToggleBtn.addEventListener("click", e => {
            e.stopPropagation();

            const menuIcon =
                document.getElementById("menuIcon");
            const backIcon =
                document.getElementById("backIcon");
            const searchBox =
                document.getElementById("searchBox");

            const isMenuVisible =
                menuIcon &&
                !menuIcon.classList.contains("hidden");

            const isBackVisible =
                backIcon &&
                !backIcon.classList.contains("hidden");

            const isSearchOpen =
                searchBox &&
                !searchBox.classList.contains("hidden");

            if (isSearchOpen || isBackVisible || !isMenuVisible) {
                return;
            }

            if (drawer.classList.contains("open")) {
                closeDrawer();
            } else {
                openDrawer();
            }
        });
    }

    overlay.addEventListener("click", closeDrawer);
    closeDrawerBtn.addEventListener("click", closeDrawer);

    drawer.querySelectorAll(".drawer-menu-list li").forEach(item => {
        item.addEventListener("click", () => {
            handleDrawerAction(
                item.getAttribute("data-action")
            );
            closeDrawer();
        });
    });

    applySavedThemeStyles();
}


/* ============================================================
   PERSISTENT THEME / SPLASH
============================================================ */

function applySavedThemeStyles() {

    const bgColor =
        localStorage.getItem("app_bg_color");

    const textColor =
        localStorage.getItem("app_text_color");

    const themeColor =
        localStorage.getItem("app_theme_color");

    const bgImage =
        localStorage.getItem("app_bg_image");


    applyBackgroundToElement(
        document.body,
        bgColor,
        bgImage
    );


    const splash =
        document.getElementById("splash-screen");

    if (splash) {
        applyBackgroundToElement(
            splash,
            bgColor,
            bgImage
        );
    }


    if (themeColor) {
        document.querySelectorAll(
            ".app-header, header"
        ).forEach(el => {
            el.style.setProperty(
                "background-color",
                themeColor,
                "important"
            );
        });
    }


    if (textColor) {
        applySavedTextColor();
    }


    /*
     * Formatter চালানোর পর saved global color আবার
     * unformatted content-এ প্রয়োগ হবে।
     */
    setTimeout(applySavedTextColor, 0);
    setTimeout(applySavedTextColor, 100);
    setTimeout(applySavedTextColor, 500);
}


/* ============================================================
   BACKGROUND HELPER
============================================================ */

function applyBackgroundToElement(
    element,
    color,
    image
) {
    if (!element) return;

    if (color) {
        element.style.setProperty(
            "background-color",
            color,
            "important"
        );
    }

    if (image) {
        element.style.setProperty(
            "background-image",
            `url("${image}")`,
            "important"
        );

        element.style.setProperty(
            "background-size",
            "cover",
            "important"
        );

        element.style.setProperty(
            "background-position",
            "center center",
            "important"
        );

        element.style.setProperty(
            "background-repeat",
            "no-repeat",
            "important"
        );
    } else {
        element.style.removeProperty("background-image");
    }
}


/* ============================================================
   SAVED TEXT COLOR
============================================================ */

function applySavedTextColor() {

    const color =
        localStorage.getItem("app_text_color");

    if (!color) return;


    /*
     * color-formatter.js থাকলে তার safe function ব্যবহার করি।
     */
    if (
        window.firebaseTextFormatter &&
        typeof window.firebaseTextFormatter.applySavedTextColor ===
        "function"
    ) {
        window.firebaseTextFormatter.applySavedTextColor(
            document.body
        );
        return;
    }


    /*
     * Fallback.
     */
    const selectors = [
        "h1","h2","h3","h4","h5","h6",
        "p","span","a","label","li",
        "b","strong","td","th","small","em",
        "[data-category]",
        "[data-subcategory]",
        "[data-content]",
        "[data-profile]",
        "[data-data]",
        "[data-color-text]",
        "[class*='card']",
        "[class*='profile']",
        "[class*='category']",
        "[class*='subcategory']",
        "[class*='data']",
        "[class*='notice']"
    ];

    document.querySelectorAll(
        selectors.join(",")
    ).forEach(el => {

        if (
            el.closest("#appDrawer") ||
            el.closest("#settingsModal") ||
            el.closest("#customDeleteModal") ||
            el.classList.contains("firebase-formatted-text") ||
            el.querySelector(".firebase-formatted-text")
        ) {
            return;
        }

        el.style.setProperty(
            "color",
            color,
            "important"
        );
    });
}


/* ============================================================
   CUSTOM DELETE MODAL
============================================================ */

function showCustomDeleteModal(onConfirm) {

    const existing =
        document.getElementById("customDeleteModal");

    if (existing) existing.remove();

    const modalHTML = `
        <div id="customDeleteModal"
             style="
                position:fixed;top:0;left:0;width:100%;height:100%;
                background:rgba(0,0,0,.5);
                display:flex;align-items:center;
                justify-content:center;z-index:99999;padding:20px;
             ">

            <div style="
                background:#fff;width:100%;max-width:380px;
                border-radius:20px;padding:24px;
                box-shadow:0 10px 25px rgba(0,0,0,.2);
                position:relative;font-family:inherit;
            ">

                <button id="modalCloseBtn"
                        style="
                            position:absolute;top:18px;right:18px;
                            background:none;border:none;font-size:20px;
                            cursor:pointer;color:#333;
                        ">
                    ✕
                </button>

                <h3 style="
                    margin:0 0 15px 0;font-size:20px;
                    font-weight:700;color:#111;
                ">
                    নিশ্চিতকরণ
                </h3>

                <p style="
                    margin:0 0 25px 0;font-size:15px;
                    color:#444;line-height:1.5;
                ">
                    আপনি কি নিশ্চিত সমস্ত ডাটা ও লগইন তথ্য মুছে
                    ফেলতে চান? (এর ফলে অ্যাপটি একদম প্রথম
                    ইন্সটলের অবস্থার মতো হয়ে যাবে এবং পুনরায়
                    পাসওয়ার্ড দিয়ে প্রবেশ করতে হবে।)
                </p>

                <div style="
                    display:flex;justify-content:flex-end;gap:10px;
                ">
                    <button id="modalCancelBtn"
                            style="
                                padding:8px 18px;border:1px solid #ccc;
                                background:#fff;color:#333;border-radius:8px;
                                font-size:14px;font-weight:600;cursor:pointer;
                            ">
                        বাতিল
                    </button>

                    <button id="modalConfirmBtn"
                            style="
                                padding:8px 18px;border:none;
                                background:#ff4d4d;color:#fff;
                                border-radius:8px;font-size:14px;
                                font-weight:600;cursor:pointer;
                            ">
                        হ্যাঁ, মুছুন
                    </button>
                </div>

            </div>
        </div>
    `;

    document.body.insertAdjacentHTML(
        "beforeend",
        modalHTML
    );

    const modal =
        document.getElementById("customDeleteModal");

    document.getElementById("modalCloseBtn")
        .addEventListener("click", () => modal.remove());

    document.getElementById("modalCancelBtn")
        .addEventListener("click", () => modal.remove());

    modal.addEventListener("click", e => {
        if (e.target === modal) modal.remove();
    });

    document.getElementById("modalConfirmBtn")
        .addEventListener("click", () => {
            modal.remove();
            onConfirm();
        });
}


/* ============================================================
   SETTINGS MODAL
============================================================ */

function initSettingsModal() {

    const existing =
        document.getElementById("settingsModal");

    if (existing) existing.remove();


    const themeColor =
        localStorage.getItem("app_theme_color") ||
        "#ff0000";

    const bgColor =
        localStorage.getItem("app_bg_color") ||
        "#3f51b5";

    const textColor =
        localStorage.getItem("app_text_color") ||
        "#ffffff";

    const language =
        localStorage.getItem("app_language") ||
        "bn";

    const isDarkMode =
        localStorage.getItem("app_dark_mode") === "true";


    const modalHTML = `
        <div id="settingsModal"
             style="
                position:fixed;top:0;left:0;width:100%;height:100%;
                background:rgba(0,0,0,.5);
                display:flex;align-items:center;
                justify-content:center;z-index:99999;padding:20px;
             ">

            <div style="
                background:#fff;width:100%;max-width:420px;
                border-radius:20px;padding:24px;
                box-shadow:0 10px 25px rgba(0,0,0,.2);
                position:relative;font-family:inherit;
                max-height:90vh;overflow-y:auto;
            ">

                <button id="settingsCloseBtn"
                        style="
                            position:absolute;top:18px;right:18px;
                            background:none;border:none;font-size:20px;
                            cursor:pointer;color:#333;z-index:2;
                        ">
                    ✕
                </button>

                <div style="
                    display:flex;justify-content:space-between;
                    align-items:center;margin-bottom:20px;
                    padding-right:35px;
                ">
                    <h3 style="
                        margin:0;font-size:20px;
                        font-weight:700;color:#111;
                    ">
                        ⚙️ Setting
                    </h3>

                    <button id="darkModeToggleBtn"
                            type="button"
                            title="Dark/Light Mode"
                            style="
                                background:none;border:1px solid #ddd;
                                border-radius:50%;width:36px;height:36px;
                                cursor:pointer;font-size:18px;
                                display:flex;align-items:center;
                                justify-content:center;
                            ">
                        ${isDarkMode ? "🌞" : "🌙"}
                    </button>
                </div>

                <div style="
                    display:flex;flex-direction:column;gap:16px;
                ">

                    <div style="
                        display:flex;justify-content:space-between;
                        align-items:center;border-bottom:1px solid #eee;
                        padding-bottom:10px;
                    ">
                        <label style="
                            font-size:15px;font-weight:600;color:#333;
                        ">
                            Theme
                        </label>

                        <input type="color"
                               id="themeColorInput"
                               value="${themeColor}"
                               style="
                                    width:40px;height:40px;border:none;
                                    border-radius:50%;cursor:pointer;
                                    background:none;
                               ">
                    </div>

                    <div style="
                        display:flex;justify-content:space-between;
                        align-items:center;border-bottom:1px solid #eee;
                        padding-bottom:10px;
                    ">
                        <label style="
                            font-size:15px;font-weight:600;color:#333;
                        ">
                            Background Color
                        </label>

                        <input type="color"
                               id="bgColorInput"
                               value="${bgColor}"
                               style="
                                    width:40px;height:40px;border:none;
                                    border-radius:50%;cursor:pointer;
                                    background:none;
                               ">
                    </div>

                    <div style="
                        display:flex;justify-content:space-between;
                        align-items:center;border-bottom:1px solid #eee;
                        padding-bottom:10px;
                    ">
                        <label style="
                            font-size:15px;font-weight:600;color:#333;
                        ">
                            Text Color
                        </label>

                        <input type="color"
                               id="textColorInput"
                               value="${textColor}"
                               style="
                                    width:40px;height:40px;border:none;
                                    border-radius:50%;cursor:pointer;
                                    background:none;
                               ">
                    </div>

                    <div style="
                        display:flex;flex-direction:column;gap:10px;
                        border-bottom:1px solid #eee;padding-bottom:10px;
                    ">
                        <label style="
                            font-size:15px;font-weight:600;
                            color:#333;text-align:center;
                        ">
                            Apps Data View Mode
                        </label>

                        <div style="
                            display:flex;justify-content:space-around;
                            align-items:center;
                        ">
                            <label style="
                                display:flex;align-items:center;gap:8px;
                                cursor:pointer;font-size:14px;
                                font-weight:500;
                            ">
                                <input type="radio"
                                       name="appLang"
                                       value="en"
                                       ${language === "en" ? "checked" : ""}
                                       style="cursor:pointer;">
                                English 🇬🇧
                            </label>

                            <label style="
                                display:flex;align-items:center;gap:8px;
                                cursor:pointer;font-size:14px;
                                font-weight:500;
                            ">
                                <input type="radio"
                                       name="appLang"
                                       value="bn"
                                       ${language === "bn" ? "checked" : ""}
                                       style="cursor:pointer;">
                                Bangla 🇧🇩
                            </label>
                        </div>
                    </div>
                </div>

                <div style="
                    margin-top:20px;display:flex;
                    flex-direction:column;gap:10px;
                ">
                    <button id="resetSettingsBtn"
                            style="
                                width:100%;background:#2196F3;color:#fff;
                                border:none;padding:12px;border-radius:10px;
                                font-size:15px;font-weight:600;cursor:pointer;
                            ">
                        Reset Settings
                    </button>

                    <button id="clearDataBtn"
                            style="
                                width:100%;background:#2196F3;color:#fff;
                                border:none;padding:12px;border-radius:10px;
                                font-size:15px;font-weight:600;cursor:pointer;
                            ">
                        Clear Apps Data
                    </button>
                </div>

            </div>
        </div>
    `;

    document.body.insertAdjacentHTML(
        "beforeend",
        modalHTML
    );

    const modal =
        document.getElementById("settingsModal");


    /* ============================================================
       BACKGROUND COLOR
    ============================================================ */

    document.getElementById("bgColorInput")
        .addEventListener("input", e => {

            const color = e.target.value;

            localStorage.setItem(
                "app_bg_color",
                color
            );

            applyBackgroundToElement(
                document.body,
                color,
                localStorage.getItem("app_bg_image")
            );

            const splash =
                document.getElementById("splash-screen");

            if (splash) {
                applyBackgroundToElement(
                    splash,
                    color,
                    localStorage.getItem("app_bg_image")
                );
            }
        });


    /* ============================================================
       TEXT COLOR
    ============================================================ */

    document.getElementById("textColorInput")
        .addEventListener("input", e => {

            const color = e.target.value;

            localStorage.setItem(
                "app_text_color",
                color
            );

            applySavedTextColor();

            /*
             * Formatter-এর explicit Firebase colors আবার
             * নিশ্চিত করি।
             */
            if (
                typeof window.applyFirebaseTextColors ===
                "function"
            ) {
                window.applyFirebaseTextColors(
                    document.body
                );
            }

            setTimeout(
                applySavedTextColor,
                0
            );

            setTimeout(
                applySavedTextColor,
                100
            );
        });


    /* ============================================================
       THEME COLOR
    ============================================================ */

    document.getElementById("themeColorInput")
        .addEventListener("input", e => {

            const color = e.target.value;

            localStorage.setItem(
                "app_theme_color",
                color
            );

            document.querySelectorAll(
                ".app-header, header"
            ).forEach(el => {
                el.style.setProperty(
                    "background-color",
                    color,
                    "important"
                );
            });
        });


    /* ============================================================
       DARK MODE
    ============================================================ */

    document.getElementById("darkModeToggleBtn")
        .addEventListener("click", () => {

            const state =
                localStorage.getItem(
                    "app_dark_mode"
                ) === "true";

            const newState = !state;

            localStorage.setItem(
                "app_dark_mode",
                newState
            );

            document.body.classList.toggle(
                "dark-mode",
                newState
            );

            document.getElementById(
                "darkModeToggleBtn"
            ).innerHTML =
                newState ? "🌞" : "🌙";
        });


    /* ============================================================
       CLOSE
    ============================================================ */

    document.getElementById("settingsCloseBtn")
        .addEventListener("click", () => {
            modal.remove();
            window.location.reload();
        });

    modal.addEventListener("click", e => {
        if (e.target === modal) {
            modal.remove();
            window.location.reload();
        }
    });


    /* ============================================================
       RESET
    ============================================================ */

    document.getElementById("resetSettingsBtn")
        .addEventListener("click", () => {

            localStorage.removeItem("app_theme_color");
            localStorage.removeItem("app_bg_color");
            localStorage.removeItem("app_text_color");
            localStorage.removeItem("app_bg_image");
            localStorage.removeItem("app_language");
            localStorage.removeItem("app_dark_mode");

            alert("সেটিংস রিসেট করা হয়েছে!");

            modal.remove();
            window.location.reload();
        });


    /* ============================================================
       CLEAR DATA
    ============================================================ */

    document.getElementById("clearDataBtn")
        .addEventListener("click", () => {

            modal.remove();

            showCustomDeleteModal(() => {

                localStorage.clear();
                sessionStorage.clear();

                window.location.reload();
            });
        });


    if (
        typeof window.createBackgroundImageUI ===
        "function"
    ) {
        window.createBackgroundImageUI();
    }
}


/* ============================================================
   DRAWER ACTIONS
============================================================ */

function handleDrawerAction(action) {

    switch (action) {

        case "home":

            if (
                typeof showMainDashboardView ===
                "function"
            ) {
                history.pushState(
                    { page: "home" },
                    ""
                );

                showMainDashboardView();
            }

            break;


        case "search":

            const allSearchBtn =
                document.getElementById(
                    "allSearchBtn"
                );

            if (allSearchBtn) {
                allSearchBtn.click();
            }

            break;


        case "favorite":

            if (
                typeof renderFavoriteView ===
                "function"
            ) {
                renderFavoriteView(true);
            }

            break;


        case "settings":

            initSettingsModal();

            break;


        case "delete-db":

            showCustomDeleteModal(() => {

                localStorage.clear();
                sessionStorage.clear();

                window.location.reload();
            });

            break;


        case "notice-box":

            console.log("Notice Box clicked");

            break;


        case "share":

            if (navigator.share) {

                navigator.share({
                    title: "Police Phonebook",
                    url: window.location.href
                }).catch(console.error);

            } else {

                alert(
                    "Sharing not supported on this browser."
                );

            }

            break;


        default:

            console.log(
                action + " clicked"
            );
    }
}


/* ============================================================
   APPLY THEME VERY EARLY + AFTER DOM
============================================================ */

function bootSavedTheme() {

    applySavedThemeStyles();

    /*
     * Splash screen যদি পরে তৈরি হয়,
     * আবার apply করা হবে।
     */
    setTimeout(
        applySavedThemeStyles,
        0
    );

    setTimeout(
        applySavedThemeStyles,
        100
    );

    setTimeout(
        applySavedThemeStyles,
        500
    );
}

bootSavedTheme();

document.addEventListener(
    "DOMContentLoaded",
    bootSavedTheme
);
