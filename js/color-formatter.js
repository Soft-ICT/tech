/* ============================================================
   Firebase Text Color & Design Formatter
   File: Js/color-formatter.js

   FINAL VERSION
   ✔ No color-code flash
   ✔ Toolbar protected
   ✔ Data Card safe
   ✔ Data Profile safe
   ✔ Category safe
   ✔ Sub-category safe
   ✔ Home Notice safe
   ✔ Scrolling Notice safe
   ✔ Firebase dynamic content
   ✔ Multiple formatting codes
   ✔ Animated gradients
   ✔ Formatting codes hidden
   ✔ Toolbar never formatted
   ✔ MutationObserver safe
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
            gradientClass: "firebase-gradient-ocean"
        },

        "#grad_fire": {
            gradientClass: "firebase-gradient-fire"
        },

        "#grad_purple": {
            gradientClass: "firebase-gradient-purple"
        },

        "#grad_green": {
            gradientClass: "firebase-gradient-green"
        },

        "#grad_sunset": {
            gradientClass: "firebase-gradient-sunset"
        },

        "#grad_blue": {
            gradientClass: "firebase-gradient-blue"
        },


        /* ================= ANIMATED GRADIENT ================= */

        "#grad_animated": {
            gradientClass: "firebase-gradient-animated"
        },

        "#grad_aurora": {
            gradientClass: "firebase-gradient-aurora"
        },

        "#grad_fire_animated": {
            gradientClass: "firebase-gradient-fire-animated"
        },

        "#grad_ocean_animated": {
            gradientClass: "firebase-gradient-ocean-animated"
        },

        "#grad_purple_animated": {
            gradientClass: "firebase-gradient-purple-animated"
        },

        "#grad_sunset_animated": {
            gradientClass: "firebase-gradient-sunset-animated"
        },

        "#grad_green_animated": {
            gradientClass: "firebase-gradient-green-animated"
        },

        "#grad_rainbow": {
            gradientClass: "firebase-gradient-rainbow"
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
       TOOLBAR SELECTORS
    ============================================================ */

    const TOOLBAR_SELECTORS = [

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


    const TOOLBAR_SELECTOR =
        TOOLBAR_SELECTORS.join(",");


    /* ============================================================
       EARLY TOOLBAR PROTECTION
       IMPORTANT FOR ZERO-VISIBLE-FLASH
    ============================================================ */

    function installEarlyToolbarProtection() {

        let style =
            document.getElementById(
                "firebaseFormatterEarlyProtection"
            );


        if (style) {
            return;
        }


        style =
            document.createElement("style");


        style.id =
            "firebaseFormatterEarlyProtection";


        style.textContent = `

/*
 * Toolbar is temporarily invisible while
 * Firebase formatter removes formatting codes.
 *
 * It becomes visible immediately after cleanup.
 */

${TOOLBAR_SELECTOR} {
    visibility: hidden !important;
}

${TOOLBAR_SELECTOR}.firebase-toolbar-clean-ready {
    visibility: visible !important;
}

`;


        /*
         * Put the protection as early as possible.
         */

        if (document.head) {

            document.head.insertBefore(
                style,
                document.head.firstChild
            );

        } else {

            document.documentElement
                .insertBefore(
                    style,
                    document.documentElement.firstChild
                );

        }

    }


    /* ============================================================
       CSS
    ============================================================ */

    function addFormatterCSS() {

        if (
            document.getElementById(
                "firebaseFormatterSafeCSS"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "firebaseFormatterSafeCSS";


        style.textContent = `

.firebase-formatted-text {
    display: inline;
}


/* ================= STATIC + ANIMATED GRADIENT ================= */

.firebase-gradient-ocean,
.firebase-gradient-fire,
.firebase-gradient-purple,
.firebase-gradient-green,
.firebase-gradient-sunset,
.firebase-gradient-blue,
.firebase-gradient-animated,
.firebase-gradient-aurora,
.firebase-gradient-fire-animated,
.firebase-gradient-ocean-animated,
.firebase-gradient-purple-animated,
.firebase-gradient-sunset-animated,
.firebase-gradient-green-animated,
.firebase-gradient-rainbow {

    background-clip: text;
    -webkit-background-clip: text;

    color: transparent !important;
    -webkit-text-fill-color: transparent !important;

}


/* ================= OCEAN ================= */

.firebase-gradient-ocean {

    background-image:
        linear-gradient(
            90deg,
            #00c6ff,
            #0072ff
        );

}


/* ================= FIRE ================= */

.firebase-gradient-fire {

    background-image:
        linear-gradient(
            90deg,
            #ff512f,
            #f09819
        );

}


/* ================= PURPLE ================= */

.firebase-gradient-purple {

    background-image:
        linear-gradient(
            90deg,
            #8e2de2,
            #4a00e0
        );

}


/* ================= GREEN ================= */

.firebase-gradient-green {

    background-image:
        linear-gradient(
            90deg,
            #00b09b,
            #96c93d
        );

}


/* ================= SUNSET ================= */

.firebase-gradient-sunset {

    background-image:
        linear-gradient(
            90deg,
            #ff512f,
            #dd2476
        );

}


/* ================= BLUE ================= */

.firebase-gradient-blue {

    background-image:
        linear-gradient(
            90deg,
            #36d1dc,
            #5b86e5
        );

}


/* ================= ANIMATED ================= */

.firebase-gradient-animated {

    background-image:
        linear-gradient(
            270deg,
            #ff0080,
            #7928ca,
            #2afadf,
            #00c6ff,
            #ff0080
        );

    background-size:
        400% 400%;

    animation:
        firebaseGradientAnimation
        6s ease infinite;

}


/* ================= AURORA ================= */

.firebase-gradient-aurora {

    background-image:
        linear-gradient(
            270deg,
            #00f2fe,
            #4facfe,
            #a18cd1,
            #fbc2eb,
            #00f2fe
        );

    background-size:
        500% 500%;

    animation:
        firebaseAuroraAnimation
        8s ease infinite;

}


/* ================= FIRE ANIMATED ================= */

.firebase-gradient-fire-animated {

    background-image:
        linear-gradient(
            270deg,
            #ff0000,
            #ff512f,
            #ff8a00,
            #ffd000,
            #ff0000
        );

    background-size:
        400% 400%;

    animation:
        firebaseFireAnimation
        4s ease infinite;

}


/* ================= OCEAN ANIMATED ================= */

.firebase-gradient-ocean-animated {

    background-image:
        linear-gradient(
            270deg,
            #00c6ff,
            #0072ff,
            #00f2fe,
            #4facfe,
            #00c6ff
        );

    background-size:
        400% 400%;

    animation:
        firebaseOceanAnimation
        7s ease infinite;

}


/* ================= PURPLE ANIMATED ================= */

.firebase-gradient-purple-animated {

    background-image:
        linear-gradient(
            270deg,
            #7f00ff,
            #e100ff,
            #8e2de2,
            #4a00e0,
            #7f00ff
        );

    background-size:
        400% 400%;

    animation:
        firebasePurpleAnimation
        6s ease infinite;

}


/* ================= SUNSET ANIMATED ================= */

.firebase-gradient-sunset-animated {

    background-image:
        linear-gradient(
            270deg,
            #ff512f,
            #f09819,
            #ff0066,
            #ff8a00,
            #ff512f
        );

    background-size:
        400% 400%;

    animation:
        firebaseSunsetAnimation
        6s ease infinite;

}


/* ================= GREEN ANIMATED ================= */

.firebase-gradient-green-animated {

    background-image:
        linear-gradient(
            270deg,
            #00b09b,
            #96c93d,
            #00f260,
            #0575e6,
            #00b09b
        );

    background-size:
        400% 400%;

    animation:
        firebaseGreenAnimation
        7s ease infinite;

}


/* ================= RAINBOW ================= */

.firebase-gradient-rainbow {

    background-image:
        linear-gradient(
            270deg,
            #ff0000,
            #ff8a00,
            #ffe600,
            #00c853,
            #00b0ff,
            #7c4dff,
            #ff00c8,
            #ff0000
        );

    background-size:
        600% 600%;

    animation:
        firebaseRainbowAnimation
        8s linear infinite;

}


/* ============================================================
   ANIMATIONS
============================================================ */

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
       EXCLUDED AREAS
    ============================================================ */

    function isExcluded(element) {

        if (
            !element ||
            element.nodeType !== 1
        ) {
            return true;
        }


        return !!element.closest(
            TOOLBAR_SELECTOR
        );

    }


    /* ============================================================
       CODE LIST
    ============================================================ */

    const SORTED_CODES =
        Object.keys(FORMAT_CODES)
            .sort(function (a, b) {

                return b.length - a.length;

            });


    /* ============================================================
       FIND CODES
    ============================================================ */

    function getCodes(text) {

        if (!text) {
            return [];
        }


        const result = [];


        SORTED_CODES.forEach(
            function (code) {

                if (
                    text.indexOf(code) !== -1
                ) {

                    result.push(code);

                }

            }
        );


        return result;

    }


    /* ============================================================
       CLEAN CODES
    ============================================================ */

    function cleanText(text) {

        if (!text) {
            return "";
        }


        let result = text;


        SORTED_CODES.forEach(
            function (code) {

                result =
                    result.split(code).join("");

            }
        );


        return result;

    }


    /* ============================================================
       APPLY NORMAL STYLES
    ============================================================ */

    function applyFormatStyle(element, format) {

        let gradientClass = null;

        if (format.gradientClass) {
            gradientClass = format.gradientClass;
        }

        Object.keys(format).forEach(property => {

            if (property === "gradientClass") {
                return;
            }

            element.style.setProperty(
                property,
                format[property],
                "important"
            );

        });

        if (gradientClass) {
            element.classList.add(gradientClass);
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
       FORMAT TEXT NODE (UPDATED)
    ============================================================ */

    function formatTextNode(textNode) {

        if (!textNode ||
            textNode.nodeType !== Node.TEXT_NODE) {
            return;
        }

        const parent = textNode.parentElement;

        if (!parent ||
            parent.closest(".firebase-formatted-text") ||
            isExcluded(parent)) {
            return;
        }

        const originalText = textNode.nodeValue;

        /* ========================================================
           NEW:
           [#red]O+[/#red]
           [#blue]ABC[/#blue]
           [#bold]Name[/#bold]
           ======================================================== */

        const partialFormatRegex =
            /\[(#[a-zA-Z0-9_]+)\]([\s\S]*?)\[\/\1\]/g;

        if (partialFormatRegex.test(originalText)) {

            partialFormatRegex.lastIndex = 0;

            const fragment = document.createDocumentFragment();

            let lastIndex = 0;
            let match;

            while (
                (match = partialFormatRegex.exec(originalText))
            ) {

                /* আগের সাধারণ লেখা */
                if (match.index > lastIndex) {

                    fragment.appendChild(
                        document.createTextNode(
                            originalText.substring(
                                lastIndex,
                                match.index
                            )
                        )
                    );

                }

                const code = match[1];
                const content = match[2];

                const format = FORMAT_CODES[code];

                if (format) {

                    const span =
                        document.createElement("span");

                    span.className =
                        "firebase-formatted-text";

                    span.textContent = content;

                    applyFormatStyle(
                        span,
                        format
                    );

                    fragment.appendChild(span);

                } else {

                    /* অজানা code হলে মূল লেখা রাখবে */
                    fragment.appendChild(
                        document.createTextNode(
                            match[0]
                        )
                    );

                }

                lastIndex =
                    partialFormatRegex.lastIndex;
            }

            /* শেষের সাধারণ লেখা */
            if (lastIndex < originalText.length) {

                fragment.appendChild(
                    document.createTextNode(
                        originalText.substring(lastIndex)
                    )
                );

            }

            textNode.parentNode.replaceChild(
                fragment,
                textNode
            );

            return;
        }


        /* ========================================================
           OLD FORMAT SYSTEM
           #red
           #blue
           #bold
           ইত্যাদি
           ======================================================== */

        if (!originalText) {
            return;
        }

        const codes =
            getCodes(originalText);

        if (
            codes.length === 0
        ) {
            return;
        }

        const cleaned =
            cleanText(originalText);

        if (
            !cleaned.trim()
        ) {

            textNode.nodeValue =
                "";

            return;

        }

        const span =
            document.createElement(
                "span"
            );

        span.className =
            "firebase-formatted-text";

        span.textContent =
            cleaned;

        codes.forEach(code => {
            const format = FORMAT_CODES[code];
            if (format) {
                applyFormatStyle(span, format);
            }
        });

        textNode.parentNode.replaceChild(
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


        if (
            isExcluded(element)
        ) {
            return;
        }


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


                            const parent =
                                node.parentElement;


                            if (!parent) {

                                return NodeFilter.FILTER_REJECT;

                            }


                            if (
                                parent.classList &&
                                parent.classList.contains(
                                    "firebase-formatted-text"
                                )
                            ) {
                                return NodeFilter.FILTER_REJECT;
                            }


                            if (
                                isExcluded(parent)
                            ) {
                                return NodeFilter.FILTER_REJECT;
                            }


                            const original = node.nodeValue;
                            const hasPartial = /\[(#[a-zA-Z0-9_]+)\]([\s\S]*?)\[\/\1\]/.test(original);

                            if (
                                !hasPartial &&
                                getCodes(
                                    original
                                ).length === 0
                            ) {
                                return NodeFilter.FILTER_REJECT;
                            }


                            return NodeFilter.FILTER_ACCEPT;

                        }

                }
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

                formatTextNode(
                    textNode
                );

            }
        );

    }


    /* ============================================================
       REMOVE OLD FORMATTER STYLES
    ============================================================ */

    function removeOldFormatterStyles() {

        document
            .querySelectorAll(
                "[data-firebase-formatted='true']"
            )
            .forEach(
                function (element) {

                    if (
                        element.classList &&
                        element.classList.contains(
                            "firebase-formatted-text"
                        )
                    ) {
                        return;
                    }


                    const properties = [

                        "color",
                        "background",
                        "background-image",
                        "background-size",
                        "background-clip",
                        "-webkit-background-clip",
                        "-webkit-text-fill-color",
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
       TOOLBAR CLEANUP
       IMPORTANT:
       Cleanup FIRST, visibility AFTER cleanup.
    ============================================================ */

    let toolbarCleaned =
        false;


    function cleanToolbarCodes() {

        const containers =
            document.querySelectorAll(
                TOOLBAR_SELECTOR
            );


        if (!containers.length) {
            return;
        }


        containers.forEach(
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

                        const original =
                            textNode.nodeValue;


                        let cleaned =
                            cleanText(
                                original
                            );

                        cleaned = cleaned.replace(/\[\s*(#[a-zA-Z0-9_]+)?\s*\]([\s\S]*?)\[\s*\/\s*(#[a-zA-Z0-9_]+)?\s*\]/g, '$2');
                        cleaned = cleaned.replace(/\[\s*\/?\s*\]/g, '');


                        if (
                            cleaned !==
                            original
                        ) {

                            textNode.nodeValue =
                                cleaned;

                        }

                    }
                );


                /*
                 * Make this toolbar visible only
                 * AFTER its text has been cleaned.
                 */

                container.classList.add(
                    "firebase-toolbar-clean-ready"
                );

            }
        );


        toolbarCleaned =
            true;

    }


    /* ============================================================
       APPLY
    ============================================================ */

    function applyFirebaseTextColors(
        root
    ) {

        root =
            root || document.body;


        if (!root) {
            return;
        }


        /*
         * ALWAYS CLEAN TOOLBAR FIRST.
         *
         * This is important.
         * Formatting must never happen before
         * toolbar cleanup.
         */

        cleanToolbarCodes();


        addFormatterCSS();


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


        try {

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


            elements =
                elements.concat(
                    Array.from(
                        root.querySelectorAll(
                            selectors.join(",")
                        )
                    )
                );

        } catch (error) {

            console.warn(
                "Firebase formatter:",
                error
            );

        }


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


        /*
         * Final toolbar cleanup.
         *
         * If Firebase inserted toolbar content
         * during formatting, it is cleaned here.
         */

        cleanToolbarCodes();

    }


    /* ============================================================
       MUTATION OBSERVER
    ============================================================ */

    let observerTimer =
        null;


    let observerStarted =
        false;


    let observerRunning =
        false;


    const observer =
        new MutationObserver(
            function (mutations) {

                let shouldRun =
                    false;


                for (
                    let i = 0;
                    i < mutations.length;
                    i++
                ) {

                    const mutation =
                        mutations[i];


                    if (
                        mutation.type ===
                        "childList" &&
                        mutation.addedNodes.length
                    ) {

                        shouldRun =
                            true;

                        break;

                    }


                    if (
                        mutation.type ===
                        "characterData"
                    ) {

                        shouldRun =
                            true;

                        break;

                    }

                }


                if (
                    !shouldRun
                ) {
                    return;
                }


                /*
                 * First cleanup toolbar immediately.
                 */

                cleanToolbarCodes();


                clearTimeout(
                    observerTimer
                );


                observerTimer =
                    setTimeout(
                        function () {

                            if (
                                observerRunning
                            ) {
                                return;
                            }


                            observerRunning =
                                true;


                            try {

                                applyFirebaseTextColors(
                                    document.body
                                );

                            } finally {

                                observerRunning =
                                    false;

                            }

                        },
                        0
                    );

            }
        );


    /* ============================================================
       INITIALIZE
    ============================================================ */

    function initializeFormatter() {

        /*
         * IMPORTANT ORDER:
         *
         * 1. Protect toolbar
         * 2. Add formatter CSS
         * 3. Clean toolbar
         * 4. Remove old styles
         * 5. Format Firebase text
         * 6. Clean toolbar again
         * 7. Start observer
         */

        installEarlyToolbarProtection();


        addFormatterCSS();


        cleanToolbarCodes();


        removeOldFormatterStyles();


        applyFirebaseTextColors(
            document.body
        );


        cleanToolbarCodes();


        /*
         * Start observer only once.
         */

        if (
            !observerStarted &&
            document.body
        ) {

            observer.observe(
                document.body,
                {
                    childList: true,
                    subtree: true,
                    characterData: true
                }
            );


            observerStarted =
                true;

        }

    }


    /* ============================================================
       EARLY EXECUTION
    ============================================================ */

    /*
     * Install protection as early as possible.
     */

    installEarlyToolbarProtection();


    /*
     * If body already exists, perform immediate cleanup.
     */

    if (
        document.body
    ) {

        cleanToolbarCodes();

        addFormatterCSS();

        applyFirebaseTextColors(
            document.body
        );

        cleanToolbarCodes();

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
            initializeFormatter,
            {
                once: true
            }
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
            function(text) {
                if (!text) return "";
                let cleaned = cleanText(text);
                // সমস্ত ট্যাগ এবং অসম্পূর্ণ বা খালি বন্ধনী পরিষ্কার করার উন্নত রেজেক্স
                cleaned = cleaned.replace(/\[\s*(#[a-zA-Z0-9_]+)?\s*\]([\s\S]*?)\[\s*\/\s*(#[a-zA-Z0-9_]+)?\s*\]/g, '$2');
                cleaned = cleaned.replace(/\[\s*\/?\s*\]/g, '');
                return cleaned;
            },

        codes:
            FORMAT_CODES

    };


    /* ============================================================
       AUTO-INTERCEPTION FOR SHARING & COPYING (Enhanced Clean)
    ============================================================ */
    if (navigator.clipboard && navigator.clipboard.writeText) {
        const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = function (text) {
            return originalWriteText(window.firebaseTextFormatter.clean(text));
        };
    }

    if (navigator.share) {
        const originalShare = navigator.share.bind(navigator);
        navigator.share = function (shareData) {
            let modifiedData = { ...shareData };
            if (modifiedData.text) modifiedData.text = window.firebaseTextFormatter.clean(modifiedData.text);
            if (modifiedData.title) modifiedData.title = window.firebaseTextFormatter.clean(modifiedData.title);
            if (modifiedData.url) modifiedData.url = window.firebaseTextFormatter.clean(modifiedData.url);
            return originalShare(modifiedData);
        };
    }

})();
