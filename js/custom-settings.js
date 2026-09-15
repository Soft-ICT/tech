// js/custom-settings.js

"use strict";


/* ============================================================
   CUSTOM SETTINGS
   ============================================================

   ✓ Theme Color
   ✓ Background Color
   ✓ Gallery Background Image
   ✓ Fixed Background Image
   ✓ Global Text Color
   ✓ Category
   ✓ Sub-category
   ✓ Toolbar
   ✓ Data Card
   ✓ Data Profile
   ✓ Notices
   ✓ Modal
   ✓ color-formatter protection
   ✓ Google Translate
   ✓ Dynamic Firebase content support

   ✗ Font Size
   ✗ Content Font Size

   ============================================================ */


/* ============================================================
   STORAGE KEYS
   ============================================================ */

const CS_THEME =
    "app_theme_color";

const CS_BG =
    "app_bg_color";

const CS_TEXT =
    "app_text_color";

const CS_BG_IMAGE =
    "app_bg_image";

const CS_LANGUAGE =
    "app_language";


/* ============================================================
   APPLY ALL SETTINGS
   ============================================================ */

function applyCustomSettings() {

    applyThemeColor();

    applyBackground();

    applyGlobalTextColor();

}


/* ============================================================
   REMOVE FONT SIZE OPTIONS FROM SETTINGS UI
   ============================================================ */

function removeFontSizeSettings() {

    const ids = [
        "fontSizeRange",
        "contentFontSizeRange"
    ];


    ids.forEach(function (id) {

        const input =
            document.getElementById(id);


        if (!input) {
            return;
        }


        /*
         * পুরো setting container remove
         */
        const parent =
            input.closest(
                ".setting-item, " +
                ".settings-item, " +
                ".setting-row, " +
                ".form-group, " +
                ".setting-option"
            );


        if (parent) {

            parent.remove();

        } else {

            input.remove();

        }

    });


    /*
     * Font Size-এর label / heading remove
     */
    document
        .querySelectorAll(
            "label, span, div, p, h3, h4"
        )
        .forEach(function (el) {

            const text =
                el.textContent
                    ? el.textContent.trim()
                    : "";


            if (
                text === "Font Size" ||
                text === "Content Font Size"
            ) {

                const parent =
                    el.closest(
                        ".setting-item, " +
                        ".settings-item, " +
                        ".setting-row, " +
                        ".form-group, " +
                        ".setting-option"
                    );


                if (parent) {

                    parent.remove();

                } else {

                    el.remove();

                }

            }

        });

}


/* ============================================================
   THEME COLOR
   ============================================================ */

function applyThemeColor() {

    const color =
        localStorage.getItem(
            CS_THEME
        );


    if (!color) {
        return;
    }


    /*
     * Main CSS variable
     */
    document.documentElement.style.setProperty(
        "--primary-color",
        color
    );


    /*
     * Topbar / Toolbar / Drawer Header
     */
    const toolbarElements =
        document.querySelectorAll(
            ".topbar, .drawer-header, .sub-toolbar"
        );


    toolbarElements.forEach(
        function (el) {

            el.style.setProperty(
                "background-color",
                color,
                "important"
            );

        }
    );


    /*
     * Data Header / Banner
     */
    const headers =
        document.querySelectorAll(
            ".header-box, .header-banner"
        );


    headers.forEach(
        function (el) {

            el.style.setProperty(
                "background-color",
                color,
                "important"
            );

        }
    );

}


/* ============================================================
   BACKGROUND
   ============================================================ */

function applyBackground() {

    const image =
        localStorage.getItem(
            CS_BG_IMAGE
        );


    const color =
        localStorage.getItem(
            CS_BG
        );


    /*
     * --------------------------------------------------------
     * IMAGE BACKGROUND
     * --------------------------------------------------------
     */

    if (image) {

        document.body.style.setProperty(
            "background-image",
            'url("' + image + '")',
            "important"
        );


        document.body.style.setProperty(
            "background-size",
            "cover",
            "important"
        );


        document.body.style.setProperty(
            "background-position",
            "center center",
            "important"
        );


        document.body.style.setProperty(
            "background-repeat",
            "no-repeat",
            "important"
        );


        /*
         * IMPORTANT:
         * Image fixed থাকবে
         */
        document.body.style.setProperty(
            "background-attachment",
            "fixed",
            "important"
        );


        /*
         * Background color থাকলেও image দেখা যাবে
         */
        if (color) {

            document.body.style.setProperty(
                "background-color",
                color,
                "important"
            );

        }


    /*
     * --------------------------------------------------------
     * COLOR BACKGROUND
     * --------------------------------------------------------
     */

    } else if (color) {

        document.body.style.setProperty(
            "background-color",
            color,
            "important"
        );


        document.body.style.removeProperty(
            "background-image"
        );


        document.body.style.setProperty(
            "background-attachment",
            "fixed",
            "important"
        );

    }


    /*
     * Dashboard transparent রাখা হচ্ছে
     * যাতে BODY background image দেখা যায়।
     */
    const dashboard =
        document.getElementById(
            "mainDashboardView"
        );


    if (dashboard) {

        dashboard.style.setProperty(
            "background",
            "transparent",
            "important"
        );

    }

}


/* ============================================================
   COLOR FORMATTER DETECTION
   ============================================================ */

function isColorFormatterElement(el) {

    if (!el) {
        return false;
    }


    /*
     * Explicit formatter markers
     */
    if (
        el.hasAttribute(
            "data-color-text"
        ) ||
        el.hasAttribute(
            "data-formatter-color"
        ) ||
        el.hasAttribute(
            "data-colored"
        )
    ) {

        return true;

    }


    /*
     * Formatter class detection
     */
    const className =
        typeof el.className === "string"
            ? el.className
            : "";


    if (
        className.includes(
            "formatter"
        ) ||
        className.includes(
            "formatted"
        ) ||
        className.includes(
            "gradient"
        ) ||
        className.includes(
            "rainbow"
        ) ||
        className.includes(
            "aurora"
        ) ||
        className.includes(
            "fire"
        ) ||
        className.includes(
            "ocean"
        ) ||
        className.includes(
            "glow"
        ) ||
        className.includes(
            "shadow"
        )
    ) {

        return true;

    }


    /*
     * Existing inline color protect
     *
     * color-formatter.js যদি inline color দেয়,
     * তাহলে সেটি override করা হবে না।
     */
    if (
        el.style &&
        el.style.getPropertyValue(
            "color"
        )
    ) {

        return true;

    }


    return false;

}


/* ============================================================
   GLOBAL TEXT COLOR
   ============================================================ */

function applyGlobalTextColor() {

    const color =
        localStorage.getItem(
            CS_TEXT
        );


    if (!color) {
        return;
    }


    /*
     * CSS variable
     */
    document.documentElement.style.setProperty(
        "--app-text-color",
        color
    );


    /*
     * Main containers
     */
    const selectors = [

        /* Body */
        "body",

        /* Toolbar */
        ".topbar",
        ".sub-toolbar",

        /* Drawer */
        ".drawer",
        ".drawer-header",
        ".drawer-section-title",
        ".menu-text",

        /* Dashboard */
        "#mainDashboardView",

        /* Category */
        ".category-card",

        /* Sub-category */
        ".subcategory-card",

        /* Header */
        ".header-box",
        ".header-banner",

        /* Data Card */
        ".data-card",
        ".data-card-name",
        ".data-card-detail",
        ".data-card-info",

        /* Data Profile */
        ".data-profile",
        ".details-info-box",
        ".info-label",
        ".info-value",

        /* Notices */
        ".home-notice",
        ".sliding-notice",

        /* Modal */
        ".modal",

        /* Common */
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "label",
        "li",
        "a"
    ];


    document
        .querySelectorAll(
            selectors.join(",")
        )
        .forEach(
            function (el) {

                if (
                    isColorFormatterElement(el)
                ) {

                    return;

                }


                const tag =
                    el.tagName
                        ? el.tagName.toLowerCase()
                        : "";


                /*
                 * Image / SVG / input-এর color
                 * পরিবর্তন করা হবে না।
                 */
                if (
                    tag === "img" ||
                    tag === "svg" ||
                    tag === "path" ||
                    tag === "input"
                ) {

                    return;

                }


                el.style.setProperty(
                    "color",
                    color,
                    "important"
                );

            }
        );


    /*
     * --------------------------------------------------------
     * DATA CARD
     * DATA PROFILE
     * CATEGORY
     * SUB-CATEGORY
     * TOOLBAR
     * DRAWER
     * MODAL
     * --------------------------------------------------------
     *
     * ভিতরের nested text-ও color হবে।
     */
    document
        .querySelectorAll(
            `
            .data-card *,
            .data-profile *,
            .details-info-box *,
            .data-card-info *,
            .category-card *,
            .subcategory-card *,
            .topbar *,
            .sub-toolbar *,
            .drawer *,
            .modal *
            `
        )
        .forEach(
            function (el) {

                /*
                 * Formatter-এর নিজস্ব color থাকলে বাদ।
                 */
                if (
                    isColorFormatterElement(el)
                ) {

                    return;

                }


                const tag =
                    el.tagName
                        ? el.tagName.toLowerCase()
                        : "";


                if (
                    tag === "img" ||
                    tag === "svg" ||
                    tag === "path" ||
                    tag === "input" ||
                    tag === "button"
                ) {

                    return;

                }


                el.style.setProperty(
                    "color",
                    color,
                    "important"
                );

            }
        );

}


/* ============================================================
   GALLERY UI
   ------------------------------------------------------------
   কোনো লেখা থাকবে না।
   শুধু Image icon.
   ============================================================ */

function createBackgroundImageUI() {

    /*
     * Already created
     */
    if (
        document.getElementById(
            "customBackgroundImageBox"
        )
    ) {

        return;

    }


    /*
     * Background color input
     */
    const bgColorInput =
        document.getElementById(
            "bgColorInput"
        );


    if (!bgColorInput) {

        return;

    }


    const parent =
        bgColorInput.parentElement;


    if (!parent) {

        return;

    }


    /*
     * Main box
     */
    const box =
        document.createElement(
            "div"
        );


    box.id =
        "customBackgroundImageBox";


    box.style.display =
        "flex";


    box.style.alignItems =
        "center";


    box.style.gap =
        "8px";


    box.style.marginTop =
        "8px";


    /*
     * --------------------------------------------------------
     * GALLERY BUTTON
     * --------------------------------------------------------
     */

    const chooseButton =
        document.createElement(
            "button"
        );


    chooseButton.type =
        "button";


    chooseButton.id =
        "chooseBgImageBtn";


    /*
     * শুধু icon
     */
    chooseButton.innerHTML =
        "🖼️";


    chooseButton.title =
        "Background Image";


    chooseButton.setAttribute(
        "aria-label",
        "Background Image"
    );


    chooseButton.style.width =
        "42px";


    chooseButton.style.height =
        "42px";


    chooseButton.style.padding =
        "0";


    chooseButton.style.fontSize =
        "20px";


    chooseButton.style.display =
        "flex";


    chooseButton.style.alignItems =
        "center";


    chooseButton.style.justifyContent =
        "center";


    /*
     * --------------------------------------------------------
     * HIDDEN FILE INPUT
     * --------------------------------------------------------
     */

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "file";


    input.id =
        "bgImageInput";


    input.accept =
        "image/*";


    input.style.display =
        "none";


    /*
     * --------------------------------------------------------
     * REMOVE BUTTON
     * --------------------------------------------------------
     */

    const removeButton =
        document.createElement(
            "button"
        );


    removeButton.type =
        "button";


    removeButton.id =
        "removeBgImageBtn";


    /*
     * শুধু icon
     */
    removeButton.innerHTML =
        "🗑️";


    removeButton.title =
        "Remove Background Image";


    removeButton.setAttribute(
        "aria-label",
        "Remove Background Image"
    );


    removeButton.style.width =
        "42px";


    removeButton.style.height =
        "42px";


    removeButton.style.padding =
        "0";


    removeButton.style.fontSize =
        "20px";


    removeButton.style.display =
        "flex";


    removeButton.style.alignItems =
        "center";


    removeButton.style.justifyContent =
        "center";


    /*
     * Add
     */
    box.appendChild(
        chooseButton
    );


    box.appendChild(
        input
    );


    box.appendChild(
        removeButton
    );


    parent.appendChild(
        box
    );

}


/* ============================================================
   OPEN PHONE GALLERY
   ============================================================ */

function openGallery() {

    const input =
        document.getElementById(
            "bgImageInput"
        );


    if (input) {

        input.click();

    }

}


/* ============================================================
   SAVE BACKGROUND IMAGE
   ============================================================ */

function saveBackgroundImage(file) {

    if (!file) {
        return;
    }


    if (
        !file.type ||
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "অনুগ্রহ করে একটি ছবি নির্বাচন করুন।"
        );

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            const image =
                new Image();


            image.onload =
                function () {

                    /*
                     * Large image resize
                     */
                    const maxSize =
                        1600;


                    let width =
                        image.width;


                    let height =
                        image.height;


                    if (
                        width > maxSize ||
                        height > maxSize
                    ) {

                        if (
                            width > height
                        ) {

                            height =
                                Math.round(
                                    height *
                                    maxSize /
                                    width
                                );

                            width =
                                maxSize;

                        } else {

                            width =
                                Math.round(
                                    width *
                                    maxSize /
                                    height
                                );

                            height =
                                maxSize;

                        }

                    }


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        width;


                    canvas.height =
                        height;


                    const ctx =
                        canvas.getContext(
                            "2d"
                        );


                    ctx.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );


                    /*
                     * JPEG compressed image
                     */
                    const data =
                        canvas.toDataURL(
                            "image/jpeg",
                            0.82
                        );


                    try {

                        localStorage.setItem(
                            CS_BG_IMAGE,
                            data
                        );


                        applyBackground();


                    } catch (error) {

                        console.warn(
                            "Background image save failed:",
                            error
                        );


                        alert(
                            "ছবিটি সংরক্ষণ করা যায়নি। ছোট ছবি নির্বাচন করুন।"
                        );

                    }

                };


            image.src =
                event.target.result;

        };


    reader.readAsDataURL(
        file
    );

}


/* ============================================================
   REMOVE BACKGROUND IMAGE
   ============================================================ */

function removeBackgroundImage() {

    localStorage.removeItem(
        CS_BG_IMAGE
    );


    const input =
        document.getElementById(
            "bgImageInput"
        );


    if (input) {

        input.value =
            "";

    }


    applyBackground();

}


/* ============================================================
   GOOGLE TRANSLATE
   ============================================================ */

let googleTranslateStarted =
    false;


let googleTranslateReady =
    false;


function loadGoogleTranslate() {

    if (
        googleTranslateStarted
    ) {

        return;

    }


    googleTranslateStarted =
        true;


    /*
     * Hidden Google Translate container
     */
    let box =
        document.getElementById(
            "google_translate_element"
        );


    if (!box) {

        box =
            document.createElement(
                "div"
            );


        box.id =
            "google_translate_element";


        box.style.position =
            "fixed";


        box.style.left =
            "-99999px";


        box.style.top =
            "0";


        box.style.width =
            "1px";


        box.style.height =
            "1px";


        box.style.overflow =
            "hidden";


        box.style.opacity =
            "0";


        box.style.pointerEvents =
            "none";


        document.body.appendChild(
            box
        );

    }


    /*
     * Google callback
     */
    window.googleTranslateElementInit =
        function () {

            try {

                if (
                    window.google &&
                    window.google.translate
                ) {

                    new google.translate.TranslateElement(
                        {
                            pageLanguage:
                                "bn",

                            includedLanguages:
                                "bn,en",

                            autoDisplay:
                                false
                        },

                        "google_translate_element"
                    );


                    googleTranslateReady =
                        true;


                    setTimeout(
                        applyGoogleLanguage,
                        500
                    );

                }

            } catch (error) {

                console.warn(
                    "Google Translate initialization failed:",
                    error
                );

            }

        };


    /*
     * Load Google script
     */
    const script =
        document.createElement(
            "script"
        );


    script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";


    script.async =
        true;


    document.head.appendChild(
        script
    );

}


/* ============================================================
   APPLY GOOGLE LANGUAGE
   ============================================================ */

function applyGoogleLanguage() {

    const language =
        localStorage.getItem(
            CS_LANGUAGE
        ) || "bn";


    const select =
        document.querySelector(
            ".goog-te-combo"
        );


    if (!select) {

        if (
            language === "en"
        ) {

            setTimeout(
                applyGoogleLanguage,
                500
            );

        }

        return;

    }


    const target =
        language === "en"
            ? "en"
            : "bn";


    if (
        select.value !== target
    ) {

        select.value =
            target;


        select.dispatchEvent(
            new Event(
                "change"
            )
        );

    }

}


/* ============================================================
   LANGUAGE
   ============================================================ */

function applyLanguage(language) {

    if (!language) {

        language =
            "bn";

    }


    localStorage.setItem(
        CS_LANGUAGE,
        language
    );


    if (
        language === "en"
    ) {

        loadGoogleTranslate();


        setTimeout(
            applyGoogleLanguage,
            1000
        );

    } else {

        /*
         * বাংলা
         */
        if (
            googleTranslateReady
        ) {

            setTimeout(
                applyGoogleLanguage,
                300
            );

        } else if (
            typeof refreshCurrentView ===
            "function"
        ) {

            refreshCurrentView();

        }

    }

}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

export function setupCustomSettingsListener() {


    /*
     * --------------------------------------------------------
     * CHANGE EVENT
     * --------------------------------------------------------
     */

    document.addEventListener(
        "change",
        function (e) {

            if (!e.target) {
                return;
            }


            /*
             * Theme Color
             */
            if (
                e.target.id ===
                "themeColorInput"
            ) {

                localStorage.setItem(
                    CS_THEME,
                    e.target.value
                );


                applyThemeColor();

            }


            /*
             * Background Color
             */
            if (
                e.target.id ===
                "bgColorInput"
            ) {

                localStorage.setItem(
                    CS_BG,
                    e.target.value
                );


                applyBackground();

            }


            /*
             * Text Color
             */
            if (
                e.target.id ===
                "textColorInput"
            ) {

                localStorage.setItem(
                    CS_TEXT,
                    e.target.value
                );


                applyGlobalTextColor();

            }


            /*
             * Gallery Image
             */
            if (
                e.target.id ===
                "bgImageInput"
            ) {

                const file =
                    e.target.files &&
                    e.target.files[0];


                saveBackgroundImage(
                    file
                );

            }


            /*
             * Language
             */
            if (
                e.target.name ===
                "appLang" ||
                e.target.id ===
                "languageSelect"
            ) {

                applyLanguage(
                    e.target.value
                );

            }

        }
    );


    /*
     * --------------------------------------------------------
     * GALLERY BUTTON
     * --------------------------------------------------------
     */

    document.addEventListener(
        "click",
        function (e) {

            if (
                e.target &&
                e.target.id ===
                "chooseBgImageBtn"
            ) {

                openGallery();

            }


            if (
                e.target &&
                e.target.id ===
                "removeBgImageBtn"
            ) {

                removeBackgroundImage();

            }

        }
    );

}


/* ============================================================
   DYNAMIC CONTENT OBSERVER
   ============================================================ */

function setupDynamicSettingsObserver() {

    if (
        !window.MutationObserver
    ) {

        return;

    }


    let timer =
        null;


    const observer =
        new MutationObserver(
            function () {

                clearTimeout(
                    timer
                );


                timer =
                    setTimeout(
                        function () {

                            /*
                             * New Firebase content
                             */
                            applyThemeColor();

                            applyBackground();

                            applyGlobalTextColor();

                            /*
                             * Font settings নেই
                             */

                        },
                        100
                    );

            }
        );


    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );

}


/* ============================================================
   INITIALIZE
   ============================================================ */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * প্রথমেই Font Size UI remove
         */
        removeFontSizeSettings();


        /*
         * Gallery UI
         */
        createBackgroundImageUI();


        /*
         * Apply settings
         */
        applyCustomSettings();


        /*
         * Event listeners
         */
        setupCustomSettingsListener();


        /*
         * Dynamic Firebase content
         */
        setupDynamicSettingsObserver();


        /*
         * Re-check after app UI render
         */
        setTimeout(
            function () {

                removeFontSizeSettings();

                createBackgroundImageUI();

                applyThemeColor();

                applyBackground();

                applyGlobalTextColor();

            },
            500
        );


        setTimeout(
            function () {

                removeFontSizeSettings();

                createBackgroundImageUI();

                applyThemeColor();

                applyBackground();

                applyGlobalTextColor();

            },
            1500
        );


        /*
         * Saved language
         */
        const language =
            localStorage.getItem(
                CS_LANGUAGE
            );


        if (
            language === "en"
        ) {

            setTimeout(
                function () {

                    applyLanguage(
                        "en"
                    );

                },
                1000
            );

        }

    }
);


/* ============================================================
   GLOBAL ACCESS
   ============================================================ */

window.applyCustomSettings =
    applyCustomSettings;


window.applyThemeColor =
    applyThemeColor;


window.applyBackground =
    applyBackground;


window.applyGlobalTextColor =
    applyGlobalTextColor;


window.removeBackgroundImage =
    removeBackgroundImage;
