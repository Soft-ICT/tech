/* ============================================================
   Firebase Text Color & Design Formatter
   File: Js/color-formatter.js
   Version: Advanced + Animated Gradient

   Supports:
   - Firebase text formatting codes
   - Multiple codes on same text
   - Data Card
   - Data Profile
   - Category
   - Sub Category
   - Header
   - Home Notice
   - Scrolling Notice
   - Dynamic Firebase content
   - Toolbar code cleanup
   - Animated Gradients
   - No formatting code is visible
============================================================ */

(function () {
    "use strict";

    /* ============================================================
       FORMAT CODES
    ============================================================ */

    const FORMAT_CODES = {

        /* ---------- BASIC COLORS ---------- */

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


        /* ---------- TEXT STYLE ---------- */

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


        /* ---------- HIGHLIGHT ---------- */

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


        /* ---------- STATIC GRADIENT ---------- */

        "#grad_ocean": {
            backgroundImage: "linear-gradient(90deg,#00c6ff,#0072ff)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_fire": {
            backgroundImage: "linear-gradient(90deg,#ff512f,#f09819)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_purple": {
            backgroundImage: "linear-gradient(90deg,#8e2de2,#4a00e0)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_green": {
            backgroundImage: "linear-gradient(90deg,#00b09b,#96c93d)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_sunset": {
            backgroundImage: "linear-gradient(90deg,#ff512f,#dd2476)",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent"
        },

        "#grad_blue": {
            backgroundImage: "linear-gradient(90deg,#36d1dc,#5b86e5)",
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
            animation: "firebaseGradientAnimation 6s ease infinite"
        },

        "#grad_aurora": {
            backgroundImage:
                "linear-gradient(270deg,#00f2fe,#4facfe,#a18cd1,#fbc2eb,#00f2fe)",
            backgroundSize: "500% 500%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation: "firebaseAuroraAnimation 8s ease infinite"
        },

        "#grad_fire_animated": {
            backgroundImage:
                "linear-gradient(270deg,#ff0000,#ff512f,#ff8a00,#ffd000,#ff0000)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation: "firebaseFireAnimation 4s ease infinite"
        },

        "#grad_ocean_animated": {
            backgroundImage:
                "linear-gradient(270deg,#00c6ff,#0072ff,#00f2fe,#4facfe,#00c6ff)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation: "firebaseOceanAnimation 7s ease infinite"
        },

        "#grad_purple_animated": {
            backgroundImage:
                "linear-gradient(270deg,#7f00ff,#e100ff,#8e2de2,#4a00e0,#7f00ff)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation: "firebasePurpleAnimation 6s ease infinite"
        },

        "#grad_sunset_animated": {
            backgroundImage:
                "linear-gradient(270deg,#ff512f,#f09819,#ff0066,#ff8a00,#ff512f)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation: "firebaseSunsetAnimation 6s ease infinite"
        },

        "#grad_green_animated": {
            backgroundImage:
                "linear-gradient(270deg,#00b09b,#96c93d,#00f260,#0575e6,#00b09b)",
            backgroundSize: "400% 400%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation: "firebaseGreenAnimation 7s ease infinite"
        },

        "#grad_rainbow": {
            backgroundImage:
                "linear-gradient(270deg,#ff0000,#ff8a00,#ffe600,#00c853,#00b0ff,#7c4dff,#ff00c8,#ff0000)",
            backgroundSize: "600% 600%",
            backgroundClip: "text",
            webkitBackgroundClip: "text",
            color: "transparent",
            webkitTextFillColor: "transparent",
            animation: "firebaseRainbowAnimation 8s linear infinite"
        },


        /* ---------- SHADOW ---------- */

        "#shadow": {
            textShadow: "2px 2px 5px rgba(0,0,0,0.35)"
        },

        "#shadow_dark": {
            textShadow: "2px 3px 6px rgba(0,0,0,0.75)"
        },


        /* ---------- GLOW ---------- */

        "#glow_blue": {
            textShadow:
                "0 0 5px #00aaff, 0 0 10px #00aaff, 0 0 20px #0088ff"
        },

        "#glow_red": {
            textShadow:
                "0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 20px #ff0000"
        },

        "#glow_green": {
            textShadow:
                "0 0 5px #00ff55, 0 0 10px #00ff55, 0 0 20px #00cc44"
        },

        "#glow_purple": {
            textShadow:
                "0 0 5px #b000ff, 0 0 10px #b000ff, 0 0 20px #8000ff"
        },

        "#glow_cyan": {
            textShadow:
                "0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00bfff"
        }
    };


    /* ============================================================
       ADD ANIMATION CSS
    ============================================================ */

    function addAnimationStyles() {

        if (document.getElementById("firebaseFormatterAnimationCSS")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "firebaseFormatterAnimationCSS";

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

        `;

        document.head.appendChild(style);
    }


    /* ============================================================
       EXCLUDED ELEMENTS
       Toolbar / Navigation যেন পরিবর্তন না হয়
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
       GET FORMAT CODES
    ============================================================ */

    function getCodes(text) {

        if (!text) {
            return [];
        }

        const found = [];

        Object.keys(FORMAT_CODES).forEach(function (code) {

            if (text.indexOf(code) !== -1) {
                found.push(code);
            }

        });

        return found;
    }


    /* ============================================================
       REMOVE FORMAT CODES
    ============================================================ */

    function cleanText(text) {

        if (!text) {
            return "";
        }

        let result = text;

        Object.keys(FORMAT_CODES).forEach(function (code) {

            result = result.split(code).join("");

        });

        return result;
    }


    /* ============================================================
       APPLY STYLE
    ============================================================ */

    function applyStyles(element, codes) {

        if (!element || !codes || codes.length === 0) {
            return;
        }

        let hasGradient = false;
        let hasColor = false;

        codes.forEach(function (code) {

            const styles = FORMAT_CODES[code];

            if (!styles) {
                return;
            }

            Object.keys(styles).forEach(function (property) {

                let value = styles[property];

                const importantProperties = [
                    "color",
                    "backgroundImage",
                    "backgroundClip",
                    "webkitBackgroundClip",
                    "webkitTextFillColor",
                    "backgroundSize",
                    "animation",
                    "fontWeight",
                    "fontStyle",
                    "textDecoration",
                    "textDecorationColor",
                    "textDecorationThickness",
                    "backgroundColor",
                    "padding",
                    "borderRadius",
                    "textShadow"
                ];

                if (property === "color") {
                    hasColor = true;
                }

                if (
                    property === "backgroundImage" &&
                    String(value).indexOf("gradient") !== -1
                ) {
                    hasGradient = true;
                }

                if (property === "animation") {
                    element.style.setProperty(
                        property,
                        value,
                        "important"
                    );
                } else if (importantProperties.indexOf(property) !== -1) {
                    element.style.setProperty(
                        property,
                        value,
                        "important"
                    );
                } else {
                    element.style[property] = value;
                }

            });

        });


        /* --------------------------------------------------------
           Gradient should remain visible even when color is also
           present. Gradient has priority over normal color.
        -------------------------------------------------------- */

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


        element.setAttribute(
            "data-firebase-formatted",
            "true"
        );

    }


    /* ============================================================
       FORMAT A TEXT NODE
    ============================================================ */

    function formatTextNode(textNode) {

        if (!textNode || !textNode.nodeValue) {
            return;
        }

        const original = textNode.nodeValue;

        const codes = getCodes(original);

        if (codes.length === 0) {
            return;
        }

        const parent = textNode.parentElement;

        if (!parent || isExcluded(parent)) {
            return;
        }

        const cleaned = cleanText(original);

        if (cleaned === "") {
            textNode.nodeValue = "";
            return;
        }

        /*
         * সাধারণ Firebase field-এ suffix code ব্যবহার করা হয়।
         * যেমন:
         * কমান্ড্যান্ট#red#bold
         *
         * তাই পুরো text node-এর কোড সরিয়ে
         * একই parent-এ style apply করা হচ্ছে।
         */

        textNode.nodeValue = cleaned;

        applyStyles(parent, codes);

    }


    /* ============================================================
       FORMAT ELEMENT
    ============================================================ */

    function formatElement(element) {

        if (!element || element.nodeType !== 1) {
            return;
        }

        if (isExcluded(element)) {
            return;
        }

        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {

                    if (!node.nodeValue || !node.nodeValue.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (
                        node.parentElement &&
                        isExcluded(node.parentElement)
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (getCodes(node.nodeValue).length === 0) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];

        let node;

        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }

        textNodes.forEach(function (textNode) {
            formatTextNode(textNode);
        });

    }


    /* ============================================================
       CLEAN TOOLBAR / NAVIGATION CODES
       এখানে শুধু #code সরবে,
       toolbar-এর কোনো CSS পরিবর্তন হবে না।
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
        ).forEach(function (container) {

            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT
            );

            const nodes = [];

            let node;

            while ((node = walker.nextNode())) {
                nodes.push(node);
            }

            nodes.forEach(function (textNode) {

                const cleaned = cleanText(
                    textNode.nodeValue
                );

                if (cleaned !== textNode.nodeValue) {
                    textNode.nodeValue = cleaned;
                }

            });

        });

    }


    /* ============================================================
       APPLY TO ALL RELEVANT CONTENT
    ============================================================ */

    function applyFirebaseTextColors(root) {

        root = root || document.body;

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
            "[class*='notice']",
            "[class*='header']"
        ];

        let elements = [];

        if (
            root.matches &&
            selectors.some(function (selector) {
                try {
                    return root.matches(selector);
                } catch (e) {
                    return false;
                }
            })
        ) {
            elements.push(root);
        }

        try {

            elements = elements.concat(
                Array.from(
                    root.querySelectorAll(
                        selectors.join(",")
                    )
                )
            );

        } catch (e) {
            console.warn(
                "Firebase formatter selector error:",
                e
            );
        }


        /* Remove duplicate elements */

        elements = Array.from(
            new Set(elements)
        );


        elements.forEach(function (element) {

            if (!isExcluded(element)) {
                formatElement(element);
            }

        });


        /* Toolbar codes must always disappear */

        cleanToolbarCodes();

    }


    /* ============================================================
       MUTATION OBSERVER
       Firebase dynamic data / cards / profiles
       ============================================================ */

    let observerTimer = null;

    const observer = new MutationObserver(
        function (mutations) {

            let shouldRun = false;

            mutations.forEach(function (mutation) {

                if (
                    mutation.type === "childList" &&
                    (
                        mutation.addedNodes.length > 0 ||
                        mutation.removedNodes.length > 0
                    )
                ) {
                    shouldRun = true;
                }

                if (mutation.type === "characterData") {
                    shouldRun = true;
                }

            });


            if (!shouldRun) {
                return;
            }


            clearTimeout(observerTimer);

            observerTimer = setTimeout(
                function () {

                    applyFirebaseTextColors(
                        document.body
                    );

                },
                50
            );

        }
    );


    /* ============================================================
       INITIALIZE
    ============================================================ */

    function initializeFormatter() {

        addAnimationStyles();

        applyFirebaseTextColors(
            document.body
        );

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

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeFormatter
        );

    } else {

        initializeFormatter();

    }


    /* ============================================================
       PUBLIC FUNCTION
       চাইলে অন্য JS file থেকেও call করা যাবে
    ============================================================ */

    window.applyFirebaseTextColors =
        applyFirebaseTextColors;


    window.firebaseTextFormatter = {

        apply: applyFirebaseTextColors,

        clean: cleanText,

        codes: FORMAT_CODES

    };


})();
