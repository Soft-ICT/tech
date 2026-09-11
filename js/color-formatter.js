/* ============================================================
   Firebase Text Color & Design Formatter
   File: Js/color-formatter.js

   SAFE VERSION
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
   ✔ Toolbar untouched
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

/* ============================================================
   IMPORTANT:
   These rules affect ONLY formatter-created spans.
   No card, profile or parent element is modified.
============================================================ */

.firebase-formatted-text {
    display: inline;
}


/* ================= STATIC GRADIENT ================= */

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

    function applyNormalStyles(
        element,
        codes
    ) {

        let gradientClass = null;

        codes.forEach(
            function (code) {

                const config =
                    FORMAT_CODES[code];

                if (!config) {
                    return;
                }


                if (
                    config.gradientClass
                ) {

                    gradientClass =
                        config.gradientClass;

                    return;

                }


                Object.keys(config).forEach(
                    function (property) {

                        if (
                            property ===
                            "gradientClass"
                        ) {
                            return;
                        }

                        element.style.setProperty(
                            property,
                            config[property],
                            "important"
                        );

                    }
                );

            }
        );


        if (gradientClass) {

            element.classList.add(
                gradientClass
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
       FORMAT TEXT NODE
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


        if (
            codes.length === 0
        ) {
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


        if (
            parent.classList &&
            parent.classList.contains(
                "firebase-formatted-text"
            )
        ) {
            return;
        }


        const cleaned =
            cleanText(original);


        if (
            !cleaned.trim()
        ) {

            textNode.nodeValue = "";

            return;

        }


        const span =
            document.createElement("span");


        span.className =
            "firebase-formatted-text";


        span.textContent =
            cleaned;


        applyNormalStyles(
            span,
            codes
        );


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


                            if (
                                !parent
                            ) {
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
       CLEAN OLD FORMATTER SPANS
    ============================================================ */

    function cleanOldFormatterSpans() {

        document
            .querySelectorAll(
                ".firebase-formatted-text"
            )
            .forEach(
                function (span) {

                    const parent =
                        span.parentNode;


                    if (!parent) {
                        return;
                    }


                    /*
                     * Remove old formatter span
                     * only when it no longer contains
                     * a formatting code.
                     */

                    const text =
                        span.textContent || "";


                    if (
                        getCodes(text).length === 0
                    ) {

                        /*
                         * Do not unwrap a valid
                         * formatted span unnecessarily.
                         */

                        return;

                    }

                }
            );

    }


    /* ============================================================
       TOOLBAR CLEANUP
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


        document
            .querySelectorAll(
                selectors.join(",")
            )
            .forEach(
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

        cleanToolbarCodes();
    }


    /* ============================================================
       MUTATION OBSERVER
    ============================================================ */

    let observerTimer =
        null;


    let observerStarted =
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
                        100
                    );

            }
        );


    /* ============================================================
       INITIALIZE
    ============================================================ */

    function initializeFormatter() {

        cleanToolbarCodes(); // এই লাইনটি যোগ করা হয়েছে[span_2](start_span)[span_2](end_span)

        addFormatterCSS();


        /*
         * Remove styles created by
         * the older formatter version.
         */

        removeOldFormatterStyles();


        /*
         * Format current Firebase content.
         */

        applyFirebaseTextColors(
            document.body
        );


        /*
         * Start observer only once.
         */

        if (
            !observerStarted
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
