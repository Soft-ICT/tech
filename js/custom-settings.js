// js/custom-settings.js

"use strict";

/* ============================================================
   CUSTOM SETTINGS
   ------------------------------------------------------------
   1. Theme Color:
      - Toolbar / Header design unchanged
      - Only color changes

   2. Global Text Color:
      - All normal application text changes
      - Color Formatter text remains untouched

   3. Font Size:
      - UI font size changes UI text
      - Content font size changes Data Card + Data Profile
      - Card/Profile dimensions automatically match the font size

   4. Language:
      - Central translation system
      - Bengali <-> English UI labels
   ============================================================ */


/* ============================================================
   1. UPDATE GLOBAL STYLES
   ============================================================ */

function updateGlobalStyles() {

    const themeColor =
        localStorage.getItem("app_theme_color");

    const bgColor =
        localStorage.getItem("app_bg_color");

    const textColor =
        localStorage.getItem("app_text_color");

    const uiFontSize =
        localStorage.getItem("app_ui_font_size");

    const contentFontSize =
        localStorage.getItem("app_content_font_size");

    const appLanguage =
        localStorage.getItem("app_language");


    let styleTag =
        document.getElementById(
            "dynamic-custom-app-styles"
        );


    if (!styleTag) {

        styleTag =
            document.createElement("style");

        styleTag.id =
            "dynamic-custom-app-styles";

        document.head.appendChild(
            styleTag
        );
    }


    /* --------------------------------------------------------
       CONTENT FONT SIZE
       -------------------------------------------------------- */

    const contentSize =
        parseInt(contentFontSize, 10) || 16;


    /*
       Calculate proportional card spacing.

       Base:
       16px -> normal size

       If font increases:
       card padding, min-height and profile spacing
       increase automatically.
    */

    const sizeRatio =
        Math.max(
            0.85,
            Math.min(
                2.0,
                contentSize / 16
            )
        );


    const cardPadding =
        Math.round(
            12 * sizeRatio
        );


    const cardGap =
        Math.round(
            8 * sizeRatio
        );


    const profilePadding =
        Math.round(
            14 * sizeRatio
        );


    const profileGap =
        Math.round(
            10 * sizeRatio
        );


    const cardMinHeight =
        Math.round(
            78 * sizeRatio
        );


    const profileMinHeight =
        Math.round(
            100 * sizeRatio
        );


    /* ========================================================
       CSS
       ======================================================== */

    let cssRules = `

        /* ====================================================
           THEME COLOR
           ----------------------------------------------------
           IMPORTANT:
           No width / height / margin / padding / radius /
           display / position / shape is changed here.
           ==================================================== */

        ${themeColor ? `

            .topbar,
            .drawer-header,
            .sub-toolbar {

                background-color:
                    ${themeColor} !important;
            }


            .header-box,
            .header-banner {

                background-color:
                    ${themeColor} !important;
            }


            /*
             * Header design stays untouched.
             * Only the background color is changed.
             *
             * Existing border-radius,
             * width,
             * margin,
             * padding,
             * shape etc. are NOT overridden.
             */

        ` : ""}



        /* ====================================================
           BACKGROUND COLOR
           ==================================================== */

        ${bgColor ? `

            body {

                background-color:
                    ${bgColor} !important;
            }


            #mainDashboardView,
            #categoryDetailsView,
            #dataDetailsView,
            .all-search-container {

                background-color:
                    transparent !important;
            }

        ` : ""}



        /* ====================================================
           GLOBAL NORMAL TEXT COLOR
           ----------------------------------------------------
           Formatter-generated text is intentionally excluded.
           ==================================================== */

        ${textColor ? `

            body {

                color:
                    ${textColor};
            }


            /*
             * Common application text
             */

            h1,
            h2,
            h3,
            h4,
            h5,
            h6,

            p,
            span,
            label,
            div,
            button,
            a,
            li,

            input,
            textarea,
            select,

            .menu-text,
            .drawer-section-title,

            .category-card h3,
            .subcategory-card h3,

            .data-card-name,
            .data-card-detail,

            .details-info-box,
            .info-label,
            .info-value,

            .data-profile,
            .profile-name,
            .profile-info,
            .profile-label,
            .profile-value {

                color:
                    ${textColor};
            }


            /*
             * Toolbar / header text that normally follows
             * the global text setting.
             */

            #appTitle,
            .topbar span,
            .topbar h2 {

                color:
                    ${textColor};
            }


            /*
             * ------------------------------------------------
             * COLOR FORMATTER PROTECTION
             * ------------------------------------------------
             *
             * Elements carrying formatter attributes/classes
             * retain their own color.
             */

            [data-color-text],
            [data-format-color],
            [data-formatted],
            .color-formatted,
            .formatted-text,

            .formatter-text,
            .gradient-text,
            .animated-gradient,
            .aurora-text,
            .fire-text,
            .ocean-text,
            .purple-text,
            .sunset-text,
            .green-text,
            .rainbow-text,
            .shadow-text,
            .glow-text {

                color:
                    revert !important;
            }


            /*
             * Inline color generated by formatter
             */

            [style*="color:"],
            [style*="background-image:"],

            [class*="gradient"],
            [class*="rainbow"],
            [class*="aurora"],
            [class*="fire"],
            [class*="ocean"],
            [class*="sunset"],
            [class*="glow"] {

                /*
                 * Do not force global color here.
                 * Formatter CSS gets priority.
                 */

            }

        ` : ""}



        /* ====================================================
           UI FONT SIZE
           ==================================================== */

        ${uiFontSize ? `

            .menu-text,
            .drawer-section-title,

            .category-card h3,
            .subcategory-card h3 {

                font-size:
                    ${uiFontSize}px !important;

                line-height:
                    1.4 !important;
            }

        ` : ""}



        /* ====================================================
           CONTENT FONT SIZE
           ----------------------------------------------------
           DATA CARD
           ==================================================== */

        ${contentFontSize ? `

            /*
             * Main data-card text
             */

            .data-card-name {

                font-size:
                    ${contentSize}px !important;

                line-height:
                    1.4 !important;

                overflow-wrap:
                    anywhere;
            }


            .data-card-detail {

                font-size:
                    ${Math.max(
                        12,
                        Math.round(contentSize * 0.88)
                    )}px !important;

                line-height:
                    1.55 !important;

                overflow-wrap:
                    anywhere;
            }


            /*
             * Data Card itself grows with the font.
             */

            .data-card {

                min-height:
                    ${cardMinHeight}px !important;

                padding:
                    ${cardPadding}px !important;

                box-sizing:
                    border-box;

                height:
                    auto !important;

                overflow:
                    visible !important;
            }


            /*
             * Common possible inner containers.
             */

            .data-card-content,
            .data-card-info,
            .data-card-body {

                min-height:
                    auto !important;

                height:
                    auto !important;

                padding-bottom:
                    ${cardGap}px !important;

                box-sizing:
                    border-box;
            }



            /* =================================================
               DATA PROFILE
               ================================================= */

            .details-info-box {

                font-size:
                    ${contentSize}px !important;

                line-height:
                    1.55 !important;

                padding:
                    ${profilePadding}px !important;

                margin-bottom:
                    ${profileGap}px !important;

                min-height:
                    ${profileMinHeight}px !important;

                height:
                    auto !important;

                box-sizing:
                    border-box;

                overflow:
                    visible !important;

                overflow-wrap:
                    anywhere;
            }


            .info-label {

                font-size:
                    ${Math.max(
                        12,
                        Math.round(contentSize * 0.82)
                    )}px !important;

                line-height:
                    1.4 !important;

                overflow-wrap:
                    anywhere;
            }


            .info-value {

                font-size:
                    ${contentSize}px !important;

                line-height:
                    1.55 !important;

                overflow-wrap:
                    anywhere;

                white-space:
                    normal !important;
            }


            /*
             * Data Profile common containers
             */

            .data-profile,
            .profile-info,
            .profile-details,
            .profile-content {

                height:
                    auto !important;

                min-height:
                    ${profileMinHeight}px !important;

                box-sizing:
                    border-box;

                overflow:
                    visible !important;
            }


            .profile-name {

                font-size:
                    ${Math.round(
                        contentSize * 1.15
                    )}px !important;

                line-height:
                    1.4 !important;

                overflow-wrap:
                    anywhere;
            }


            .profile-label {

                font-size:
                    ${Math.max(
                        12,
                        Math.round(contentSize * 0.82)
                    )}px !important;

                line-height:
                    1.4 !important;
            }


            .profile-value {

                font-size:
                    ${contentSize}px !important;

                line-height:
                    1.55 !important;

                overflow-wrap:
                    anywhere;

                white-space:
                    normal !important;
            }



            /* =================================================
               GENERAL SAFETY
               -------------------------------------------------
               Prevent large text from being clipped.
               ================================================= */

            .data-card *,
            .data-profile *,
            .details-info-box *,
            .profile-info *,
            .profile-details * {

                max-width:
                    100%;

                box-sizing:
                    border-box;
            }


            .data-card-name,
            .data-card-detail,
            .info-label,
            .info-value,
            .profile-name,
            .profile-label,
            .profile-value {

                white-space:
                    normal !important;

                word-break:
                    normal;

                overflow-wrap:
                    anywhere;
            }

        ` : ""}

    `;


    styleTag.innerHTML =
        cssRules;


    /* ========================================================
       LANGUAGE
       ======================================================== */

    if (appLanguage) {

        applyLanguageTranslation(
            appLanguage
        );
    }
}



/* ============================================================
   2. LANGUAGE TRANSLATION SYSTEM
   ============================================================ */

const APP_TRANSLATIONS = {

    "মোবাইল:": "Mobile:",
    "টেলিফোন:": "Phone:",
    "পদবী:": "Designation:",
    "নাম:": "Name:",
    "বর্তমান কর্মস্থল:": "Current Office:",
    "স্থায়ী ঠিকানা:": "Permanent Address:",
    "ই-মেইল:": "Email:",
    "ইমেইল:": "Email:",

    "Mobile:": "মোবাইল:",
    "Phone:": "টেলিফোন:",
    "Designation:": "পদবী:",
    "Name:": "নাম:",
    "Current Office:": "বর্তমান কর্মস্থল:",
    "Permanent Address:": "স্থায়ী ঠিকানা:",
    "Email:": "ই-মেইল:"
};



/* ============================================================
   TEXT TRANSLATION
   ============================================================ */

function translateText(text, lang) {

    if (!text) {
        return text;
    }


    let result =
        String(text);


    /*
     * English
     */

    if (lang === "en") {

        Object.keys(APP_TRANSLATIONS)
            .forEach(key => {

                const value =
                    APP_TRANSLATIONS[key];

                /*
                 * Only Bengali source words
                 */

                if (
                    /[\u0980-\u09FF]/.test(key)
                ) {

                    result =
                        result.split(key)
                            .join(value);
                }
            });
    }


    /*
     * Bengali
     */

    else {

        Object.keys(APP_TRANSLATIONS)
            .forEach(key => {

                const value =
                    APP_TRANSLATIONS[key];

                if (
                    /^[A-Za-z\s:]+$/.test(key)
                ) {

                    result =
                        result.split(key)
                            .join(value);
                }
            });
    }


    return result;
}



/* ============================================================
   APPLY LANGUAGE
   ============================================================ */

function applyLanguageTranslation(lang) {

    /*
     * IMPORTANT:
     * Formatter elements are skipped.
     * Their original HTML / formatting code remains untouched.
     */

    const elements =
        document.querySelectorAll(
            "body *"
        );


    elements.forEach(el => {

        /*
         * Skip formatter elements
         */

        if (
            el.matches(
                "[data-color-text]," +
                "[data-format-color]," +
                "[data-formatted]," +
                ".color-formatted," +
                ".formatted-text," +
                ".formatter-text," +
                ".gradient-text," +
                ".animated-gradient," +
                ".aurora-text," +
                ".fire-text," +
                ".ocean-text," +
                ".purple-text," +
                ".sunset-text," +
                ".green-text," +
                ".rainbow-text," +
                ".shadow-text," +
                ".glow-text"
            )
        ) {

            return;
        }


        /*
         * Only process elements whose direct text belongs
         * to this element.
         */

        Array.from(
            el.childNodes
        ).forEach(node => {

            if (
                node.nodeType !==
                Node.TEXT_NODE
            ) {

                return;
            }


            const oldText =
                node.nodeValue;


            const newText =
                translateText(
                    oldText,
                    lang
                );


            if (
                oldText !== newText
            ) {

                node.nodeValue =
                    newText;
            }

        });

    });


    /*
     * Data card details
     */

    document
        .querySelectorAll(
            ".data-card-detail"
        )
        .forEach(el => {

            if (
                el.closest(
                    "[data-color-text]"
                )
            ) {
                return;
            }

            /*
             * Direct text nodes are already handled above.
             * This block intentionally does not use innerHTML,
             * preventing formatter HTML from being destroyed.
             */

        });
}



/* ============================================================
   3. SETTINGS EVENT LISTENER
   ============================================================ */

export function setupCustomSettingsListener() {


    /* --------------------------------------------------------
       CHANGE EVENTS
       -------------------------------------------------------- */

    document.addEventListener(
        "change",
        (e) => {

            if (!e.target) {
                return;
            }


            /* Theme Color */

            if (
                e.target.id ===
                "themeColorInput"
            ) {

                localStorage.setItem(
                    "app_theme_color",
                    e.target.value
                );

                updateGlobalStyles();
            }


            /* Background Color */

            if (
                e.target.id ===
                "bgColorInput"
            ) {

                localStorage.setItem(
                    "app_bg_color",
                    e.target.value
                );

                updateGlobalStyles();
            }


            /* Text Color */

            if (
                e.target.id ===
                "textColorInput"
            ) {

                localStorage.setItem(
                    "app_text_color",
                    e.target.value
                );

                updateGlobalStyles();
            }


            /* Language */

            if (
                e.target.name ===
                    "appLang" ||

                e.target.id ===
                    "languageSelect"
            ) {

                localStorage.setItem(
                    "app_language",
                    e.target.value
                );

                updateGlobalStyles();


                /*
                 * Refresh current application view
                 * if available.
                 */

                if (
                    typeof refreshCurrentView ===
                    "function"
                ) {

                    refreshCurrentView();
                }
            }

        }
    );



    /* --------------------------------------------------------
       INPUT EVENTS
       -------------------------------------------------------- */

    document.addEventListener(
        "input",
        (e) => {

            if (!e.target.id) {
                return;
            }


            /* UI Font Size */

            if (
                e.target.id ===
                "fontSizeRange"
            ) {

                localStorage.setItem(
                    "app_ui_font_size",
                    e.target.value
                );

                updateGlobalStyles();
            }


            /* Content Font Size */

            if (
                e.target.id ===
                "contentFontSizeRange"
            ) {

                localStorage.setItem(
                    "app_content_font_size",
                    e.target.value
                );

                updateGlobalStyles();
            }

        }
    );
}



/* ============================================================
   4. DOM OBSERVER
   ============================================================ */

let customSettingsObserver = null;

let customSettingsUpdating = false;


function observeDOMChanges() {

    if (
        customSettingsObserver
    ) {

        return;
    }


    customSettingsObserver =
        new MutationObserver(
            () => {

                /*
                 * Prevent recursive observer loop.
                 */

                if (
                    customSettingsUpdating
                ) {

                    return;
                }


                customSettingsUpdating =
                    true;


                requestAnimationFrame(
                    () => {

                        updateGlobalStyles();

                        customSettingsUpdating =
                            false;
                    }
                );

            }
        );


    if (
        document.body
    ) {

        customSettingsObserver.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }
}



/* ============================================================
   5. INITIALIZE
   ============================================================ */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        updateGlobalStyles();

        setupCustomSettingsListener();

        observeDOMChanges();

    }
);
