// js/custom-settings.js

"use strict";


/* ============================================================
   GLOBAL STYLE UPDATE
   ============================================================ */

function updateGlobalStyles() {

    const themeColor =
        localStorage.getItem("app_theme_color");

    const bgColor =
        localStorage.getItem("app_bg_color");

    const textColor =
        localStorage.getItem("app_text_color");

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


    let cssRules = "";


    /* ========================================================
       1. THEME COLOR
       --------------------------------------------------------
       IMPORTANT:
       Only COLOR is changed.

       No width
       No height
       No padding
       No margin
       No border-radius
       No display
       No position
       No shape
       No layout
       ======================================================== */

    if (themeColor) {

        cssRules += `

            .topbar,
            .drawer-header,
            .sub-toolbar {

                background-color:
                    ${themeColor} !important;
            }


            /*
             * DATA HEADER
             *
             * Only background-color.
             * Existing design remains untouched.
             */

            .header-box,
            .header-banner {

                background-color:
                    ${themeColor} !important;
            }

        `;
    }


    /* ========================================================
       2. BACKGROUND COLOR
       ======================================================== */

    if (bgColor) {

        cssRules += `

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

        `;
    }


    /* ========================================================
       3. GLOBAL TEXT COLOR
       --------------------------------------------------------
       Color Formatter is protected.

       We do NOT use:
           body * { color: ... }

       because that would destroy formatter colors.
       ======================================================== */

    if (textColor) {

        cssRules += `

            /*
             * Normal application text
             */

            body {

                color:
                    ${textColor};
            }


            /*
             * Common UI text
             */

            .menu-text,
            .drawer-section-title,

            #appTitle,

            .topbar span,
            .topbar h2,

            .category-card h3,
            .subcategory-card h3,

            .data-card-name,
            .data-card-detail,

            .details-info-box,
            .info-label,
            .info-value,

            .profile-name,
            .profile-label,
            .profile-value {

                color:
                    ${textColor} !important;
            }


            /*
             * DATA HEADER
             *
             * Header design is untouched.
             *
             * Only its text color is changed.
             *
             * IMPORTANT:
             * Formatter elements are excluded below.
             */

            .header-box h2,
            .header-box h3,
            .header-banner span,
            .header-banner h2 {

                color:
                    ${textColor} !important;
            }


            /*
             * ==================================================
             * COLOR FORMATTER PROTECTION
             * ==================================================
             *
             * These elements are allowed to keep their own
             * Firebase formatter color.
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
             * If formatter puts color directly on an element,
             * don't override that inline color.
             */

            [style*="color:"] {

                color:
                    revert !important;
            }

        `;
    }


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
   TRANSLATION DICTIONARY
   ------------------------------------------------------------
   Add more UI words here whenever required.
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
    "ঠিকানা:": "Address:",
    "ফোন:": "Phone:",

    "Mobile:": "মোবাইল:",
    "Phone:": "টেলিফোন:",
    "Designation:": "পদবী:",
    "Name:": "নাম:",
    "Current Office:": "বর্তমান কর্মস্থল:",
    "Permanent Address:": "স্থায়ী ঠিকানা:",
    "Email:": "ই-মেইল:",
    "Address:": "ঠিকানা:"
};



/* ============================================================
   TRANSLATE ONE TEXT
   ============================================================ */

function translateText(text, lang) {

    if (!text) {
        return text;
    }


    let result =
        String(text);


    Object.keys(APP_TRANSLATIONS)
        .forEach(key => {

            const translation =
                APP_TRANSLATIONS[key];


            if (lang === "en") {

                /*
                 * Bengali -> English
                 */

                if (
                    /[\u0980-\u09FF]/.test(key)
                ) {

                    result =
                        result.split(key)
                            .join(translation);
                }

            } else {

                /*
                 * English -> Bengali
                 */

                if (
                    !/[\u0980-\u09FF]/.test(key)
                ) {

                    result =
                        result.split(key)
                            .join(translation);
                }
            }

        });


    return result;
}



/* ============================================================
   CHECK FORMATTER ELEMENT
   ============================================================ */

function isFormatterElement(el) {

    if (!el || !el.matches) {
        return false;
    }


    return el.matches(
        `
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
        .glow-text
        `
    );
}



/* ============================================================
   LANGUAGE TRANSLATION
   ------------------------------------------------------------
   VERY IMPORTANT:
   We change TEXT NODES only.

   We NEVER use:
       element.innerHTML = ...

   Therefore:
       - Data Header design stays intact
       - CSS stays intact
       - icons stay intact
       - images stay intact
       - formatter HTML stays intact
   ============================================================ */

function applyLanguageTranslation(lang) {

    if (!document.body) {
        return;
    }


    const walker =
        document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
        );


    const textNodes = [];


    let node;


    while (
        node =
            walker.nextNode()
    ) {

        textNodes.push(node);
    }


    textNodes.forEach(textNode => {

        const parent =
            textNode.parentElement;


        if (!parent) {
            return;
        }


        /*
         * Never touch Color Formatter elements.
         */

        if (
            isFormatterElement(parent)
        ) {

            return;
        }


        /*
         * Never translate script/style.
         */

        const tag =
            parent.tagName
                ? parent.tagName.toLowerCase()
                : "";


        if (
            tag === "script" ||
            tag === "style" ||
            tag === "noscript"
        ) {

            return;
        }


        const oldText =
            textNode.nodeValue;


        const newText =
            translateText(
                oldText,
                lang
            );


        if (
            oldText !== newText
        ) {

            textNode.nodeValue =
                newText;
        }

    });


    /*
     * After translation, re-apply global styles.
     * This does NOT modify the Data Header layout.
     */

    const styleTag =
        document.getElementById(
            "dynamic-custom-app-styles"
        );


    if (
        styleTag &&
        !styleTag.isConnected
    ) {

        document.head.appendChild(
            styleTag
        );
    }
}



/* ============================================================
   SETTINGS EVENT LISTENER
   ============================================================ */

export function setupCustomSettingsListener() {


    /* ========================================================
       CHANGE
       ======================================================== */

    document.addEventListener(
        "change",
        function (e) {

            if (!e.target) {
                return;
            }


            /* -----------------------------------------------
               THEME COLOR
               ----------------------------------------------- */

            if (
                e.target.id ===
                "themeColorInput"
            ) {

                localStorage.setItem(
                    "app_theme_color",
                    e.target.value
                );

                updateGlobalStyles();

                return;
            }


            /* -----------------------------------------------
               BACKGROUND COLOR
               ----------------------------------------------- */

            if (
                e.target.id ===
                "bgColorInput"
            ) {

                localStorage.setItem(
                    "app_bg_color",
                    e.target.value
                );

                updateGlobalStyles();

                return;
            }


            /* -----------------------------------------------
               TEXT COLOR
               ----------------------------------------------- */

            if (
                e.target.id ===
                "textColorInput"
            ) {

                localStorage.setItem(
                    "app_text_color",
                    e.target.value
                );

                updateGlobalStyles();

                return;
            }


            /* -----------------------------------------------
               LANGUAGE
               ----------------------------------------------- */

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


                applyLanguageTranslation(
                    e.target.value
                );


                updateGlobalStyles();


                /*
                 * Refresh current view if available.
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
}



/* ============================================================
   INITIAL LOAD
   ============================================================ */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        updateGlobalStyles();

        setupCustomSettingsListener();

    }
);
