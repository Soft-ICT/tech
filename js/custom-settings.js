// js/custom-settings.js

"use strict";

/* ============================================================
   CUSTOM SETTINGS - ALL IN ONE
   ============================================================
   ✓ Theme Color
   ✓ Background Color
   ✓ Gallery Background Image
   ✓ Global Text Color
   ✓ Category / Sub-category
   ✓ Toolbar
   ✓ Data Card
   ✓ Data Profile
   ✓ Notice / Modal
   ✓ color-formatter protection
   ✓ Google Translate
   ✓ Dynamic Firebase content support
   ✗ Font Size removed completely
   ============================================================ */


/* ============================================================
   STORAGE
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
   APPLY ALL
   ============================================================ */

function applyCustomSettings() {

    applyThemeColor();

    applyBackground();

    applyGlobalTextColor();

    applySavedLanguage();

}


/* ============================================================
   THEME COLOR
   ============================================================ */

function applyThemeColor() {

    const color =
        localStorage.getItem(CS_THEME);

    if (!color) return;


    document.documentElement.style.setProperty(
        "--primary-color",
        color
    );


    const elements =
        document.querySelectorAll(
            ".topbar, .drawer-header, .sub-toolbar"
        );


    elements.forEach(function (el) {

        el.style.setProperty(
            "background-color",
            color,
            "important"
        );

    });


    const headers =
        document.querySelectorAll(
            ".header-box, .header-banner"
        );


    headers.forEach(function (el) {

        el.style.setProperty(
            "background-color",
            color,
            "important"
        );

    });

}


/* ============================================================
   BACKGROUND
   ============================================================ */

function applyBackground() {

    const image =
        localStorage.getItem(CS_BG_IMAGE);

    const color =
        localStorage.getItem(CS_BG);


    /*
     * Gallery image has priority
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
            "center",
            "important"
        );

        document.body.style.setProperty(
            "background-repeat",
            "no-repeat",
            "important"
        );

        document.body.style.setProperty(
            "background-attachment",
            "fixed",
            "important"
        );

    } else if (color) {

        document.body.style.setProperty(
            "background-color",
            color,
            "important"
        );

        document.body.style.removeProperty(
            "background-image"
        );

    }


    /*
     * Dashboard
     */
    const dashboard =
        document.getElementById(
            "mainDashboardView"
        );


    if (!dashboard) return;


    if (image) {

        dashboard.style.setProperty(
            "background-image",
            'url("' + image + '")',
            "important"
        );

        dashboard.style.setProperty(
            "background-size",
            "cover",
            "important"
        );

        dashboard.style.setProperty(
            "background-position",
            "center",
            "important"
        );

        dashboard.style.setProperty(
            "background-repeat",
            "no-repeat",
            "important"
        );

    } else if (color) {

        dashboard.style.setProperty(
            "background-color",
            color,
            "important"
        );

        dashboard.style.removeProperty(
            "background-image"
        );

    }

}


/* ============================================================
   COLOR FORMATTER DETECTION
   ============================================================ */

function isColorFormatterElement(el) {

    if (!el) return false;


    /*
     * Recommended marker
     */
    if (
        el.hasAttribute("data-color-text") ||
        el.hasAttribute("data-formatter-color") ||
        el.hasAttribute("data-colored")
    ) {
        return true;
    }


    /*
     * Formatter classes
     */
    const cls =
        typeof el.className === "string"
            ? el.className
            : "";


    if (
        cls.includes("gradient") ||
        cls.includes("rainbow") ||
        cls.includes("aurora") ||
        cls.includes("fire") ||
        cls.includes("ocean") ||
        cls.includes("glow") ||
        cls.includes("shadow") ||
        cls.includes("formatter") ||
        cls.includes("formatted")
    ) {
        return true;
    }


    /*
     * Existing inline color
     *
     * color-formatter.js সাধারণত inline color
     * ব্যবহার করলে সেটি protect করা হবে।
     */
    if (
        el.style &&
        el.style.getPropertyValue("color")
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
        localStorage.getItem(CS_TEXT);

    if (!color) return;


    /*
     * CSS variable
     */
    document.documentElement.style.setProperty(
        "--app-text-color",
        color
    );


    /*
     * গুরুত্বপূর্ণ text/container
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
        ".category-card h1",
        ".category-card h2",
        ".category-card h3",
        ".category-card h4",
        ".category-card p",
        ".category-card span",

        /* Sub-category */
        ".subcategory-card",
        ".subcategory-card h1",
        ".subcategory-card h2",
        ".subcategory-card h3",
        ".subcategory-card h4",
        ".subcategory-card p",
        ".subcategory-card span",

        /* Header */
        ".header-box",
        ".header-banner",

        /* Data card */
        ".data-card",
        ".data-card-name",
        ".data-card-detail",
        ".data-card-info",

        /* Data profile */
        ".data-profile",
        ".details-info-box",
        ".info-label",
        ".info-value",

        /* Notices */
        ".home-notice",
        ".sliding-notice",

        /* Modal */
        ".modal",

        /* General */
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
        .forEach(function (el) {

            if (
                isColorFormatterElement(el)
            ) {
                return;
            }


            el.style.setProperty(
                "color",
                color,
                "important"
            );

        });


    /*
     * Data Card / Profile-এর ভিতরের
     * সমস্ত text element
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
        .forEach(function (el) {

            /*
             * Formatter-এর নিজের color থাকলে
             * touch করা হবে না।
             */
            if (
                isColorFormatterElement(el)
            ) {
                return;
            }


            /*
             * Icon/image-এ text color দেওয়ার দরকার নেই
             */
            const tag =
                el.tagName
                    ? el.tagName.toLowerCase()
                    : "";


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

        });

}


/* ============================================================
   GALLERY UI AUTO CREATE
   ============================================================ */

function createBackgroundImageUI() {

    /*
     * আগে থেকেই থাকলে আবার তৈরি করবে না
     */
    if (
        document.getElementById(
            "bgImageInput"
        )
    ) {
        return;
    }


    /*
     * Settings-এর ভিতরে Background Color খোঁজা
     */
    const bgColorInput =
        document.getElementById(
            "bgColorInput"
        );


    if (!bgColorInput) {
        return;
    }


    /*
     * Background color-এর parent
     */
    let parent =
        bgColorInput.parentElement;


    if (!parent) {
        return;
    }


    /*
     * Container
     */
    const box =
        document.createElement("div");


    box.id =
        "customBackgroundImageBox";


    box.style.marginTop =
        "10px";


    /*
     * Gallery button
     */
    const chooseButton =
        document.createElement("button");


    chooseButton.type =
        "button";


    chooseButton.id =
        "chooseBgImageBtn";


    chooseButton.textContent =
        "🖼️ Gallery থেকে ছবি নির্বাচন";


    chooseButton.style.width =
        "100%";


    chooseButton.style.marginTop =
        "8px";


    chooseButton.style.padding =
        "10px";


    /*
     * Hidden file input
     */
    const input =
        document.createElement("input");


    input.type =
        "file";


    input.id =
        "bgImageInput";


    input.accept =
        "image/*";


    input.style.display =
        "none";


    /*
     * Remove button
     */
    const removeButton =
        document.createElement("button");


    removeButton.type =
        "button";


    removeButton.id =
        "removeBgImageBtn";


    removeButton.textContent =
        "🗑️ Background ছবি সরান";


    removeButton.style.width =
        "100%";


    removeButton.style.marginTop =
        "6px";


    removeButton.style.padding =
        "10px";


    /*
     * Preview
     */
    const preview =
        document.createElement("div");


    preview.id =
        "bgImagePreview";


    preview.style.marginTop =
        "8px";


    preview.style.textAlign =
        "center";


    box.appendChild(
        chooseButton
    );

    box.appendChild(
        input
    );

    box.appendChild(
        removeButton
    );

    box.appendChild(
        preview
    );


    /*
     * Background color input-এর parent-এর শেষে
     */
    parent.appendChild(
        box
    );


    updateBackgroundPreview();

}


/* ============================================================
   BACKGROUND IMAGE PICKER
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
   SAVE GALLERY IMAGE
   ============================================================ */

function saveBackgroundImage(file) {

    if (!file) return;


    if (
        !file.type ||
        !file.type.startsWith("image/")
    ) {

        alert(
            "অনুগ্রহ করে একটি ছবি নির্বাচন করুন।"
        );

        return;
    }


    /*
     * বড় ছবি localStorage-এ রাখলে
     * browser quota সমস্যা হতে পারে।
     *
     * তাই image resize/compress করা হচ্ছে।
     */
    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            const img =
                new Image();


            img.onload =
                function () {

                    const maxSize =
                        1600;


                    let width =
                        img.width;

                    let height =
                        img.height;


                    /*
                     * বড় image resize
                     */
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
                        img,
                        0,
                        0,
                        width,
                        height
                    );


                    /*
                     * compressed image
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


                        /*
                         * Background color থাকলেও
                         * image priority পাবে।
                         */
                        applyBackground();

                        updateBackgroundPreview();


                    } catch (error) {

                        alert(
                            "ছবিটি সংরক্ষণ করা যায়নি। অন্য একটি ছোট ছবি চেষ্টা করুন।"
                        );

                        console.warn(
                            error
                        );

                    }

                };


            img.src =
                event.target.result;

        };


    reader.readAsDataURL(file);

}


/* ============================================================
   REMOVE BACKGROUND IMAGE
   ============================================================ */

function removeBackgroundImage() {

    localStorage.removeItem(
        CS_BG_IMAGE
    );


    /*
     * File input reset
     */
    const input =
        document.getElementById(
            "bgImageInput"
        );


    if (input) {
        input.value = "";
    }


    applyBackground();

    updateBackgroundPreview();

}


/* ============================================================
   BACKGROUND PREVIEW
   ============================================================ */

function updateBackgroundPreview() {

    const preview =
        document.getElementById(
            "bgImagePreview"
        );


    if (!preview) return;


    const image =
        localStorage.getItem(
            CS_BG_IMAGE
        );


    if (!image) {

        preview.innerHTML = "";

        return;
    }


    preview.innerHTML = "";


    const img =
        document.createElement("img");


    img.src =
        image;


    img.style.width =
        "100%";


    img.style.maxHeight =
        "120px";


    img.style.objectFit =
        "cover";


    img.style.borderRadius =
        "8px";


    preview.appendChild(
        img
    );

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
     * Hidden container
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
                            pageLanguage: "bn",
                            includedLanguages: "bn,en",
                            autoDisplay: false
                        },
                        "google_translate_element"
                    );


                    googleTranslateReady =
                        true;


                    setTimeout(
                        function () {

                            applyGoogleLanguage();

                        },
                        500
                    );

                }

            } catch (error) {

                console.warn(
                    "Google Translate error:",
                    error
                );

            }

        };


    /*
     * Script
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

    const lang =
        localStorage.getItem(
            CS_LANGUAGE
        ) || "bn";


    const select =
        document.querySelector(
            ".goog-te-combo"
        );


    if (!select) {

        if (lang === "en") {

            setTimeout(
                applyGoogleLanguage,
                500
            );

        }

        return;
    }


    const target =
        lang === "en"
            ? "en"
            : "bn";


    if (
        select.value !== target
    ) {

        select.value =
            target;


        select.dispatchEvent(
            new Event("change")
        );

    }

}


/* ============================================================
   LANGUAGE
   ============================================================ */

function applySavedLanguage() {

    const lang =
        localStorage.getItem(
            CS_LANGUAGE
        );


    if (!lang) return;


    /*
     * English
     */
    if (lang === "en") {

        loadGoogleTranslate();


        if (
            googleTranslateReady
        ) {

            setTimeout(
                applyGoogleLanguage,
                300
            );

        }

    }

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


    let timer = null;


    const observer =
        new MutationObserver(
            function () {

                clearTimeout(timer);


                timer =
                    setTimeout(
                        function () {

                            applyThemeColor();

                            applyBackground();

                            applyGlobalTextColor();

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
   EVENT LISTENERS
   ============================================================ */

export function setupCustomSettingsListener() {


    /*
     * CHANGE
     */
    document.addEventListener(
        "change",
        function (e) {

            if (!e.target) {
                return;
            }


            /* ----------------------------
               Theme
               ---------------------------- */
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


            /* ----------------------------
               Background Color
               ---------------------------- */
            if (
                e.target.id ===
                "bgColorInput"
            ) {

                localStorage.setItem(
                    CS_BG,
                    e.target.value
                );


                /*
                 * Color নির্বাচন করলে
                 * পুরনো image remove করা হবে না।
                 *
                 * Image থাকলে image priority পাবে।
                 */
                applyBackground();

            }


            /* ----------------------------
               Text Color
               ---------------------------- */
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


            /* ----------------------------
               Gallery Image
               ---------------------------- */
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


            /* ----------------------------
               Language
               ---------------------------- */
            if (
                e.target.name ===
                "appLang" ||
                e.target.id ===
                "languageSelect"
            ) {

                const lang =
                    e.target.value;


                localStorage.setItem(
                    CS_LANGUAGE,
                    lang
                );


                if (
                    lang === "en"
                ) {

                    loadGoogleTranslate();


                    setTimeout(
                        function () {

                            applyGoogleLanguage();

                        },
                        1000
                    );

                } else {

                    /*
                     * Google Translate থেকে
                     * বাংলা restore
                     */
                    if (
                        googleTranslateReady
                    ) {

                        setTimeout(
                            function () {

                                applyGoogleLanguage();

                            },
                            300
                        );

                    } else {

                        /*
                         * App-এর নিজের বাংলা
                         */
                        if (
                            typeof refreshCurrentView ===
                            "function"
                        ) {

                            refreshCurrentView();

                        }

                    }

                }

            }

        }
    );


    /*
     * Gallery button
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


    /*
     * Settings UI যদি পরে render হয়,
     * তখন Gallery UI তৈরি হবে।
     */
    const uiTimer =
        setInterval(
            function () {

                if (
                    document.getElementById(
                        "bgColorInput"
                    )
                ) {

                    createBackgroundImageUI();

                    clearInterval(
                        uiTimer
                    );

                }

            },
            300
        );

}


/* ============================================================
   INITIALIZE
   ============================================================ */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * প্রথমে settings
         */
        applyCustomSettings();


        /*
         * Listeners
         */
        setupCustomSettingsListener();


        /*
         * Gallery UI
         */
        createBackgroundImageUI();


        /*
         * Firebase / dynamic content
         */
        setupDynamicSettingsObserver();


        /*
         * কিছু delay-এর পর আবার apply
         */
        setTimeout(
            function () {

                applyThemeColor();

                applyBackground();

                applyGlobalTextColor();

                createBackgroundImageUI();

            },
            500
        );


        setTimeout(
            function () {

                applyThemeColor();

                applyBackground();

                applyGlobalTextColor();

            },
            1500
        );

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
