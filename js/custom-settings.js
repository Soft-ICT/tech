// js/custom-settings.js

"use strict";

/* ============================================================
   CUSTOM SETTINGS
   ------------------------------------------------------------
   - Theme Color
   - Background Color
   - Background Image
   - Global Text Color
   - Google Translate
   - NO FONT SIZE SETTINGS
   ============================================================ */


/* ============================================================
   STORAGE KEYS
   ============================================================ */

const SETTINGS_KEYS = {
    theme: "app_theme_color",
    background: "app_bg_color",
    text: "app_text_color",
    backgroundImage: "app_bg_image",
    language: "app_language"
};


/* ============================================================
   GOOGLE TRANSLATE STATE
   ============================================================ */

let googleTranslateReady = false;
let googleTranslateLoading = false;


/* ============================================================
   COLOR FORMATTER PROTECTION
   ------------------------------------------------------------
   color-formatter.js-এর নিজস্ব color যেন custom text color
   দিয়ে overwrite না হয়।
   ============================================================ */

function isFormatterColored(element) {

    if (!element) {
        return false;
    }

    /*
     * color-formatter.js যদি data-color-text ব্যবহার করে
     */
    if (
        element.hasAttribute("data-color-text") ||
        element.hasAttribute("data-formatter-color") ||
        element.hasAttribute("data-colored")
    ) {
        return true;
    }


    /*
     * Inline color থাকলে সেটিও formatter-এর color
     * হতে পারে।
     *
     * তবে সাধারণ inline color না থাকলে custom color
     * প্রয়োগ করা যাবে।
     */
    const inlineColor = element.style
        ? element.style.getPropertyValue("color")
        : "";

    if (inlineColor) {
        return true;
    }


    /*
     * Formatter-এর পরিচিত class শনাক্তকরণ
     */
    const className =
        typeof element.className === "string"
            ? element.className
            : "";

    if (
        className.includes("formatter") ||
        className.includes("color-text") ||
        className.includes("formatted-text") ||
        className.includes("rainbow-text") ||
        className.includes("gradient-text") ||
        className.includes("aurora-text") ||
        className.includes("fire-text") ||
        className.includes("ocean-text") ||
        className.includes("glow-text") ||
        className.includes("shadow-text")
    ) {
        return true;
    }


    return false;
}


/* ============================================================
   GLOBAL TEXT COLOR
   ============================================================ */

function applyGlobalTextColor() {

    const textColor =
        localStorage.getItem(SETTINGS_KEYS.text);

    if (!textColor) {
        return;
    }


    /*
     * CSS variable
     */
    document.documentElement.style
        .setProperty("--app-text-color", textColor);


    /*
     * Body
     */
    document.body.style.setProperty(
        "color",
        textColor
    );


    /*
     * পুরো UI-এর গুরুত্বপূর্ণ text elements
     *
     * নতুন element যোগ হলেও selector-এর মাধ্যমে
     * color apply হবে।
     */
    const selectors = [

        /* Toolbar */
        ".topbar",
        ".topbar *",
        ".sub-toolbar",
        ".sub-toolbar *",

        /* Drawer */
        ".drawer",
        ".drawer *",
        ".drawer-header",
        ".drawer-header *",
        ".drawer-section-title",
        ".menu-text",

        /* Dashboard */
        "#mainDashboardView",
        "#mainDashboardView *",

        /* Category */
        ".category-card",
        ".category-card *",

        /* Sub Category */
        ".subcategory-card",
        ".subcategory-card *",

        /* Header */
        ".header-box",
        ".header-banner",

        /* Data Card */
        ".data-card",
        ".data-card *",

        /* Data Profile */
        ".details-info-box",
        ".details-info-box *",
        ".data-profile",
        ".data-profile *",

        /* General information */
        ".info-label",
        ".info-value",

        /* Notices */
        ".home-notice",
        ".home-notice *",
        ".sliding-notice",
        ".sliding-notice *",

        /* Modals */
        ".modal",
        ".modal *",

        /* Buttons / labels */
        "button",
        "label",

        /* Headings */
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",

        /* Paragraph */
        "p",

        /* Links */
        "a",

        /* List */
        "li"
    ];


    const elements =
        document.querySelectorAll(
            selectors.join(",")
        );


    elements.forEach(element => {

        /*
         * color-formatter.js-এর color কখনো override হবে না
         */
        if (isFormatterColored(element)) {
            return;
        }


        /*
         * Custom settings-এর color
         */
        element.style.setProperty(
            "color",
            textColor,
            "important"
        );

    });
}


/* ============================================================
   THEME COLOR
   ============================================================ */

function applyThemeColor() {

    const themeColor =
        localStorage.getItem(
            SETTINGS_KEYS.theme
        );

    if (!themeColor) {
        return;
    }


    document.documentElement.style
        .setProperty(
            "--primary-color",
            themeColor
        );


    /*
     * Existing UI design অপরিবর্তিত রেখে
     * শুধু color পরিবর্তন
     */
    const elements =
        document.querySelectorAll(
            ".topbar, .drawer-header, .sub-toolbar"
        );


    elements.forEach(element => {

        element.style.setProperty(
            "background-color",
            themeColor,
            "important"
        );

    });


    /*
     * Data Header / Banner
     */
    const dataHeaders =
        document.querySelectorAll(
            ".header-box, .header-banner"
        );


    dataHeaders.forEach(element => {

        element.style.setProperty(
            "background-color",
            themeColor,
            "important"
        );

    });
}


/* ============================================================
   BACKGROUND COLOR
   ============================================================ */

function applyBackgroundColor() {

    const bgColor =
        localStorage.getItem(
            SETTINGS_KEYS.background
        );


    /*
     * যদি background image থাকে,
     * image priority পাবে।
     */
    const backgroundImage =
        localStorage.getItem(
            SETTINGS_KEYS.backgroundImage
        );


    if (backgroundImage) {
        return;
    }


    if (!bgColor) {
        return;
    }


    document.documentElement.style
        .setProperty(
            "--app-background-color",
            bgColor
        );


    document.body.style.setProperty(
        "background-color",
        bgColor,
        "important"
    );


    const dashboard =
        document.getElementById(
            "mainDashboardView"
        );


    if (dashboard) {

        dashboard.style.setProperty(
            "background-color",
            bgColor,
            "important"
        );

    }
}


/* ============================================================
   BACKGROUND IMAGE
   ============================================================ */

function applyBackgroundImage() {

    const image =
        localStorage.getItem(
            SETTINGS_KEYS.backgroundImage
        );


    if (!image) {
        return;
    }


    document.documentElement.style
        .setProperty(
            "--app-background-image",
            `url("${image}")`
        );


    document.body.style.setProperty(
        "background-image",
        `url("${image}")`,
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


    /*
     * Background fixed রাখলে scrolling-এর সময়
     * ছবিটি সুন্দরভাবে থাকবে।
     */
    document.body.style.setProperty(
        "background-attachment",
        "fixed",
        "important"
    );


    const dashboard =
        document.getElementById(
            "mainDashboardView"
        );


    if (dashboard) {

        dashboard.style.setProperty(
            "background-image",
            `url("${image}")`,
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

        dashboard.style.setProperty(
            "background-attachment",
            "fixed",
            "important"
        );

    }
}


/* ============================================================
   CLEAR BACKGROUND IMAGE
   ============================================================ */

function clearBackgroundImage() {

    localStorage.removeItem(
        SETTINGS_KEYS.backgroundImage
    );


    document.body.style.removeProperty(
        "background-image"
    );

    document.body.style.removeProperty(
        "background-size"
    );

    document.body.style.removeProperty(
        "background-position"
    );

    document.body.style.removeProperty(
        "background-repeat"
    );

    document.body.style.removeProperty(
        "background-attachment"
    );


    const dashboard =
        document.getElementById(
            "mainDashboardView"
        );


    if (dashboard) {

        dashboard.style.removeProperty(
            "background-image"
        );

    }


    /*
     * এরপর background color পুনরায় apply
     */
    applyBackgroundColor();
}


/* ============================================================
   APPLY ALL SETTINGS
   ============================================================ */

function applyCustomSettings() {

    applyThemeColor();

    applyBackgroundColor();

    applyBackgroundImage();

    applyGlobalTextColor();

    /*
     * Language আলাদাভাবে handle করা হবে
     * যাতে Google Translate বারবার load না হয়।
     */
}


/* ============================================================
   GOOGLE TRANSLATE SCRIPT
   ============================================================ */

function loadGoogleTranslate() {

    if (googleTranslateReady) {
        return;
    }


    if (googleTranslateLoading) {
        return;
    }


    googleTranslateLoading = true;


    /*
     * Hidden Google Translate container
     */
    let container =
        document.getElementById(
            "google_translate_element"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "google_translate_element";

        /*
         * UI design পরিবর্তন না করার জন্য hidden
         */
        container.style.position = "fixed";
        container.style.left = "-99999px";
        container.style.top = "0";
        container.style.width = "1px";
        container.style.height = "1px";
        container.style.overflow = "hidden";
        container.style.opacity = "0";
        container.style.pointerEvents = "none";


        document.body.appendChild(
            container
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

                    googleTranslateLoading =
                        false;


                    /*
                     * একটু delay দিয়ে current language
                     * apply করা হবে।
                     */
                    setTimeout(
                        applySelectedGoogleLanguage,
                        500
                    );

                }

            } catch (error) {

                console.warn(
                    "Google Translate initialization failed:",
                    error
                );

                googleTranslateLoading =
                    false;
            }
        };


    /*
     * Script আগে থেকেই থাকলে আবার load নয়
     */
    if (
        document.querySelector(
            'script[data-google-translate="true"]'
        )
    ) {
        return;
    }


    const script =
        document.createElement("script");


    script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";


    script.async = true;

    script.setAttribute(
        "data-google-translate",
        "true"
    );


    document.head.appendChild(
        script
    );
}


/* ============================================================
   GOOGLE TRANSLATE LANGUAGE
   ============================================================ */

function applySelectedGoogleLanguage() {

    const lang =
        localStorage.getItem(
            SETTINGS_KEYS.language
        ) || "bn";


    /*
     * Google Translate cookie ব্যবহার করে language
     * নির্বাচন করা হবে।
     */
    if (lang === "en") {

        setGoogleTranslateLanguage(
            "en"
        );

    } else {

        setGoogleTranslateLanguage(
            "bn"
        );

    }
}


/* ============================================================
   SET GOOGLE TRANSLATE LANGUAGE
   ============================================================ */

function setGoogleTranslateLanguage(lang) {

    /*
     * Google Translate select খুঁজে বের করা
     */
    const select =
        document.querySelector(
            ".goog-te-combo"
        );


    if (!select) {

        /*
         * Translate এখনও ready না হলে
         * আবার চেষ্টা
         */
        setTimeout(
            function () {
                setGoogleTranslateLanguage(lang);
            },
            500
        );

        return;
    }


    /*
     * একই language হলে unnecessary change নয়
     */
    if (select.value === lang) {
        return;
    }


    select.value = lang;


    select.dispatchEvent(
        new Event("change")
    );
}


/* ============================================================
   LANGUAGE
   ============================================================ */

function applyLanguageTranslation(lang) {

    if (!lang) {
        lang = "bn";
    }


    /*
     * English চাইলে Google Translate load
     */
    if (lang === "en") {

        loadGoogleTranslate();

        /*
         * Script ইতিমধ্যে loaded থাকলে
         */
        if (googleTranslateReady) {

            setTimeout(
                function () {
                    setGoogleTranslateLanguage(
                        "en"
                    );
                },
                100
            );

        }

    } else {

        /*
         * বাংলা হলে original language restore
         */
        if (googleTranslateReady) {

            setGoogleTranslateLanguage(
                "bn"
            );

        } else {

            /*
             * বাংলা default language,
             * তাই Google Translate load করার দরকার নেই।
             */
            location.reload();

        }

    }
}


/* ============================================================
   BACKGROUND IMAGE FILE HANDLER
   ============================================================ */

function handleBackgroundImageFile(
    file
) {

    if (!file) {
        return;
    }


    /*
     * শুধু image গ্রহণ
     */
    if (!file.type.startsWith("image/")) {

        alert(
            "অনুগ্রহ করে একটি ছবি নির্বাচন করুন।"
        );

        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            const imageData =
                event.target.result;


            /*
             * Gallery image localStorage-এ রাখা
             */
            localStorage.setItem(
                SETTINGS_KEYS.backgroundImage,
                imageData
            );


            /*
             * Image থাকলে color background
             * থাকলেও image priority পাবে।
             */
            applyBackgroundImage();

        };


    reader.onerror =
        function () {

            console.warn(
                "Background image could not be loaded."
            );

        };


    reader.readAsDataURL(file);
}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

export function setupCustomSettingsListener() {


    /* --------------------------------------------------------
       CHANGE EVENT
       -------------------------------------------------------- */

    document.addEventListener(
        "change",
        function (e) {

            if (!e.target) {
                return;
            }


            /* Theme Color */
            if (
                e.target.id ===
                "themeColorInput"
            ) {

                localStorage.setItem(
                    SETTINGS_KEYS.theme,
                    e.target.value
                );

                applyThemeColor();
            }


            /* Background Color */
            if (
                e.target.id ===
                "bgColorInput"
            ) {

                localStorage.setItem(
                    SETTINGS_KEYS.background,
                    e.target.value
                );

                /*
                 * নতুন color নির্বাচন করলে
                 * পুরনো background image সরিয়ে দেওয়া
                 * হবে।
                 */
                clearBackgroundImage();

                applyBackgroundColor();
            }


            /* Text Color */
            if (
                e.target.id ===
                "textColorInput"
            ) {

                localStorage.setItem(
                    SETTINGS_KEYS.text,
                    e.target.value
                );

                applyGlobalTextColor();
            }


            /* Background Image */
            if (
                e.target.id ===
                "bgImageInput"
            ) {

                const file =
                    e.target.files &&
                    e.target.files[0];

                handleBackgroundImageFile(
                    file
                );
            }


            /* Remove Background Image */
            if (
                e.target.id ===
                "removeBgImageBtn"
            ) {

                clearBackgroundImage();
            }


            /* Language */
            if (
                e.target.name ===
                "appLang" ||
                e.target.id ===
                "languageSelect"
            ) {

                const langVal =
                    e.target.value;


                localStorage.setItem(
                    SETTINGS_KEYS.language,
                    langVal
                );


                applyLanguageTranslation(
                    langVal
                );


                /*
                 * Existing app view refresh
                 */
                if (
                    typeof refreshCurrentView ===
                    "function"
                ) {

                    setTimeout(
                        function () {

                            refreshCurrentView();

                        },
                        300
                    );

                }

            }

        }
    );


    /* --------------------------------------------------------
       FILE INPUT EVENT
       -------------------------------------------------------- */

    document.addEventListener(
        "input",
        function (e) {

            if (!e.target) {
                return;
            }


            /*
             * Gallery background
             */
            if (
                e.target.id ===
                "bgImageInput"
            ) {

                const file =
                    e.target.files &&
                    e.target.files[0];


                handleBackgroundImageFile(
                    file
                );
            }

        }
    );


    /* --------------------------------------------------------
       DYNAMIC CONTENT OBSERVER
       --------------------------------------------------------
       Firebase থেকে নতুন Category / Data / Profile /
       Notice render হলে custom text color আবার apply হবে।
       -------------------------------------------------------- */

    if (
        window.MutationObserver
    ) {

        const observer =
            new MutationObserver(
                function () {

                    /*
                     * নতুন DOM আসার পর formatter-কে
                     * আগে কাজ করার সুযোগ দেওয়া।
                     */
                    setTimeout(
                        function () {

                            applyGlobalTextColor();

                        },
                        0
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

}


/* ============================================================
   INITIAL LOAD
   ============================================================ */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * Settings
         */
        applyCustomSettings();


        /*
         * Event listener
         */
        setupCustomSettingsListener();


        /*
         * Saved language
         */
        const language =
            localStorage.getItem(
                SETTINGS_KEYS.language
            );


        if (language) {

            /*
             * একটু delay যাতে home.js / Firebase
             * প্রথমে render করতে পারে।
             */
            setTimeout(
                function () {

                    applyLanguageTranslation(
                        language
                    );

                },
                700
            );

        }

    }
);


/* ============================================================
   PUBLIC HELPERS
   ------------------------------------------------------------
   অন্য JS থেকেও ব্যবহার করা যাবে।
   ============================================================ */

window.applyCustomSettings =
    applyCustomSettings;

window.applyGlobalTextColor =
    applyGlobalTextColor;

window.applyThemeColor =
    applyThemeColor;

window.applyBackgroundColor =
    applyBackgroundColor;

window.applyBackgroundImage =
    applyBackgroundImage;

window.clearBackgroundImage =
    clearBackgroundImage;

window.applyLanguageTranslation =
    applyLanguageTranslation;
