// js/drawer.js

export function initDrawer() {

    const drawerHTML = `
        <div id="appDrawerOverlay" class="drawer-overlay"></div>

        <nav id="appDrawer" class="app-drawer">

            <div class="drawer-header">
                <div class="drawer-header-bg-glow"></div>

                <div class="drawer-profile-area">

                    <div class="drawer-avatar"
                         style="overflow:hidden;
                                border-radius:12px;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                background:#fff;">

                        <img src="icon/icon-192.png"
                             alt=""
                             style="width:100%;
                                    height:100%;
                                    object-fit:cover;">
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
                        <span class="menu-text">
                            Police Phonebook
                        </span>
                    </li>

                    <li data-action="search">
                        <span class="menu-ico">🔍</span>
                        <span class="menu-text">
                            Search All Unit & Number
                        </span>
                    </li>

                    <li data-action="favorite" id="drawerFavoriteItem">
                        <span class="menu-ico">❤️</span>
                        <span class="menu-text">
                            Favorite Number
                        </span>
                    </li>

                    <li data-action="notice-box">
                        <span class="menu-ico">📢</span>
                        <span class="menu-text">
                            Notice Box
                        </span>
                    </li>

                </ul>


                <div class="drawer-divider"></div>

                <div class="drawer-section-title">
                    Tools
                </div>


                <ul class="drawer-menu-list">

                    <li data-action="settings">
                        <span class="menu-ico">⚙️</span>
                        <span class="menu-text">
                            Setting Menu
                        </span>
                    </li>

                    <li data-action="delete-db"
                        class="text-danger">

                        <span class="menu-ico">🗑️</span>

                        <span class="menu-text">
                            Delete Database
                        </span>

                    </li>

                    <li data-action="privacy">

                        <span class="menu-ico">🔒</span>

                        <span class="menu-text">
                            Privacy Policy
                        </span>

                    </li>

                </ul>


                <div class="drawer-divider"></div>

                <div class="drawer-section-title">
                    Communicate
                </div>


                <ul class="drawer-menu-list">

                    <li data-action="about">

                        <span class="menu-ico">ℹ️</span>

                        <span class="menu-text">
                            About App
                        </span>

                    </li>

                    <li data-action="update-app">

                        <span class="menu-ico">📲</span>

                        <span class="menu-text">
                            Update App
                        </span>

                    </li>

                    <li data-action="share">

                        <span class="menu-ico">🔗</span>

                        <span class="menu-text">
                            Share App
                        </span>

                    </li>

                </ul>

            </div>


            <div class="drawer-footer">
                <span>
                    Secure • Version 1.1.0
                </span>
            </div>

        </nav>
    `;


    /* ============================================================
       REMOVE OLD DRAWER
    ============================================================ */

    const existingDrawer =
        document.getElementById('appDrawer');

    const existingOverlay =
        document.getElementById('appDrawerOverlay');


    if (existingDrawer) {
        existingDrawer.remove();
    }

    if (existingOverlay) {
        existingOverlay.remove();
    }


    document.body.insertAdjacentHTML(
        'beforeend',
        drawerHTML
    );


    const drawer =
        document.getElementById('appDrawer');

    const overlay =
        document.getElementById('appDrawerOverlay');

    const navToggleBtn =
        document.getElementById('navToggleBtn');

    const closeDrawerBtn =
        document.getElementById('closeDrawerBtn');


    /* ============================================================
       DRAWER OPEN
    ============================================================ */

    function openDrawer() {

        drawer.classList.add('open');

        overlay.classList.add('show');

        document.body.style.overflow = 'hidden';

    }


    /* ============================================================
       DRAWER CLOSE
    ============================================================ */

    function closeDrawer() {

        drawer.classList.remove('open');

        overlay.classList.remove('show');

        document.body.style.overflow = '';

    }


    /* ============================================================
       NAV BUTTON
    ============================================================ */

    if (navToggleBtn) {

        navToggleBtn.addEventListener(
            'click',
            (e) => {

                e.stopPropagation();


                const menuIcon =
                    document.getElementById('menuIcon');

                const backIcon =
                    document.getElementById('backIcon');

                const searchBox =
                    document.getElementById('searchBox');


                const isMenuVisible =
                    menuIcon &&
                    !menuIcon.classList.contains('hidden');


                const isBackVisible =
                    backIcon &&
                    !backIcon.classList.contains('hidden');


                const isSearchOpen =
                    searchBox &&
                    !searchBox.classList.contains('hidden');


                /*
                 * Search / Back button active থাকলে
                 * Drawer open হবে না।
                 */

                if (
                    isSearchOpen ||
                    isBackVisible ||
                    !isMenuVisible
                ) {
                    return;
                }


                if (
                    drawer.classList.contains('open')
                ) {

                    closeDrawer();

                } else {

                    openDrawer();

                }

            }
        );

    }


    /* ============================================================
       OVERLAY / CLOSE
    ============================================================ */

    overlay.addEventListener(
        'click',
        closeDrawer
    );


    closeDrawerBtn.addEventListener(
        'click',
        closeDrawer
    );


    /* ============================================================
       DRAWER MENU
    ============================================================ */

    const menuItems =
        drawer.querySelectorAll(
            '.drawer-menu-list li'
        );


    menuItems.forEach(
        item => {

            item.addEventListener(
                'click',
                () => {

                    const action =
                        item.getAttribute(
                            'data-action'
                        );


                    handleDrawerAction(action);

                    closeDrawer();

                }
            );

        }
    );


    /*
     * অ্যাপ চালু হওয়ার সময় saved theme
     * apply হবে।
     */

    applySavedThemeStyles();

}


/* ================================================================
   APPLY SAVED THEME
   ================================================================ */

function applySavedThemeStyles() {

    const bgColor =
        localStorage.getItem(
            'app_bg_color'
        );


    const textColor =
        localStorage.getItem(
            'app_text_color'
        );


    const themeColor =
        localStorage.getItem(
            'app_theme_color'
        );


    const bgImage =
        localStorage.getItem(
            'app_bg_image'
        );


    /* ============================================================
       BACKGROUND COLOR
    ============================================================ */

    if (bgColor) {

        document.body.style.backgroundColor =
            bgColor;

    }


    /* ============================================================
       BACKGROUND IMAGE
       Image থাকলে image থাকবে।
       Color থাকলে তার নিচে color থাকবে।
    ============================================================ */

    if (bgImage) {

        document.body.style.backgroundImage =
            `url("${bgImage}")`;

        document.body.style.backgroundSize =
            'cover';

        document.body.style.backgroundPosition =
            'center';

        document.body.style.backgroundRepeat =
            'no-repeat';

        document.body.style.backgroundAttachment =
            'fixed';

    } else {

        document.body.style.backgroundImage =
            '';

    }


    /* ============================================================
       SPLASH SCREEN
       Background color + image দুটোই sync হবে।
    ============================================================ */

    applySplashBackground(
        bgColor,
        bgImage
    );


    /* ============================================================
       THEME COLOR
    ============================================================ */

    if (themeColor) {

        const headerElements =
            document.querySelectorAll(
                '.app-header, header'
            );


        headerElements.forEach(
            el => {

                el.style.backgroundColor =
                    themeColor;

            }
        );

    }


    /* ============================================================
       IMPORTANT:
       GLOBAL TEXT COLOR আর inlineভাবে apply করা হবে না
       category / sub-category / data / profile-এ।

       কারণ color-formatter.js Firebase-এর
       #red / #blue / #green ইত্যাদি নিজস্ব color
       apply করে।

       শুধুমাত্র সাধারণ UI text-এ saved text color
       apply হবে।
    ============================================================ */

    if (textColor) {

        applyGlobalTextColorSafely(
            textColor
        );

    }


    /*
     * Dynamic Firebase content পরে render হলে
     * formatter আবার চালানো হবে।
     */

    setTimeout(
        refreshDynamicTextFormatter,
        0
    );

    setTimeout(
        refreshDynamicTextFormatter,
        150
    );

    setTimeout(
        refreshDynamicTextFormatter,
        500
    );

}


/* ================================================================
   SPLASH BACKGROUND
   ================================================================ */

function applySplashBackground(
    bgColor,
    bgImage
) {

    const splashScreen =
        document.getElementById(
            'splashScreen'
        );


    if (!splashScreen) {
        return;
    }


    /*
     * প্রথমে color
     */

    if (bgColor) {

        splashScreen.style.backgroundColor =
            bgColor;

    }


    /*
     * তারপর image
     */

    if (bgImage) {

        splashScreen.style.backgroundImage =
            `url("${bgImage}")`;

        splashScreen.style.backgroundSize =
            'cover';

        splashScreen.style.backgroundPosition =
            'center';

        splashScreen.style.backgroundRepeat =
            'no-repeat';

        splashScreen.style.backgroundAttachment =
            'fixed';

    } else {

        splashScreen.style.backgroundImage =
            '';

    }

}


/* ================================================================
   SAFE GLOBAL TEXT COLOR
   ================================================================ */

function applyGlobalTextColorSafely(
    textColor
) {

    /*
     * যেসব এলাকা Firebase formatter
     * নিজে থেকে color করবে সেগুলো বাদ।
     */

    const excludedSelectors = [

        '#appDrawer',

        '#settingsModal',

        '#customDeleteModal',

        '[data-category]',

        '[data-subcategory]',

        '[data-content]',

        '[data-profile]',

        '[data-data]',

        '[data-color-text]',

        '.data-card',

        '.profile-card',

        '.profile-name',

        '.category-card',

        '.subcategory-card',

        '.data-profile',

        '.data-content',

        '.notice',

        '.sliding-notice'

    ];


    const selector =
        `
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        p,
        span,
        a,
        label,
        li,
        .card,
        .title
        `;


    const elements =
        document.querySelectorAll(
            selector
        );


    elements.forEach(
        el => {

            /*
             * Formatter-controlled element হলে
             * global text color দেওয়া হবে না।
             */

            const isExcluded =
                excludedSelectors.some(
                    selector => {

                        try {

                            return !!el.closest(
                                selector
                            );

                        } catch (error) {

                            return false;

                        }

                    }
                );


            if (isExcluded) {
                return;
            }


            /*
             * Drawer-এর text পরিবর্তন হবে না।
             */

            if (
                el.closest('#appDrawer')
            ) {
                return;
            }


            /*
             * Settings modal-এর text পরিবর্তন হবে না।
             */

            if (
                el.closest('#settingsModal')
            ) {
                return;
            }


            /*
             * Delete modal-এর text পরিবর্তন হবে না।
             */

            if (
                el.closest('#customDeleteModal')
            ) {
                return;
            }


            el.style.color =
                textColor;

        }
    );


    /*
     * Splash-এর সাধারণ text
     */

    const splashScreen =
        document.getElementById(
            'splashScreen'
        );


    if (splashScreen) {

        splashScreen
            .querySelectorAll(
                'h1,h2,h3,h4,h5,h6,p,span'
            )
            .forEach(
                el => {

                    el.style.color =
                        textColor;

                }
            );

    }

}


/* ================================================================
   REFRESH COLOR FORMATTER
   ================================================================ */

function refreshDynamicTextFormatter() {

    /*
     * আপনার color-formatter.js-এ যদি
     * এই function থাকে, সেটি চালানো হবে।
     */

    if (
        typeof window.applyFirebaseTextColors ===
        'function'
    ) {

        try {

            window.applyFirebaseTextColors(
                document.body
            );

        } catch (error) {

            console.warn(
                'Color formatter refresh failed:',
                error
            );

        }

    }


    /*
     * বিকল্প global function থাকলে সেটিও support করবে।
     */

    else if (
        typeof window.applySavedTextColors ===
        'function'
    ) {

        try {

            window.applySavedTextColors();

        } catch (error) {

            console.warn(
                'Saved text color refresh failed:',
                error
            );

        }

    }

}


/* ================================================================
   DOM READY
   ================================================================ */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        applySavedThemeStyles();

    }
);


/* ================================================================
   CUSTOM DELETE MODAL
   ================================================================ */

function showCustomDeleteModal(
    onConfirm
) {

    const existingModal =
        document.getElementById(
            'customDeleteModal'
        );


    if (existingModal) {
        existingModal.remove();
    }


    const modalHTML = `

        <div id="customDeleteModal"
             style="
                position:fixed;
                top:0;
                left:0;
                width:100%;
                height:100%;
                background:rgba(0,0,0,0.5);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:99999;
                padding:20px;
             ">

            <div style="
                background:#fff;
                width:100%;
                max-width:380px;
                border-radius:20px;
                padding:24px;
                box-shadow:0 10px 25px rgba(0,0,0,0.2);
                position:relative;
                font-family:inherit;
            ">

                <button id="modalCloseBtn"
                        style="
                            position:absolute;
                            top:18px;
                            right:18px;
                            background:none;
                            border:none;
                            font-size:20px;
                            cursor:pointer;
                            color:#333;
                        ">
                    ✕
                </button>


                <h3 style="
                    margin:0 0 15px 0;
                    font-size:20px;
                    font-weight:700;
                    color:#111;
                ">
                    নিশ্চিতকরণ
                </h3>


                <p style="
                    margin:0 0 25px 0;
                    font-size:15px;
                    color:#444;
                    line-height:1.5;
                ">
                    আপনি কি নিশ্চিত সমস্ত ডাটা ও লগইন তথ্য
                    মুছে ফেলতে চান? (এর ফলে অ্যাপটি একদম
                    প্রথম ইন্সটলের অবস্থার মতো হয়ে যাবে এবং
                    পুনরায় পাসওয়ার্ড দিয়ে প্রবেশ করতে হবে।)
                </p>


                <div style="
                    display:flex;
                    justify-content:flex-end;
                    gap:10px;
                ">

                    <button id="modalCancelBtn"
                            style="
                                padding:8px 18px;
                                border:1px solid #ccc;
                                background:#fff;
                                color:#333;
                                border-radius:8px;
                                font-size:14px;
                                font-weight:600;
                                cursor:pointer;
                            ">
                        বাতিল
                    </button>


                    <button id="modalConfirmBtn"
                            style="
                                padding:8px 18px;
                                border:none;
                                background:#ff4d4d;
                                color:#fff;
                                border-radius:8px;
                                font-size:14px;
                                font-weight:600;
                                cursor:pointer;
                            ">
                        হ্যাঁ, মুছুন
                    </button>

                </div>

            </div>

        </div>
    `;


    document.body.insertAdjacentHTML(
        'beforeend',
        modalHTML
    );


    const modal =
        document.getElementById(
            'customDeleteModal'
        );


    document
        .getElementById('modalCloseBtn')
        .addEventListener(
            'click',
            () => modal.remove()
        );


    document
        .getElementById('modalCancelBtn')
        .addEventListener(
            'click',
            () => modal.remove()
        );


    modal.addEventListener(
        'click',
        e => {

            if (e.target === modal) {

                modal.remove();

            }

        }
    );


    document
        .getElementById('modalConfirmBtn')
        .addEventListener(
            'click',
            () => {

                modal.remove();

                onConfirm();

            }
        );

}


/* ================================================================
   SETTINGS MODAL
   ================================================================ */

function initSettingsModal() {

    const existingModal =
        document.getElementById(
            'settingsModal'
        );


    if (existingModal) {
        existingModal.remove();
    }


    const themeColor =
        localStorage.getItem(
            'app_theme_color'
        ) || '#ff0000';


    const bgColor =
        localStorage.getItem(
            'app_bg_color'
        ) || '#3f51b5';


    const textColor =
        localStorage.getItem(
            'app_text_color'
        ) || '#ffffff';


    const language =
        localStorage.getItem(
            'app_language'
        ) || 'bn';


    const isDarkMode =
        localStorage.getItem(
            'app_dark_mode'
        ) === 'true';


    const modalHTML = `

        <div id="settingsModal"
             style="
                position:fixed;
                top:0;
                left:0;
                width:100%;
                height:100%;
                background:rgba(0,0,0,0.5);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:99999;
                padding:20px;
             ">

            <div style="
                background:#fff;
                width:100%;
                max-width:420px;
                border-radius:20px;
                padding:24px;
                box-shadow:0 10px 25px rgba(0,0,0,0.2);
                position:relative;
                font-family:inherit;
                max-height:90vh;
                overflow-y:auto;
            ">


                <button id="settingsCloseBtn"
                        style="
                            position:absolute;
                            top:18px;
                            right:18px;
                            background:none;
                            border:none;
                            font-size:20px;
                            cursor:pointer;
                            color:#333;
                            z-index:2;
                        ">
                    ✕
                </button>


                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:20px;
                    padding-right:35px;
                ">

                    <h3 style="
                        margin:0;
                        font-size:20px;
                        font-weight:700;
                        color:#111;
                    ">
                        ⚙️ Setting
                    </h3>


                    <button id="darkModeToggleBtn"
                            type="button"
                            title="Dark/Light Mode"
                            style="
                                background:none;
                                border:1px solid #ddd;
                                border-radius:50%;
                                width:36px;
                                height:36px;
                                cursor:pointer;
                                font-size:18px;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                            ">
                        ${isDarkMode ? '🌞' : '🌙'}
                    </button>

                </div>


                <div style="
                    display:flex;
                    flex-direction:column;
                    gap:16px;
                ">


                    <!-- Theme Color -->

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        border-bottom:1px solid #eee;
                        padding-bottom:10px;
                    ">

                        <label style="
                            font-size:15px;
                            font-weight:600;
                            color:#333;
                        ">
                            Theme
                        </label>


                        <input type="color"
                               id="themeColorInput"
                               value="${themeColor}"
                               style="
                                    width:40px;
                                    height:40px;
                                    border:none;
                                    border-radius:50%;
                                    cursor:pointer;
                                    background:none;
                               ">

                    </div>


                    <!-- Background Color -->

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        border-bottom:1px solid #eee;
                        padding-bottom:10px;
                    ">

                        <label style="
                            font-size:15px;
                            font-weight:600;
                            color:#333;
                        ">
                            Background Color
                        </label>


                        <input type="color"
                               id="bgColorInput"
                               value="${bgColor}"
                               style="
                                    width:40px;
                                    height:40px;
                                    border:none;
                                    border-radius:50%;
                                    cursor:pointer;
                                    background:none;
                               ">

                    </div>


                    <!-- Text Color -->

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        border-bottom:1px solid #eee;
                        padding-bottom:10px;
                    ">

                        <label style="
                            font-size:15px;
                            font-weight:600;
                            color:#333;
                        ">
                            Text Color
                        </label>


                        <input type="color"
                               id="textColorInput"
                               value="${textColor}"
                               style="
                                    width:40px;
                                    height:40px;
                                    border:none;
                                    border-radius:50%;
                                    cursor:pointer;
                                    background:none;
                               ">

                    </div>


                    <!-- LANGUAGE -->

                    <div style="
                        display:flex;
                        flex-direction:column;
                        gap:10px;
                        border-bottom:1px solid #eee;
                        padding-bottom:10px;
                    ">

                        <label style="
                            font-size:15px;
                            font-weight:600;
                            color:#333;
                            text-align:center;
                        ">
                            Apps Data View Mode
                        </label>


                        <div style="
                            display:flex;
                            justify-content:space-around;
                            align-items:center;
                        ">

                            <label style="
                                display:flex;
                                align-items:center;
                                gap:8px;
                                cursor:pointer;
                                font-size:14px;
                                font-weight:500;
                            ">

                                <input type="radio"
                                       name="appLang"
                                       value="en"
                                       ${language === 'en'
                                           ? 'checked'
                                           : ''}
                                       style="cursor:pointer;">

                                English 🇬🇧

                            </label>


                            <label style="
                                display:flex;
                                align-items:center;
                                gap:8px;
                                cursor:pointer;
                                font-size:14px;
                                font-weight:500;
                            ">

                                <input type="radio"
                                       name="appLang"
                                       value="bn"
                                       ${language === 'bn'
                                           ? 'checked'
                                           : ''}
                                       style="cursor:pointer;">

                                Bangla 🇧🇩

                            </label>

                        </div>

                    </div>


                </div>


                <!-- ACTION BUTTONS -->

                <div style="
                    margin-top:20px;
                    display:flex;
                    flex-direction:column;
                    gap:10px;
                ">

                    <button id="resetSettingsBtn"
                            style="
                                width:100%;
                                background:#2196F3;
                                color:#fff;
                                border:none;
                                padding:12px;
                                border-radius:10px;
                                font-size:15px;
                                font-weight:600;
                                cursor:pointer;
                            ">
                        Reset Settings
                    </button>


                    <button id="clearDataBtn"
                            style="
                                width:100%;
                                background:#2196F3;
                                color:#fff;
                                border:none;
                                padding:12px;
                                border-radius:10px;
                                font-size:15px;
                                font-weight:600;
                                cursor:pointer;
                            ">
                        Clear Apps Data
                    </button>

                </div>

            </div>

        </div>
    `;


    document.body.insertAdjacentHTML(
        'beforeend',
        modalHTML
    );


    const modal =
        document.getElementById(
            'settingsModal'
        );


    /* ============================================================
       BACKGROUND COLOR
    ============================================================ */

    const bgColorInput =
        document.getElementById(
            'bgColorInput'
        );


    bgColorInput.addEventListener(
        'input',
        e => {

            const selectedColor =
                e.target.value;


            localStorage.setItem(
                'app_bg_color',
                selectedColor
            );


            document.body.style.backgroundColor =
                selectedColor;


            const splashScreen =
                document.getElementById(
                    'splashScreen'
                );


            if (splashScreen) {

                splashScreen.style.backgroundColor =
                    selectedColor;

            }

        }
    );


    /* ============================================================
       TEXT COLOR
    ============================================================ */

    const textColorInput =
        document.getElementById(
            'textColorInput'
        );


    textColorInput.addEventListener(
        'input',
        e => {

            const selectedColor =
                e.target.value;


            localStorage.setItem(
                'app_text_color',
                selectedColor
            );


            /*
             * শুধুমাত্র global UI text।
             *
             * Category/Data/Profile-এর formatter color
             * overwrite করা হবে না।
             */

            applyGlobalTextColorSafely(
                selectedColor
            );


            /*
             * Formatter আবার চালানো।
             */

            setTimeout(
                refreshDynamicTextFormatter,
                0
            );

        }
    );


    /* ============================================================
       THEME COLOR
    ============================================================ */

    const themeColorInput =
        document.getElementById(
            'themeColorInput'
        );


    themeColorInput.addEventListener(
        'input',
        e => {

            const selectedColor =
                e.target.value;


            localStorage.setItem(
                'app_theme_color',
                selectedColor
            );


            const headerElements =
                document.querySelectorAll(
                    '.app-header, header'
                );


            headerElements.forEach(
                el => {

                    el.style.backgroundColor =
                        selectedColor;

                }
            );

        }
    );


    /* ============================================================
       DARK MODE
    ============================================================ */

    const darkModeToggleBtn =
        document.getElementById(
            'darkModeToggleBtn'
        );


    darkModeToggleBtn.addEventListener(
        'click',
        () => {

            const currentDarkState =
                localStorage.getItem(
                    'app_dark_mode'
                ) === 'true';


            const newDarkState =
                !currentDarkState;


            localStorage.setItem(
                'app_dark_mode',
                newDarkState
            );


            if (newDarkState) {

                document.body.classList.add(
                    'dark-mode'
                );


                darkModeToggleBtn.innerHTML =
                    '🌞';

            } else {

                document.body.classList.remove(
                    'dark-mode'
                );


                darkModeToggleBtn.innerHTML =
                    '🌙';

            }

        }
    );


    /* ============================================================
       CLOSE
    ============================================================ */

    document
        .getElementById(
            'settingsCloseBtn'
        )
        .addEventListener(
            'click',
            () => {

                modal.remove();

                window.location.reload();

            }
        );


    modal.addEventListener(
        'click',
        e => {

            if (e.target === modal) {

                modal.remove();

                window.location.reload();

            }

        }
    );


    /* ============================================================
       RESET SETTINGS
    ============================================================ */

    document
        .getElementById(
            'resetSettingsBtn'
        )
        .addEventListener(
            'click',
            () => {

                localStorage.removeItem(
                    'app_theme_color'
                );

                localStorage.removeItem(
                    'app_bg_color'
                );

                localStorage.removeItem(
                    'app_text_color'
                );

                localStorage.removeItem(
                    'app_bg_image'
                );

                localStorage.removeItem(
                    'app_language'
                );

                localStorage.removeItem(
                    'app_dark_mode'
                );


                alert(
                    "সেটিংস রিসেট করা হয়েছে!"
                );


                modal.remove();

                window.location.reload();

            }
        );


    /* ============================================================
       CLEAR DATA
    ============================================================ */

    document
        .getElementById(
            'clearDataBtn'
        )
        .addEventListener(
            'click',
            () => {

                modal.remove();


                showCustomDeleteModal(
                    () => {

                        localStorage.clear();

                        sessionStorage.clear();

                        window.location.reload();

                    }
                );

            }
        );


    /*
     * Background Image UI
     */

    if (
        typeof window.createBackgroundImageUI ===
        'function'
    ) {

        window.createBackgroundImageUI();

    }

}


/* ================================================================
   DRAWER ACTIONS
   ================================================================ */

function handleDrawerAction(
    action
) {

    switch (action) {


        case 'home':

            if (
                typeof showMainDashboardView ===
                'function'
            ) {

                history.pushState(
                    { page: "home" },
                    ""
                );


                showMainDashboardView();

            }

            break;


        case 'search':

            const allSearchBtn =
                document.getElementById(
                    'allSearchBtn'
                );


            if (allSearchBtn) {

                allSearchBtn.click();

            }

            break;


        case 'favorite':

            if (
                typeof renderFavoriteView ===
                'function'
            ) {

                renderFavoriteView(true);

            }

            break;


        case 'settings':

            initSettingsModal();

            break;


        case 'delete-db':

            showCustomDeleteModal(
                () => {

                    localStorage.clear();

                    sessionStorage.clear();

                    window.location.reload();

                }
            );

            break;


        case 'notice-box':

            console.log(
                'Notice Box clicked'
            );

            break;


        case 'share':

            if (
                navigator.share
            ) {

                navigator.share({

                    title:
                        'Police Phonebook',

                    url:
                        window.location.href

                }).catch(
                    console.error
                );

            } else {

                alert(
                    'Sharing not supported on this browser.'
                );

            }

            break;


        default:

            console.log(
                action + ' clicked'
            );

    }

}
