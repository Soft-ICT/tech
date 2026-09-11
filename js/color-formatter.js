/* ============================================================
   Firebase Text Color & Design Formatter
   File: Js/color-formatter.js

   Features:
   ✔ Basic colors
   ✔ Bold / Italic / Underline
   ✔ Highlight
   ✔ Static Gradient
   ✔ Animated Gradient
   ✔ Aurora
   ✔ Fire
   ✔ Ocean
   ✔ Purple
   ✔ Sunset
   ✔ Green
   ✔ Rainbow
   ✔ Shadow
   ✔ Glow
   ✔ Multiple codes
   ✔ Data Card safe
   ✔ Data Profile safe
   ✔ Category / Sub-category safe
   ✔ Home Notice safe
   ✔ Scrolling Notice safe
   ✔ Firebase dynamic content
   ✔ Formatting codes never visible
   ✔ Toolbar design is not changed
============================================================ */

(function () {

    "use strict";


    /* ============================================================
       FORMAT CODES
    ============================================================ */

    const FORMAT_CODES = {

        /* ================= BASIC COLORS ================= */

        "#red": {
            color: "#ff0000"
        },

        "#blue": {
            color: "#0066ff"
        },

        "#green": {
            color: "#00a000"
        },

        "#yellow": {
            color: "#d4a800"
        },

        "#purple": {
            color: "#8000ff"
        },

        "#pink": {
            color: "#ff1493"
        },

        "#orange": {
            color: "#ff6600"
        },

        "#cyan": {
            color: "#00bcd4"
        },

        "#teal": {
            color: "#009688"
        },

        "#indigo": {
            color: "#3f51b5"
        },

        "#black": {
            color: "#000000"
        },

        "#white": {
            color: "#ffffff"
        },


        /* ================= TEXT STYLE ================= */

        "#bold": {
            fontWeight: "700"
        },

        "#italic": {
            fontStyle: "italic"
        },

        "#underline": {
            textDecoration: "underline"
        },

        "#underline_gold": {
            textDecoration: "underline",
            textDecorationColor: "#d4a017",
            textDecorationThickness: "2px"
        },

        "#underline_red": {
            textDecoration: "underline",
            textDecorationColor: "#ff0000",
            textDecorationThickness: "2px"
        },

        "#underline_blue": {
            textDecoration: "underline",
            textDecorationColor: "#0066ff",
            textDecorationThickness: "2px"
        },

        "#strike": {
            textDecoration: "line-through"
        },


        /* ================= HIGHLIGHT ================= */

        "#highlight": {
            backgroundColor: "#fff176",
            padding: "2px 5px",
            borderRadius: "4px"
        },

        "#highlight_blue": {
            backgroundColor: "#bbdefb",
            padding: "2px 5px",
            borderRadius: "4px"
        },

        "#highlight_green": {
            backgroundColor: "#c8e6c9",
            padding: "2px 5px",
            borderRadius: "4px"
        },

        "#highlight_red": {
            backgroundColor: "#ffcdd2",
            padding: "2px 5px",
            borderRadius: "4px"
        },

        "#highlight_purple": {
            backgroundColor: "#e1bee7",
            padding: "2px 5px",
            borderRadius: "4px"
        },

        "#highlight_pink": {
            backgroundColor: "#f8bbd0",
            padding: "2px 5px",
            borderRadius: "4px"
        },


        /* ================= STATIC GRADIENT ================= */

        "#grad_ocean": {
            backgroundImage:
                "linear-gradient(90deg,#00c6ff,#0072ff)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_fire": {
            backgroundImage:
                "linear-gradient(90deg,#ff512f,#f09819)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_purple": {
            backgroundImage:
                "linear-gradient(90deg,#8e2de2,#4a00e0)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_green": {
            backgroundImage:
                "linear-gradient(90deg,#00b09b,#96c93d)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_sunset": {
            backgroundImage:
                "linear-gradient(90deg,#ff512f,#dd2476)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_blue": {
            backgroundImage:
                "linear-gradient(90deg,#36d1dc,#5b86e5)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },


        /* ========================================================
           ANIMATED GRADIENT
        ======================================================== */

        "#grad_animated": {
            backgroundImage:
                "linear-gradient(270deg,#ff0080,#7928ca,#2afadf,#00c6ff,#ff0080)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation:
                "firebaseGradientAnimation 6s ease infinite"
        },


        "#grad_aurora": {
            backgroundImage:
                "linear-gradient(270deg,#00f2fe,#4facfe,#a18cd1,#fbc2eb,#00f2fe)",
            backgroundSize: "500% 500%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation:
                "firebaseAuroraAnimation 8s ease infinite"
        },


        "#grad_fire_animated": {
            backgroundImage:
                "linear-gradient(270deg,#ff0000,#ff512f,#ff8a00,#ffd000,#ff0000)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation:
                "firebaseFireAnimation 4s ease infinite"
        },


        "#grad_ocean_animated": {
            backgroundImage:
                "linear-gradient(270deg,#00c6ff,#0072ff,#00f2fe,#4facfe,#00c6ff)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation:
                "firebaseOceanAnimation 7s ease infinite"
        },


        "#grad_purple_animated": {
            backgroundImage:
                "linear-gradient(270deg,#7f00ff,#e100ff,#8e2de2,#4a00e0,#7f00ff)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation:
                "firebasePurpleAnimation 6s ease infinite"
        },


        "#grad_sunset_animated": {
            backgroundImage:
                "linear-gradient(270deg,#ff512f,#f09819,#ff0066,#ff8a00,#ff512f)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation:
                "firebaseSunsetAnimation 6s ease infinite"
        },


        "#grad_green_animated": {
            backgroundImage:
                "linear-gradient(270deg,#00b09b,#96c93d,#00f260,#0575e6,#00b09b)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation:
                "firebaseGreenAnimation 7s ease infinite"
        },


        "#grad_rainbow": {
            backgroundImage:
                "linear-gradient(270deg,#ff0000,#ff8a00,#ffe600,#00c853,#00b0ff,#7c4dff,#ff00c8,#ff0000)",
            backgroundSize: "600% 600%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation:
                "firebaseRainbowAnimation 8s linear infinite"
        },


        /* ================= SHADOW ================= */

        "#shadow": {
            textShadow:
                "2px 2px 5px rgba(0,0,0,0.35)"
        },

        "#shadow_dark": {
            textShadow:
                "2px 3px 6px rgba(0,0,0,0.75)"
        },


        /* ================= GLOW ================= */

        "#glow_blue": {
            textShadow:
                "0 0 5px #00aaff,0 0 10px #00aaff,0 0 20px #0088ff"
        },

        "#glow_red": {
            textShadow:
                "0 0 5px #ff0000,0 0 10px #ff0000,0 0 20px #ff0000"
        },

        "#glow_green": {
            textShadow:
                "0 0 5px #00ff55,0 0 10px #00ff55,0 0 20px #00cc44"
        },

        "#glow_purple": {
            textShadow:
                "0 0 5px #b000ff,0 0 10px #b000ff,0 0 20px #8000ff"
        },

        "#glow_cyan": {
            textShadow:
                "0 0 5px #00ffff,0 0 10px #00ffff,0 0 20px #00bfff"
        }

    };


    /* ============================================================
       ANIMATION CSS
    ============================================================ */

    function addAnimationStyles() {

        if (
            document.getElementById(
                "firebaseFormatterAnimationCSS"
            )
        ) {
            return;
        }

        const style = document.createElement("style");

        style.id =
            "firebaseFormatterAnimationCSS";

        style.textContent = `

            @keyframes firebaseGradientAnimation {

                0% {
                    background-position: 0% 50%;
                }

                50% {
                    background-position: 100% 50%;
                }

                100% {
                    background-position: 0% 50%;
                }

            }


            @keyframes firebaseAuroraAnimation {

                0% {
                    background-position: 0% 50%;
                }

                25% {
                    background-position: 50% 100%;
                }

                50% {
                    background-position: 100% 50%;
                }

                75% {
                    background-position: 50% 0%;
                }

                100% {
                    background-position: 0% 50%;
                }

            }


            @keyframes firebaseFireAnimation {

                0% {
                    background-position: 0% 50%;
                }

                50% {
                    background-position: 100% 50%;
                }

                100% {
                    background-position: 0% 50%;
                }

            }


            @keyframes firebaseOceanAnimation {

                0% {
                    background-position: 0% 50%;
                }

                50% {
                    background-position: 100% 50%;
                }

                100% {
                    background-position: 0% 50%;
                }

            }


            @keyframes firebasePurpleAnimation {

                0% {
                    background-position: 0% 50%;
                }

                50% {
                    background-position: 100% 50%;
                }

                100% {
                    background-position: 0% 50%;
                }

            }


            @keyframes firebaseSunsetAnimation {

                0% {
                    background-position: 0% 50%;
                }

                50% {
                    background-position: 100% 50%;
                }

                100% {
                    background-position: 0% 50%;
                }

            }


            @keyframes firebaseGreenAnimation {

                0% {
                    background-position: 0% 50%;
                }

                50% {
                    background-position: 100% 50%;
                }

                100% {
                    background-position: 0% 50%;
                }

            }


            @keyframes firebaseRainbowAnimation {

                0% {
                    background-position: 0% 50%;
                }

                50% {
                    background-position: 100% 50%;
                }

                100% {
                    background-position: 0% 50%;
                }

            }


            /*
             * Only the formatter-created text span
             * receives these styles.
             */

            .firebase-formatted-text {
                display: inline;
            }

        `;

        document.head.appendChild(style);
    }


    /* ============================================================
       EXCLUDED TOOLBAR / NAVIGATION
    ============================================================ */

    function isExcluded(element) {

        if (!element || element.nodeType !== 1) {
            return true;
        }

        return !!element.closest(`

            #navToggleBtn,
            #menuIcon,
            #backIcon,
            nav,
            header,
            .navbar,
            .topbar,
            .toolbar,
            .appbar,
            .header,
            .navigation,
            [role="navigation"]

        `);
    }


    /* ============================================================
       FIND CODES
    ============================================================ */

    function getCodes(text) {

        if (!text) {
            return [];
        }

        const found = [];

        Object.keys(FORMAT_CODES).forEach(
            function (code) {

                if (text.indexOf(code) !== -1) {
                    found.push(code);
                }

            }
        );

        return found;
    }


    /* ============================================================
       REMOVE CODES
    ============================================================ */

    function cleanText(text) {

        if (!text) {
            return "";
        }

        let result = text;

        Object.keys(FORMAT_CODES).forEach(
            function (code) {

                result =
                    result.split(code).join("");

            }
        );

        return result;
    }


    /* ============================================================
       APPLY STYLES ONLY TO THE NEW SPAN
    ============================================================ */

    function applyStyles(element, codes) {

        if (
            !element ||
            !codes ||
            codes.length === 0
        ) {
            return;
        }

        let hasGradient = false;

        codes.forEach(function (code) {

            const styles =
                FORMAT_CODES[code];

            if (!styles) {
                return;
            }

            Object.keys(styles).forEach(
                function (property) {

                    const value =
                        styles[property];

                    if (
                        property ===
                        "backgroundImage" &&
                        String(value)
                            .indexOf("gradient") !== -1
                    ) {
                        hasGradient = true;
                    }

                    element.style.setProperty(
                        property,
                        value,
                        "important"
                    );

                }
            );

        });


        /*
         * Gradient is allowed to make ONLY this span
         * transparent so the gradient can show through.
         */

        if (hasGradient) {

            element.style.setProperty(
                "color",
                "transparent",
                "important"
            );

            element.style.setProperty(
                "-webkit-text-fill-color",
                "transparent",
                "important"
            );

        }

        element.classList.add(
            "firebase-formatted-text"
        );

        element.setAttribute(
            "data-firebase-formatted",
            "true"
        );

    }


    /* ============================================================
       FORMAT ONE TEXT NODE
    ============================================================ */

    function formatTextNode(textNode) {

        if (
            !textNode ||
            !textNode.nodeValue
        ) {
            return;
        }

        const original =
            textNode.nodeValue;

        const codes =
            getCodes(original);

        if (codes.length === 0) {
            return;
        }

        const parent =
            textNode.parentElement;

        if (
            !parent ||
            isExcluded(parent)
        ) {
            return;
        }


        /*
         * Remove all codes from visible text.
         */

        const cleaned =
            cleanText(original);

        if (!cleaned) {
            textNode.nodeValue = "";
            return;
        }


        /*
         * IMPORTANT:
         *
         * We create a separate SPAN.
         *
         * Therefore:
         *
         * Name#red
         *
         * changes only Name.
         *
         * The whole Data Card does NOT become red,
         * white or transparent.
         */

        const span =
            document.createElement("span");

        span.textContent =
            cleaned;

        applyStyles(
            span,
            codes
        );


        /*
         * Replace only the original text node.
         */

        parent.replaceChild(
            span,
            textNode
        );

    }


    /* ============================================================
       FORMAT ELEMENT
    ============================================================ */

    function formatElement(element) {

        if (
            !element ||
            element.nodeType !== 1
        ) {
            return;
        }

        if (isExcluded(element)) {
            return;
        }


        /*
         * Do not process formatter-created spans again.
         */

        if (
            element.classList &&
            element.classList.contains(
                "firebase-formatted-text"
            )
        ) {
            return;
        }


        const walker =
            document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode:
                        function (node) {

                            if (
                                !node.nodeValue ||
                                !node.nodeValue.trim()
                            ) {
                                return NodeFilter.FILTER_REJECT;
                            }

                            if (
                                node.parentElement &&
                                node.parentElement
                                    .classList
                                    .contains(
                                        "firebase-formatted-text"
                                    )
                            ) {
                                return NodeFilter.FILTER_REJECT;
                            }

                            if (
                                node.parentElement &&
                                isExcluded(
                                    node.parentElement
                                )
                            ) {
                                return NodeFilter.FILTER_REJECT;
                            }

                            if (
                                getCodes(
                                    node.nodeValue
                                ).length === 0
                            ) {
                                return NodeFilter.FILTER_REJECT;
                            }

                            return NodeFilter.FILTER_ACCEPT;

                        }
                }
            );


        const textNodes = [];

        let node;

        while (
            (node = walker.nextNode())
        ) {
            textNodes.push(node);
        }


        textNodes.forEach(
            function (textNode) {

                formatTextNode(
                    textNode
                );

            }
        );

    }


    /* ============================================================
       TOOLBAR CODE CLEANUP
       ONLY removes #codes.
       DOES NOT CHANGE TOOLBAR CSS.
    ============================================================ */

    function cleanToolbarCodes() {

        const selectors = [

            "#navToggleBtn",
            "#menuIcon",
            "#backIcon",
            "nav",
            "header",
            ".navbar",
            ".topbar",
            ".toolbar",
            ".appbar",
            ".header",
            ".navigation",
            "[role='navigation']"

        ];


        document.querySelectorAll(
            selectors.join(",")
        ).forEach(
            function (container) {

                const walker =
                    document.createTreeWalker(
                        container,
                        NodeFilter.SHOW_TEXT
                    );

                const nodes = [];

                let node;

                while (
                    (node = walker.nextNode())
                ) {
                    nodes.push(node);
                }


                nodes.forEach(
                    function (textNode) {

                        const cleaned =
                            cleanText(
                                textNode.nodeValue
                            );

                        if (
                            cleaned !==
                            textNode.nodeValue
                        ) {

                            textNode.nodeValue =
                                cleaned;

                        }

                    }
                );

            }
        );

    }


    /* ============================================================
       RESET OLD VERSION'S PARENT STYLES
       This prevents the previous formatter from leaving
       Data Card text white.
    ============================================================ */

    function removeOldFormatterStyles() {

        document
            .querySelectorAll(
                "[data-firebase-formatted='true']"
            )
            .forEach(
                function (element) {

                    /*
                     * New formatter spans are preserved.
                     */

                    if (
                        element.classList.contains(
                            "firebase-formatted-text"
                        )
                    ) {
                        return;
                    }


                    const properties = [

                        "color",
                        "background-image",
                        "background-clip",
                        "-webkit-background-clip",
                        "-webkit-text-fill-color",
                        "background-size",
                        "animation",
                        "font-weight",
                        "font-style",
                        "text-decoration",
                        "text-decoration-color",
                        "text-decoration-thickness",
                        "background-color",
                        "padding",
                        "border-radius",
                        "text-shadow"

                    ];


                    properties.forEach(
                        function (property) {

                            element.style.removeProperty(
                                property
                            );

                        }
                    );


                    element.removeAttribute(
                        "data-firebase-formatted"
                    );

                }
            );

    }


    /* ============================================================
       APPLY TO ALL CONTENT
    ============================================================ */

    function applyFirebaseTextColors(
        root
    ) {

        root =
            root || document.body;

        if (!root) {
            return;
        }


        addAnimationStyles();


        const selectors = [

            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "div",
            "span",
            "p",
            "b",
            "strong",
            "td",
            "th",
            "a",
            "label",
            "li",
            "small",
            "em",

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


        let elements = [];


        if (
            root.matches &&
            selectors.some(
                function (selector) {

                    try {

                        return root.matches(
                            selector
                        );

                    } catch (e) {

                        return false;

                    }

                }
            )
        ) {

            elements.push(root);

        }


        try {

            elements =
                elements.concat(
                    Array.from(
                        root.querySelectorAll(
                            selectors.join(",")
                        )
                    )
                );

        } catch (e) {

            console.warn(
                "Firebase formatter error:",
                e
            );

        }


        /*
         * Remove duplicates.
         */

        elements =
            Array.from(
                new Set(elements)
            );


        elements.forEach(
            function (element) {

                if (
                    !isExcluded(element)
                ) {

                    formatElement(
                        element
                    );

                }

            }
        );


        cleanToolbarCodes();

    }


    /* ============================================================
       MUTATION OBSERVER
       Firebase data dynamically added হলে formatter আবার চলবে।
    ============================================================ */

    let observerTimer = null;

    const observer =
        new MutationObserver(
            function (mutations) {

                let shouldRun = false;


                mutations.forEach(
                    function (mutation) {

                        if (
                            mutation.type ===
                            "childList" &&
                            mutation.addedNodes.length > 0
                        ) {

                            shouldRun = true;

                        }


                        if (
                            mutation.type ===
                            "characterData"
                        ) {

                            shouldRun = true;

                        }

                    }
                );


                if (!shouldRun) {
                    return;
                }


                clearTimeout(
                    observerTimer
                );


                observerTimer =
                    setTimeout(
                        function () {

                            applyFirebaseTextColors(
                                document.body
                            );

                        },
                        80
                    );

            }
        );


    /* ============================================================
       INITIALIZE
    ============================================================ */

    function initializeFormatter() {

        addAnimationStyles();

        /*
         * Remove styles left by the previous version.
         */

        removeOldFormatterStyles();


        /*
         * Apply new formatter.
         */

        applyFirebaseTextColors(
            document.body
        );


        /*
         * Watch Firebase dynamic content.
         */

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true,
                characterData: true
            }
        );

    }


    /* ============================================================
       PAGE LOAD
    ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeFormatter
        );

    } else {

        initializeFormatter();

    }


    /* ============================================================
       PUBLIC API
    ============================================================ */

    window.applyFirebaseTextColors =
        applyFirebaseTextColors;


    window.firebaseTextFormatter = {

        apply:
            applyFirebaseTextColors,

        clean:
            cleanText,

        codes:
            FORMAT_CODES

    };


})();
