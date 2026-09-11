/**
 * Advanced Firebase Text Color & Design Formatter
 * Version: Fixed Multi-Code
 *
 * Supports:
 * #red #blue #green #yellow #purple #pink
 * #orange #cyan #teal #indigo #black #white
 *
 * #bold #italic #underline
 * #underline_gold #underline_red #underline_blue
 * #strike
 *
 * #highlight
 * #highlight_blue #highlight_green
 * #highlight_red #highlight_purple #highlight_pink
 *
 * #grad_ocean #grad_fire #grad_purple
 * #grad_green #grad_sunset #grad_blue
 *
 * #shadow #shadow_dark
 *
 * #glow_blue #glow_red #glow_green
 * #glow_purple #glow_cyan
 *
 * Example:
 * কমান্ড্যান্ট#red#bold#underline
 */

(function () {

    'use strict';


    // =========================================================
    // ALL AVAILABLE CODES
    // =========================================================

    const COLOR_KEYWORDS = {

        // -----------------------------------------------------
        // BASIC COLORS
        // -----------------------------------------------------

        '#red': {
            type: 'color',
            value: '#ef4444'
        },

        '#blue': {
            type: 'color',
            value: '#2563eb'
        },

        '#green': {
            type: 'color',
            value: '#10b981'
        },

        '#yellow': {
            type: 'color',
            value: '#f59e0b'
        },

        '#purple': {
            type: 'color',
            value: '#8b5cf6'
        },

        '#pink': {
            type: 'color',
            value: '#ec4899'
        },

        '#orange': {
            type: 'color',
            value: '#f97316'
        },

        '#cyan': {
            type: 'color',
            value: '#06b6d4'
        },

        '#teal': {
            type: 'color',
            value: '#14b8a6'
        },

        '#indigo': {
            type: 'color',
            value: '#6366f1'
        },

        '#black': {
            type: 'color',
            value: '#111827'
        },

        '#white': {
            type: 'color',
            value: '#ffffff'
        },


        // -----------------------------------------------------
        // TEXT STYLE
        // -----------------------------------------------------

        '#bold': {
            type: 'bold'
        },

        '#italic': {
            type: 'italic'
        },

        '#underline': {
            type: 'underline',
            value: '2px solid currentColor'
        },

        '#underline_gold': {
            type: 'underline',
            value: '2px solid #f59e0b'
        },

        '#underline_red': {
            type: 'underline',
            value: '2px solid #ef4444'
        },

        '#underline_blue': {
            type: 'underline',
            value: '2px solid #2563eb'
        },

        '#strike': {
            type: 'strike'
        },


        // -----------------------------------------------------
        // HIGHLIGHT
        // -----------------------------------------------------

        '#highlight': {
            type: 'highlight',
            background: '#fff3a3'
        },

        '#highlight_blue': {
            type: 'highlight',
            background: '#bfdbfe'
        },

        '#highlight_green': {
            type: 'highlight',
            background: '#bbf7d0'
        },

        '#highlight_red': {
            type: 'highlight',
            background: '#fecaca'
        },

        '#highlight_purple': {
            type: 'highlight',
            background: '#ddd6fe'
        },

        '#highlight_pink': {
            type: 'highlight',
            background: '#fbcfe8'
        },


        // -----------------------------------------------------
        // GRADIENT
        // -----------------------------------------------------

        '#grad_ocean': {
            type: 'gradient',
            value:
                'linear-gradient(135deg, #3b82f6, #06b6d4)'
        },

        '#grad_fire': {
            type: 'gradient',
            value:
                'linear-gradient(135deg, #ef4444, #f97316, #f59e0b)'
        },

        '#grad_purple': {
            type: 'gradient',
            value:
                'linear-gradient(135deg, #8b5cf6, #ec4899)'
        },

        '#grad_green': {
            type: 'gradient',
            value:
                'linear-gradient(135deg, #10b981, #22c55e)'
        },

        '#grad_sunset': {
            type: 'gradient',
            value:
                'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)'
        },

        '#grad_blue': {
            type: 'gradient',
            value:
                'linear-gradient(135deg, #1d4ed8, #60a5fa)'
        },


        // -----------------------------------------------------
        // SHADOW
        // -----------------------------------------------------

        '#shadow': {
            type: 'shadow',
            value:
                '2px 2px 4px rgba(0,0,0,0.35)'
        },

        '#shadow_dark': {
            type: 'shadow',
            value:
                '2px 3px 6px rgba(0,0,0,0.55)'
        },


        // -----------------------------------------------------
        // GLOW
        // -----------------------------------------------------

        '#glow_blue': {
            type: 'glow',
            value: '#2563eb'
        },

        '#glow_red': {
            type: 'glow',
            value: '#ef4444'
        },

        '#glow_green': {
            type: 'glow',
            value: '#10b981'
        },

        '#glow_purple': {
            type: 'glow',
            value: '#8b5cf6'
        },

        '#glow_cyan': {
            type: 'glow',
            value: '#06b6d4'
        }

    };


    // =========================================================
    // ELEMENTS THAT MUST NEVER RECEIVE FORMATTER STYLES
    // =========================================================

    const EXCLUDED_SELECTORS = [

        'header',
        'nav',

        '.navbar',
        '.topbar',
        '.toolbar',
        '.header',

        '#toolbar',
        '#topbar',
        '#header',

        '#navToggleBtn',
        '#menuIcon',
        '#backIcon',

        'button',
        'input',
        'textarea',
        'select',

        '.modal-header',
        '.modal-footer'

    ];


    // =========================================================
    // CHECK WHETHER ELEMENT IS TOOLBAR / EXCLUDED
    // =========================================================

    function isExcludedElement(el) {

        if (!el || el.nodeType !== 1) {
            return true;
        }


        for (
            const selector
            of EXCLUDED_SELECTORS
        ) {

            try {

                if (
                    el.matches(selector)
                ) {
                    return true;
                }

            } catch (error) {}

        }


        for (
            const selector
            of EXCLUDED_SELECTORS
        ) {

            try {

                if (
                    el.closest(selector)
                ) {
                    return true;
                }

            } catch (error) {}

        }


        return false;
    }


    // =========================================================
    // ESCAPE REGEX
    // =========================================================

    function escapeRegExp(text) {

        return text.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );

    }


    // =========================================================
    // GET ALL CODES FROM TEXT
    // =========================================================

    function getCodes(text) {

        const found = [];

        Object.keys(
            COLOR_KEYWORDS
        ).forEach(
            function (key) {

                const regex =
                    new RegExp(
                        escapeRegExp(key),
                        'gi'
                    );

                if (
                    regex.test(text)
                ) {

                    found.push(key);

                }

            }
        );

        return found;
    }


    // =========================================================
    // REMOVE ALL CODES
    // =========================================================

    function cleanText(text) {

        let result = text;


        Object.keys(
            COLOR_KEYWORDS
        ).forEach(
            function (key) {

                result =
                    result.replace(
                        new RegExp(
                            escapeRegExp(key),
                            'gi'
                        ),
                        ''
                    );

            }
        );


        return result;

    }


    // =========================================================
    // APPLY STYLE TO ONE ELEMENT
    // =========================================================

    function applyStyles(
        element,
        codes
    ) {

        if (
            !element ||
            !codes ||
            !codes.length
        ) {
            return;
        }


        let hasGradient = false;
        let hasColor = false;
        let hasHighlight = false;


        // -----------------------------------------------------
        // FIRST PASS
        // -----------------------------------------------------

        codes.forEach(
            function (code) {

                const config =
                    COLOR_KEYWORDS[code];


                if (!config) {
                    return;
                }


                if (
                    config.type === 'gradient'
                ) {

                    hasGradient = true;

                }


                if (
                    config.type === 'color'
                ) {

                    hasColor = true;

                }


                if (
                    config.type === 'highlight'
                ) {

                    hasHighlight = true;

                }

            }
        );


        // -----------------------------------------------------
        // BASIC COLOR
        // -----------------------------------------------------

        const colorCode =
            codes.find(
                function (code) {

                    return (
                        COLOR_KEYWORDS[code] &&
                        COLOR_KEYWORDS[code].type ===
                        'color'
                    );

                }
            );


        if (
            colorCode &&
            !hasGradient
        ) {

            element.style.setProperty(
                'color',
                COLOR_KEYWORDS[colorCode].value,
                'important'
            );

        }


        // -----------------------------------------------------
        // BOLD
        // -----------------------------------------------------

        if (
            codes.includes('#bold')
        ) {

            element.style.setProperty(
                'font-weight',
                '700',
                'important'
            );

        }


        // -----------------------------------------------------
        // ITALIC
        // -----------------------------------------------------

        if (
            codes.includes('#italic')
        ) {

            element.style.setProperty(
                'font-style',
                'italic',
                'important'
            );

        }


        // -----------------------------------------------------
        // UNDERLINE
        // -----------------------------------------------------

        const underlineCode =
            codes.find(
                function (code) {

                    return (
                        COLOR_KEYWORDS[code] &&
                        COLOR_KEYWORDS[code].type ===
                        'underline'
                    );

                }
            );


        if (underlineCode) {

            element.style.setProperty(
                'border-bottom',
                COLOR_KEYWORDS[
                    underlineCode
                ].value,
                'important'
            );

            element.style.setProperty(
                'padding-bottom',
                '2px',
                'important'
            );

        }


        // -----------------------------------------------------
        // STRIKE
        // -----------------------------------------------------

        if (
            codes.includes('#strike')
        ) {

            element.style.setProperty(
                'text-decoration',
                'line-through',
                'important'
            );

        }


        // -----------------------------------------------------
        // HIGHLIGHT
        // -----------------------------------------------------

        const highlightCode =
            codes.find(
                function (code) {

                    return (
                        COLOR_KEYWORDS[code] &&
                        COLOR_KEYWORDS[code].type ===
                        'highlight'
                    );

                }
            );


        if (
            highlightCode &&
            !hasGradient
        ) {

            element.style.setProperty(
                'background-color',
                COLOR_KEYWORDS[
                    highlightCode
                ].background,
                'important'
            );

            element.style.setProperty(
                'padding',
                '2px 6px',
                'important'
            );

            element.style.setProperty(
                'border-radius',
                '4px',
                'important'
            );

        }


        // -----------------------------------------------------
        // GRADIENT
        // -----------------------------------------------------

        const gradientCode =
            codes.find(
                function (code) {

                    return (
                        COLOR_KEYWORDS[code] &&
                        COLOR_KEYWORDS[code].type ===
                        'gradient'
                    );

                }
            );


        if (gradientCode) {

            element.style.setProperty(
                'background',
                COLOR_KEYWORDS[
                    gradientCode
                ].value,
                'important'
            );

            element.style.setProperty(
                'background-clip',
                'text',
                'important'
            );

            element.style.setProperty(
                '-webkit-background-clip',
                'text',
                'important'
            );

            element.style.setProperty(
                'color',
                'transparent',
                'important'
            );

            element.style.setProperty(
                '-webkit-text-fill-color',
                'transparent',
                'important'
            );

        }


        // -----------------------------------------------------
        // SHADOW
        // -----------------------------------------------------

        const shadowCode =
            codes.find(
                function (code) {

                    return (
                        COLOR_KEYWORDS[code] &&
                        COLOR_KEYWORDS[code].type ===
                        'shadow'
                    );

                }
            );


        if (shadowCode) {

            element.style.setProperty(
                'text-shadow',
                COLOR_KEYWORDS[
                    shadowCode
                ].value,
                'important'
            );

        }


        // -----------------------------------------------------
        // GLOW
        // -----------------------------------------------------

        const glowCode =
            codes.find(
                function (code) {

                    return (
                        COLOR_KEYWORDS[code] &&
                        COLOR_KEYWORDS[code].type ===
                        'glow'
                    );

                }
            );


        if (glowCode) {

            const glowColor =
                COLOR_KEYWORDS[
                    glowCode
                ].value;


            // Gradient থাকলে gradient-এর color নষ্ট করবে না
            if (!hasGradient) {

                if (!hasColor) {

                    element.style.setProperty(
                        'color',
                        glowColor,
                        'important'
                    );

                }

            }


            const existingShadow =
                element.style.textShadow;


            const glowShadow =
                '0 0 5px ' +
                glowColor +
                ', 0 0 10px ' +
                glowColor +
                ', 0 0 18px ' +
                glowColor;


            if (
                existingShadow &&
                existingShadow !== 'none'
            ) {

                element.style.setProperty(
                    'text-shadow',
                    existingShadow +
                    ', ' +
                    glowShadow,
                    'important'
                );

            } else {

                element.style.setProperty(
                    'text-shadow',
                    glowShadow,
                    'important'
                );

            }

        }

    }


    // =========================================================
    // FORMAT A SINGLE TEXT ELEMENT
    // =========================================================

    function formatElement(element) {

        if (!element) {
            return;
        }


        // Toolbar / Header কখনো পরিবর্তন করবে না
        if (
            isExcludedElement(element)
        ) {
            return;
        }


        const text =
            element.textContent || '';


        if (!text.includes('#')) {
            return;
        }


        const codes =
            getCodes(text);


        if (!codes.length) {
            return;
        }


        // -----------------------------------------------------
        // IMPORTANT:
        // শুধু direct text node-এর উপর নির্ভর করা হবে না।
        // Element-এর ভিতরের সব Text Node খোঁজা হবে।
        // -----------------------------------------------------

        const walker =
            document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node) {

                        if (
                            !node.nodeValue ||
                            !node.nodeValue.trim()
                        ) {

                            return NodeFilter.FILTER_REJECT;

                        }


                        if (
                            node.parentElement &&
                            isExcludedElement(
                                node.parentElement
                            )
                        ) {

                            return NodeFilter.FILTER_REJECT;

                        }


                        return NodeFilter.FILTER_ACCEPT;

                    }
                }
            );


        const textNodes = [];

        let currentNode;


        while (
            currentNode =
            walker.nextNode()
        ) {

            textNodes.push(
                currentNode
            );

        }


        // -----------------------------------------------------
        // FORMAT TEXT
        // -----------------------------------------------------

        textNodes.forEach(
            function (textNode) {

                const originalText =
                    textNode.nodeValue;


                const nodeCodes =
                    getCodes(
                        originalText
                    );


                if (!nodeCodes.length) {
                    return;
                }


                const cleaned =
                    cleanText(
                        originalText
                    );


                // ------------------------------------------------
                // যদি পুরো Text Node-এ একটি মাত্র Style থাকে
                // তাহলে একই element-এ style দেওয়া হবে।
                // ------------------------------------------------

                const parent =
                    textNode.parentElement;


                if (
                    parent &&
                    !isExcludedElement(parent)
                ) {

                    // Text clean করা
                    textNode.nodeValue =
                        cleaned;

                    // Style apply
                    applyStyles(
                        parent,
                        nodeCodes
                    );

                }

            }
        );

    }


    // =========================================================
    // REMOVE CODES EVERYWHERE FROM TOOLBAR
    // =========================================================

    function cleanToolbarCodes() {

        const toolbarSelectors = [

            'header',
            'nav',

            '.navbar',
            '.topbar',
            '.toolbar',
            '.header',

            '#toolbar',
            '#topbar',
            '#header',

            '#navToggleBtn'

        ];


        toolbarSelectors.forEach(
            function (selector) {

                document
                    .querySelectorAll(
                        selector
                    )
                    .forEach(
                        function (toolbar) {


                            const walker =
                                document.createTreeWalker(
                                    toolbar,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                    false
                                );


                            const nodes = [];

                            let node;


                            while (
                                node =
                                walker.nextNode()
                            ) {

                                nodes.push(
                                    node
                                );

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
        );

    }


    // =========================================================
    // MAIN FORMATTER
    // =========================================================

    function applyDynamicStyles() {


        // -----------------------------------------------------
        // সব সাধারণ content element
        // -----------------------------------------------------

        const elements =
            document.querySelectorAll(

                'h1, h2, h3, h4, h5, h6,' +

                'div, span, p, b, strong,' +

                'td, th, a, label,' +

                'li, small, em,' +

                '[data-category],' +

                '[data-subcategory],' +

                '[data-content],' +

                '[data-profile],' +

                '[data-data],' +

                '[data-color-text],' +

                '[class*="card"],' +

                '[class*="profile"],' +

                '[class*="category"],' +

                '[class*="data"]'

            );


        elements.forEach(
            function (element) {

                if (
                    isExcludedElement(
                        element
                    )
                ) {

                    return;

                }


                formatElement(
                    element
                );

            }
        );


        // -----------------------------------------------------
        // সর্বশেষে Toolbar clean
        // -----------------------------------------------------

        cleanToolbarCodes();

    }


    // =========================================================
    // MUTATION OBSERVER
    // =========================================================

    let observer = null;


    function startObserver() {

        if (
            observer ||
            !document.body
        ) {

            return;

        }


        observer =
            new MutationObserver(
                function (mutations) {

                    let changed = false;


                    for (
                        const mutation
                        of mutations
                    ) {

                        if (
                            mutation.type ===
                            'childList'
                        ) {

                            if (
                                mutation.addedNodes &&
                                mutation.addedNodes.length
                            ) {

                                changed = true;
                                break;

                            }

                        }


                        if (
                            mutation.type ===
                            'characterData'
                        ) {

                            changed = true;
                            break;

                        }

                    }


                    if (changed) {

                        // ছোট delay দিলে Firebase DOM
                        // update-এর পর ঠিকভাবে কাজ করবে

                        setTimeout(
                            applyDynamicStyles,
                            10
                        );

                    }

                }
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


    // =========================================================
    // INITIALIZE
    // =========================================================

    function initialize() {

        applyDynamicStyles();

        startObserver();


        setTimeout(
            applyDynamicStyles,
            300
        );


        setTimeout(
            applyDynamicStyles,
            800
        );


        setTimeout(
            applyDynamicStyles,
            1500
        );


        setTimeout(
            applyDynamicStyles,
            3000
        );

    }


    // =========================================================
    // DOM READY
    // =========================================================

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initialize
        );

    } else {

        initialize();

    }


    // =========================================================
    // WINDOW LOAD
    // =========================================================

    window.addEventListener(
        'load',
        function () {

            applyDynamicStyles();

        }
    );


    // =========================================================
    // GLOBAL FUNCTION
    // =========================================================

    window.applyFirebaseTextColors =
        applyDynamicStyles;


})();
