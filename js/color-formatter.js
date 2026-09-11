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
/* ============================================================
   FIREBASE TEXT COLOR / FORMATTER
   Anti-Flash Edition
   ============================================================ */

"use strict";

/* ============================================================
   FORMAT CODES
   ============================================================ */

const FORMAT_CODES = {

    /* ---------- BASIC COLORS ---------- */

    "#red": {
        color: "#ef4444"
    },

    "#blue": {
        color: "#3b82f6"
    },

    "#green": {
        color: "#22c55e"
    },

    "#yellow": {
        color: "#eab308"
    },

    "#purple": {
        color: "#a855f7"
    },

    "#pink": {
        color: "#ec4899"
    },

    "#orange": {
        color: "#f97316"
    },

    "#cyan": {
        color: "#06b6d4"
    },

    "#teal": {
        color: "#14b8a6"
    },

    "#indigo": {
        color: "#6366f1"
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
        textDecorationColor: "#f59e0b",
        textDecorationThickness: "2px"
    },

    "#underline_red": {
        textDecoration: "underline",
        textDecorationColor: "#ef4444",
        textDecorationThickness: "2px"
    },

    "#underline_blue": {
        textDecoration: "underline",
        textDecorationColor: "#3b82f6",
        textDecorationThickness: "2px"
    },

    "#strike": {
        textDecoration: "line-through"
    },


    /* ---------- HIGHLIGHT ---------- */

    "#highlight": {
        background: "#fff59d"
    },

    "#highlight_blue": {
        background: "#bfdbfe"
    },

    "#highlight_green": {
        background: "#bbf7d0"
    },

    "#highlight_red": {
        background: "#fecaca"
    },

    "#highlight_purple": {
        background: "#e9d5ff"
    },

    "#highlight_pink": {
        background: "#fbcfe8"
    },


    /* ---------- STATIC GRADIENT ---------- */

    "#grad_ocean": {
        gradientClass: "firebase-grad-ocean"
    },

    "#grad_fire": {
        gradientClass: "firebase-grad-fire"
    },

    "#grad_purple": {
        gradientClass: "firebase-grad-purple"
    },

    "#grad_green": {
        gradientClass: "firebase-grad-green"
    },

    "#grad_sunset": {
        gradientClass: "firebase-grad-sunset"
    },

    "#grad_blue": {
        gradientClass: "firebase-grad-blue"
    },


    /* ---------- ANIMATED GRADIENT ---------- */

    "#grad_animated": {
        gradientClass: "firebase-grad-animated"
    },

    "#grad_aurora": {
        gradientClass: "firebase-grad-aurora"
    },

    "#grad_fire_animated": {
        gradientClass: "firebase-grad-fire-animated"
    },

    "#grad_ocean_animated": {
        gradientClass: "firebase-grad-ocean-animated"
    },

    "#grad_purple_animated": {
        gradientClass: "firebase-grad-purple-animated"
    },

    "#grad_sunset_animated": {
        gradientClass: "firebase-grad-sunset-animated"
    },

    "#grad_green_animated": {
        gradientClass: "firebase-grad-green-animated"
    },

    "#grad_rainbow": {
        gradientClass: "firebase-grad-rainbow"
    },


    /* ---------- SHADOW ---------- */

    "#shadow": {
        textShadow: "1px 1px 3px rgba(0,0,0,.35)"
    },

    "#shadow_dark": {
        textShadow: "2px 2px 5px rgba(0,0,0,.75)"
    },


    /* ---------- GLOW ---------- */

    "#glow_blue": {
        textShadow:
            "0 0 5px #3b82f6, 0 0 10px #3b82f6"
    },

    "#glow_red": {
        textShadow:
            "0 0 5px #ef4444, 0 0 10px #ef4444"
    },

    "#glow_green": {
        textShadow:
            "0 0 5px #22c55e, 0 0 10px #22c55e"
    },

    "#glow_purple": {
        textShadow:
            "0 0 5px #a855f7, 0 0 10px #a855f7"
    },

    "#glow_cyan": {
        textShadow:
            "0 0 5px #06b6d4, 0 0 10px #06b6d4"
    }
};


/* ============================================================
   SELECTORS THAT MUST NEVER BE FORMATTED
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

    '[role="navigation"]'
];


/* ============================================================
   CHECK EXCLUDED ELEMENT
   ============================================================ */

function isExcluded(element) {

    if (!element || element.nodeType !== 1) {
        return true;
    }

    try {

        return TOOLBAR_SELECTORS.some(selector => {

            try {
                return element.matches(selector) ||
                       !!element.closest(selector);
            } catch (e) {
                return false;
            }

        });

    } catch (e) {

        return false;
    }
}


/* ============================================================
   CSS
   ============================================================ */

function addFormatterCSS() {

    if (document.getElementById("firebaseFormatterCSS")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "firebaseFormatterCSS";

    style.textContent = `

        .firebase-formatted-text {
            display: inline;
        }


        /* ---------- OCEAN ---------- */

        .firebase-grad-ocean {
            background: linear-gradient(
                90deg,
                #06b6d4,
                #3b82f6,
                #6366f1
            );

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        /* ---------- FIRE ---------- */

        .firebase-grad-fire {
            background: linear-gradient(
                90deg,
                #ef4444,
                #f97316,
                #eab308
            );

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        /* ---------- PURPLE ---------- */

        .firebase-grad-purple {
            background: linear-gradient(
                90deg,
                #8b5cf6,
                #a855f7,
                #ec4899
            );

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        /* ---------- GREEN ---------- */

        .firebase-grad-green {
            background: linear-gradient(
                90deg,
                #16a34a,
                #22c55e,
                #14b8a6
            );

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        /* ---------- SUNSET ---------- */

        .firebase-grad-sunset {
            background: linear-gradient(
                90deg,
                #f97316,
                #ec4899,
                #8b5cf6
            );

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        /* ---------- BLUE ---------- */

        .firebase-grad-blue {
            background: linear-gradient(
                90deg,
                #2563eb,
                #06b6d4
            );

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        /* ---------- ANIMATED ---------- */

        .firebase-grad-animated {
            background:
                linear-gradient(
                    270deg,
                    #ef4444,
                    #f97316,
                    #eab308,
                    #22c55e,
                    #06b6d4,
                    #3b82f6,
                    #a855f7,
                    #ec4899
                );

            background-size: 500% 500%;

            animation:
                firebaseGradientMove 5s ease infinite;

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        .firebase-grad-aurora {
            background:
                linear-gradient(
                    270deg,
                    #22d3ee,
                    #6366f1,
                    #a855f7,
                    #ec4899,
                    #22d3ee
                );

            background-size: 400% 400%;

            animation:
                firebaseGradientMove 6s ease infinite;

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        .firebase-grad-fire-animated {
            background:
                linear-gradient(
                    270deg,
                    #dc2626,
                    #ef4444,
                    #f97316,
                    #eab308,
                    #dc2626
                );

            background-size: 400% 400%;

            animation:
                firebaseGradientMove 4s ease infinite;

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        .firebase-grad-ocean-animated {
            background:
                linear-gradient(
                    270deg,
                    #0891b2,
                    #06b6d4,
                    #3b82f6,
                    #6366f1,
                    #0891b2
                );

            background-size: 400% 400%;

            animation:
                firebaseGradientMove 5s ease infinite;

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        .firebase-grad-purple-animated {
            background:
                linear-gradient(
                    270deg,
                    #7c3aed,
                    #a855f7,
                    #ec4899,
                    #7c3aed
                );

            background-size: 400% 400%;

            animation:
                firebaseGradientMove 5s ease infinite;

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        .firebase-grad-sunset-animated {
            background:
                linear-gradient(
                    270deg,
                    #f97316,
                    #ef4444,
                    #ec4899,
                    #8b5cf6,
                    #f97316
                );

            background-size: 400% 400%;

            animation:
                firebaseGradientMove 5s ease infinite;

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        .firebase-grad-green-animated {
            background:
                linear-gradient(
                    270deg,
                    #16a34a,
                    #22c55e,
                    #14b8a6,
                    #06b6d4,
                    #16a34a
                );

            background-size: 400% 400%;

            animation:
                firebaseGradientMove 5s ease infinite;

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        .firebase-grad-rainbow {
            background:
                linear-gradient(
                    90deg,
                    #ef4444,
                    #f97316,
                    #eab308,
                    #22c55e,
                    #06b6d4,
                    #3b82f6,
                    #8b5cf6,
                    #ec4899
                );

            background-size: 300% 100%;

            animation:
                firebaseRainbowMove 5s linear infinite;

            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }


        @keyframes firebaseGradientMove {

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


        @keyframes firebaseRainbowMove {

            0% {
                background-position: 0% 50%;
            }

            100% {
                background-position: 100% 50%;
            }

        }


        /* ====================================================
           ANTI FLASH
           ==================================================== */

        .firebase-format-pending {
            visibility: hidden !important;
        }


        .firebase-format-ready {
            visibility: visible !important;
        }


        /* Toolbar remains immediately protected */

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
        [role="navigation"] {

            --firebase-toolbar-clean: 1;

        }

    `;

    document.head.appendChild(style);
}


/* ============================================================
   FIND FORMAT CODES
   ============================================================ */

function containsFormatCode(text) {

    if (!text) {
        return false;
    }

    for (const code of Object.keys(FORMAT_CODES)) {

        if (text.includes(code)) {
            return true;
        }

    }

    return false;
}


/* ============================================================
   APPLY STYLE
   ============================================================ */

function applyFormatStyle(element, format) {

    if (!element || !format) {
        return;
    }

    if (format.color) {
        element.style.color = format.color;
    }

    if (format.fontWeight) {
        element.style.fontWeight = format.fontWeight;
    }

    if (format.fontStyle) {
        element.style.fontStyle = format.fontStyle;
    }

    if (format.textDecoration) {
        element.style.textDecoration =
            format.textDecoration;
    }

    if (format.textDecorationColor) {
        element.style.textDecorationColor =
            format.textDecorationColor;
    }

    if (format.textDecorationThickness) {
        element.style.textDecorationThickness =
            format.textDecorationThickness;
    }

    if (format.background) {
        element.style.background =
            format.background;
    }

    if (format.textShadow) {
        element.style.textShadow =
            format.textShadow;
    }

    if (format.gradientClass) {
        element.classList.add(format.gradientClass);
    }

}


/* ============================================================
   FORMAT SINGLE TEXT NODE
   ============================================================ */

function formatTextNode(textNode) {

    if (!textNode ||
        textNode.nodeType !== Node.TEXT_NODE) {
        return;
    }

    const parent = textNode.parentElement;

    if (!parent) {
        return;
    }

    if (parent.closest(".firebase-formatted-text")) {
        return;
    }

    if (isExcluded(parent)) {
        return;
    }

    const originalText = textNode.nodeValue;

    if (!containsFormatCode(originalText)) {
        return;
    }

    let cleanedText = originalText;

    const formats = [];

    for (const code of Object.keys(FORMAT_CODES)) {

        if (cleanedText.includes(code)) {

            formats.push(FORMAT_CODES[code]);

            cleanedText =
                cleanedText.split(code).join("");

        }

    }

    const span = document.createElement("span");

    span.className =
        "firebase-formatted-text";

    span.textContent = cleanedText;

    formats.forEach(format => {
        applyFormatStyle(span, format);
    });

    textNode.parentNode.replaceChild(
        span,
        textNode
    );
}


/* ============================================================
   FORMAT ELEMENT
   ============================================================ */

function formatElement(root) {

    if (!root) {
        return;
    }

    if (root.nodeType === Node.TEXT_NODE) {
        formatTextNode(root);
        return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    if (isExcluded(root)) {
        return;
    }

    if (root.classList.contains(
        "firebase-formatted-text"
    )) {
        return;
    }

    const walker =
        document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {

                    if (!node.nodeValue ||
                        !containsFormatCode(node.nodeValue)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    const p = node.parentElement;

                    if (!p ||
                        isExcluded(p) ||
                        p.closest(
                            ".firebase-formatted-text"
                        )) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

    const nodes = [];

    let node;

    while ((node = walker.nextNode())) {
        nodes.push(node);
    }

    nodes.forEach(formatTextNode);
}


/* ============================================================
   REMOVE OLD FORMATTER STYLES
   ============================================================ */

function removeOldFormatterStyles(root) {

    if (!root) {
        return;
    }

    const elements =
        root.querySelectorAll
            ? root.querySelectorAll(
                ".firebase-formatted-text"
            )
            : [];

    elements.forEach(el => {

        el.classList.remove(
            "firebase-grad-ocean",
            "firebase-grad-fire",
            "firebase-grad-purple",
            "firebase-grad-green",
            "firebase-grad-sunset",
            "firebase-grad-blue",
            "firebase-grad-animated",
            "firebase-grad-aurora",
            "firebase-grad-fire-animated",
            "firebase-grad-ocean-animated",
            "firebase-grad-purple-animated",
            "firebase-grad-sunset-animated",
            "firebase-grad-green-animated",
            "firebase-grad-rainbow"
        );

    });

}


/* ============================================================
   TOOLBAR CLEANER
   ============================================================ */

function cleanToolbarCodes() {

    TOOLBAR_SELECTORS.forEach(selector => {

        document.querySelectorAll(selector)
            .forEach(toolbar => {

                const walker =
                    document.createTreeWalker(
                        toolbar,
                        NodeFilter.SHOW_TEXT
                    );

                const nodes = [];

                let node;

                while ((node = walker.nextNode())) {
                    nodes.push(node);
                }

                nodes.forEach(textNode => {

                    let text =
                        textNode.nodeValue;

                    if (!containsFormatCode(text)) {
                        return;
                    }

                    for (const code of
                        Object.keys(FORMAT_CODES)) {

                        text =
                            text.split(code).join("");

                    }

                    textNode.nodeValue = text;

                });

            });

    });


    document.documentElement.classList
        .add("firebase-toolbar-clean-ready");
}


/* ============================================================
   MAIN FORMAT FUNCTION
   ============================================================ */

function applyFirebaseTextColors(root) {

    root =
        root || document.body;

    if (!root) {
        return;
    }

    addFormatterCSS();

    if (root === document.body) {

        document.body.classList
            .add("firebase-format-pending");

    } else {

        root.classList
            .add("firebase-format-pending");

    }


    /* --------------------------------------------
       IMPORTANT:
       FORMAT IMMEDIATELY.
       NO requestAnimationFrame BEFORE FORMAT.
       -------------------------------------------- */

    removeOldFormatterStyles(root);

    formatElement(root);

    cleanToolbarCodes();


    if (root === document.body) {

        document.body.classList
            .remove("firebase-format-pending");

        document.body.classList
            .add("firebase-format-ready");

    } else {

        root.classList
            .remove("firebase-format-pending");

        root.classList
            .add("firebase-format-ready");

    }

}


/* ============================================================
   SYNCHRONOUS DOM FORMATTER
   ============================================================ */

let formatterInternalChange = false;


/* ---------- ORIGINAL INNER HTML ---------- */

const originalInnerHTMLDescriptor =
    Object.getOwnPropertyDescriptor(
        Element.prototype,
        "innerHTML"
    );


if (
    originalInnerHTMLDescriptor &&
    originalInnerHTMLDescriptor.set
) {

    Object.defineProperty(
        Element.prototype,
        "innerHTML",
        {

            configurable:
                originalInnerHTMLDescriptor.configurable,

            enumerable:
                originalInnerHTMLDescriptor.enumerable,

            get:
                originalInnerHTMLDescriptor.get,

            set(value) {

                originalInnerHTMLDescriptor.set
                    .call(this, value);


                if (
                    formatterInternalChange ||
                    !document.body
                ) {
                    return;
                }


                /*

                   The important part:

                   innerHTML is inserted and formatted
                   during the SAME JavaScript task.

                   Browser gets no opportunity to paint
                   the raw Firebase formatting codes.

                */

                try {

                    if (
                        this !== document.documentElement &&
                        !isExcluded(this)
                    ) {

                        formatElement(this);

                    }

                } catch (e) {

                    console.error(
                        "Formatter innerHTML error:",
                        e
                    );

                }

            }

        }
    );

}


/* ============================================================
   INSERT ADJACENT HTML
   ============================================================ */

const originalInsertAdjacentHTML =
    Element.prototype.insertAdjacentHTML;


if (originalInsertAdjacentHTML) {

    Element.prototype.insertAdjacentHTML =
        function(position, text) {

            originalInsertAdjacentHTML.call(
                this,
                position,
                text
            );


            if (
                formatterInternalChange ||
                isExcluded(this)
            ) {
                return;
            }


            try {

                formatElement(this);

            } catch (e) {

                console.error(
                    "Formatter insertAdjacentHTML error:",
                    e
                );

            }

        };

}


/* ============================================================
   APPEND CHILD PROTECTION
   ============================================================ */

const originalAppendChild =
    Node.prototype.appendChild;


Node.prototype.appendChild =
    function(child) {

        const result =
            originalAppendChild.call(
                this,
                child
            );


        if (
            formatterInternalChange ||
            !document.body
        ) {
            return result;
        }


        try {

            if (
                this.nodeType === Node.ELEMENT_NODE &&
                !isExcluded(this)
            ) {

                if (
                    child.nodeType ===
                    Node.ELEMENT_NODE
                ) {

                    formatElement(child);

                } else if (
                    child.nodeType ===
                    Node.TEXT_NODE
                ) {

                    formatTextNode(child);

                }

            }

        } catch (e) {

            console.error(
                "Formatter appendChild error:",
                e
            );

        }


        return result;

    };


/* ============================================================
   MUTATION OBSERVER
   ============================================================ */

let formatterObserver = null;


function startFormatterObserver() {

    if (
        formatterObserver ||
        !document.body
    ) {
        return;
    }


    formatterObserver =
        new MutationObserver(
            mutations => {

                mutations.forEach(mutation => {

                    if (
                        mutation.type ===
                        "characterData"
                    ) {

                        if (
                            containsFormatCode(
                                mutation.target.nodeValue
                            )
                        ) {

                            formatTextNode(
                                mutation.target
                            );

                        }

                        return;
                    }


                    mutation.addedNodes.forEach(node => {

                        if (
                            node.nodeType ===
                            Node.TEXT_NODE
                        ) {

                            if (
                                containsFormatCode(
                                    node.nodeValue
                                )
                            ) {

                                formatTextNode(node);

                            }

                        } else if (
                            node.nodeType ===
                            Node.ELEMENT_NODE
                        ) {

                            if (!isExcluded(node)) {
                                formatElement(node);
                            }

                        }

                    });

                });


                cleanToolbarCodes();

            }
        );


    formatterObserver.observe(
        document.body,
        {
            childList: true,
            subtree: true,
            characterData: true
        }
    );

}


/* ============================================================
   INITIALIZATION
   ============================================================ */

function initializeFirebaseFormatter() {

    addFormatterCSS();


    /*

       Body is hidden ONLY while initial formatter
       is running.

       This prevents initial Firebase data flash.

    */

    if (document.body) {

        document.body.classList
            .add("firebase-format-pending");

    }


    applyFirebaseTextColors(
        document.body
    );


    startFormatterObserver();


    cleanToolbarCodes();


    if (document.body) {

        document.body.classList
            .remove("firebase-format-pending");

        document.body.classList
            .add("firebase-format-ready");

    }

}


/* ============================================================
   DOM READY
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeFirebaseFormatter,
        {
            once: true
        }
    );

} else {

    initializeFirebaseFormatter();

}


/* ============================================================
   PAGE LOAD SAFETY
   ============================================================ */

window.addEventListener(
    "load",
    () => {

        try {

            applyFirebaseTextColors(
                document.body
            );

            cleanToolbarCodes();

        } catch (e) {

            console.error(
                "Formatter load error:",
                e
            );

        }

    },
    {
        once: true
    }
);


/* ============================================================
   GLOBAL ACCESS
   ============================================================ */

window.FORMAT_CODES =
    FORMAT_CODES;

window.applyFirebaseTextColors =
    applyFirebaseTextColors;

window.formatElement =
    formatElement;

window.cleanToolbarCodes =
    cleanToolbarCodes;
