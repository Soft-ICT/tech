/**
 * Advanced Color & Design Formatter for Firebase Data
 * Path: Js/color-formatter.js
 *
 * Features:
 * - Category / Sub-category / Data / Profile formatting
 * - Multiple codes in one text
 * - Toolbar color/style কখনো পরিবর্তন করবে না
 * - Toolbar থেকে সব formatting code hide করবে
 * - Firebase dynamic content support
 * - 30+ Color / Text / Highlight / Gradient / Glow effects
 */

(function () {

    'use strict';


    // =========================================================
    // COLOR + DESIGN KEYWORDS
    // =========================================================

    const COLOR_KEYWORDS = {

        // =====================================================
        // BASIC COLORS
        // =====================================================

        '#red': {
            type: 'text',
            color: '#ef4444'
        },

        '#blue': {
            type: 'text',
            color: '#2563eb'
        },

        '#green': {
            type: 'text',
            color: '#10b981'
        },

        '#yellow': {
            type: 'text',
            color: '#f59e0b'
        },

        '#purple': {
            type: 'text',
            color: '#8b5cf6'
        },

        '#pink': {
            type: 'text',
            color: '#ec4899'
        },

        '#orange': {
            type: 'text',
            color: '#f97316'
        },

        '#cyan': {
            type: 'text',
            color: '#06b6d4'
        },

        '#teal': {
            type: 'text',
            color: '#14b8a6'
        },

        '#indigo': {
            type: 'text',
            color: '#6366f1'
        },

        '#black': {
            type: 'text',
            color: '#111827'
        },

        '#white': {
            type: 'text',
            color: '#ffffff'
        },


        // =====================================================
        // TEXT STYLE
        // =====================================================

        '#bold': {
            type: 'bold'
        },

        '#italic': {
            type: 'italic'
        },

        '#underline': {
            type: 'underline',
            borderBottom: '2px solid currentColor'
        },

        '#underline_gold': {
            type: 'underline',
            borderBottom: '2px solid #f59e0b'
        },

        '#underline_red': {
            type: 'underline',
            borderBottom: '2px solid #ef4444'
        },

        '#underline_blue': {
            type: 'underline',
            borderBottom: '2px solid #2563eb'
        },

        '#strike': {
            type: 'strike'
        },


        // =====================================================
        // HIGHLIGHT / MARKING
        // =====================================================

        '#highlight': {
            type: 'highlight',
            background: '#fff3a3',
            color: '#111827'
        },

        '#highlight_blue': {
            type: 'highlight',
            background: '#bfdbfe',
            color: '#1e3a8a'
        },

        '#highlight_green': {
            type: 'highlight',
            background: '#bbf7d0',
            color: '#14532d'
        },

        '#highlight_red': {
            type: 'highlight',
            background: '#fecaca',
            color: '#7f1d1d'
        },

        '#highlight_purple': {
            type: 'highlight',
            background: '#ddd6fe',
            color: '#4c1d95'
        },

        '#highlight_pink': {
            type: 'highlight',
            background: '#fbcfe8',
            color: '#831843'
        },


        // =====================================================
        // GRADIENT TEXT
        // =====================================================

        '#grad_ocean': {
            type: 'gradient',
            background:
                'linear-gradient(135deg, #3b82f6, #06b6d4)'
        },

        '#grad_fire': {
            type: 'gradient',
            background:
                'linear-gradient(135deg, #ef4444, #f97316, #f59e0b)'
        },

        '#grad_purple': {
            type: 'gradient',
            background:
                'linear-gradient(135deg, #8b5cf6, #ec4899)'
        },

        '#grad_green': {
            type: 'gradient',
            background:
                'linear-gradient(135deg, #10b981, #22c55e)'
        },

        '#grad_sunset': {
            type: 'gradient',
            background:
                'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)'
        },

        '#grad_blue': {
            type: 'gradient',
            background:
                'linear-gradient(135deg, #1d4ed8, #60a5fa)'
        },


        // =====================================================
        // SHADOW
        // =====================================================

        '#shadow': {
            type: 'shadow',
            shadow:
                '2px 2px 4px rgba(0,0,0,0.35)'
        },

        '#shadow_dark': {
            type: 'shadow',
            shadow:
                '2px 3px 6px rgba(0,0,0,0.55)'
        },


        // =====================================================
        // GLOW
        // =====================================================

        '#glow_blue': {
            type: 'glow',
            color: '#2563eb'
        },

        '#glow_red': {
            type: 'glow',
            color: '#ef4444'
        },

        '#glow_green': {
            type: 'glow',
            color: '#10b981'
        },

        '#glow_purple': {
            type: 'glow',
            color: '#8b5cf6'
        },

        '#glow_cyan': {
            type: 'glow',
            color: '#06b6d4'
        }

    };


    // =========================================================
    // TOOLBAR / HEADER EXCLUDE LIST
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
    // CHECK EXCLUDED ELEMENT
    // =========================================================

    function isExcludedElement(el) {

        if (!el || !(el instanceof Element)) {
            return true;
        }


        for (const selector of EXCLUDED_SELECTORS) {

            try {

                if (el.matches(selector)) {
                    return true;
                }

            } catch (e) {}

        }


        for (const selector of EXCLUDED_SELECTORS) {

            try {

                if (el.closest(selector)) {
                    return true;
                }

            } catch (e) {}

        }


        return false;
    }


    // =========================================================
    // ESCAPE REGEX
    // =========================================================

    function escapeRegExp(string) {

        return string.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );

    }


    // =========================================================
    // REMOVE ALL CODES FROM TEXT
    // =========================================================

    function removeColorCodes(text) {

        if (!text) {
            return text;
        }


        Object.keys(COLOR_KEYWORDS).forEach(
            function (key) {

                const regex =
                    new RegExp(
                        escapeRegExp(key),
                        'gi'
                    );

                text =
                    text.replace(
                        regex,
                        ''
                    );

            }
        );


        return text;
    }


    // =========================================================
    // APPLY SINGLE STYLE
    // =========================================================

    function applySingleStyle(
        el,
        config
    ) {


        // -----------------------------------------------------
        // BASIC COLOR
        // -----------------------------------------------------

        if (config.type === 'text') {

            el.style.color =
                config.color;

            el.style.fontWeight =
                'bold';

        }


        // -----------------------------------------------------
        // BOLD
        // -----------------------------------------------------

        else if (
            config.type === 'bold'
        ) {

            el.style.fontWeight =
                '700';

        }


        // -----------------------------------------------------
        // ITALIC
        // -----------------------------------------------------

        else if (
            config.type === 'italic'
        ) {

            el.style.fontStyle =
                'italic';

        }


        // -----------------------------------------------------
        // UNDERLINE
        // -----------------------------------------------------

        else if (
            config.type === 'underline'
        ) {

            el.style.borderBottom =
                config.borderBottom;

            el.style.paddingBottom =
                '2px';

        }


        // -----------------------------------------------------
        // STRIKE
        // -----------------------------------------------------

        else if (
            config.type === 'strike'
        ) {

            el.style.textDecoration =
                'line-through';

        }


        // -----------------------------------------------------
        // HIGHLIGHT
        // -----------------------------------------------------

        else if (
            config.type === 'highlight'
        ) {

            el.style.background =
                config.background;

            el.style.color =
                config.color;

            el.style.padding =
                '2px 6px';

            el.style.borderRadius =
                '4px';

        }


        // -----------------------------------------------------
        // GRADIENT
        // -----------------------------------------------------

        else if (
            config.type === 'gradient'
        ) {

            el.style.background =
                config.background;

            el.style.webkitBackgroundClip =
                'text';

            el.style.backgroundClip =
                'text';

            el.style.webkitTextFillColor =
                'transparent';

            el.style.color =
                'transparent';

            el.style.fontWeight =
                '700';

        }


        // -----------------------------------------------------
        // SHADOW
        // -----------------------------------------------------

        else if (
            config.type === 'shadow'
        ) {

            el.style.textShadow =
                config.shadow;

        }


        // -----------------------------------------------------
        // GLOW
        // -----------------------------------------------------

        else if (
            config.type === 'glow'
        ) {

            el.style.color =
                config.color;

            el.style.textShadow =
                '0 0 5px ' +
                config.color +
                ', 0 0 10px ' +
                config.color +
                ', 0 0 18px ' +
                config.color;

        }

    }


    // =========================================================
    // APPLY MULTIPLE CODES
    // =========================================================

    function applyColorToElement(el) {

        if (!el) {
            return;
        }


        // Toolbar / Header-এ formatting নিষিদ্ধ
        if (
            isExcludedElement(el)
        ) {

            return;
        }


        // আগেই process হলে আবার করবে না
        if (
            el.dataset &&
            el.dataset.colorFormatterProcessed ===
            'true'
        ) {

            return;
        }


        // সরাসরি একটি Text Node হতে হবে
        if (
            el.childNodes.length !== 1
        ) {

            return;
        }


        const node =
            el.childNodes[0];


        if (
            !node ||
            node.nodeType !== Node.TEXT_NODE
        ) {

            return;
        }


        let text =
            node.textContent || '';


        if (!text.trim()) {
            return;
        }


        // =====================================================
        // FIND ALL CODES
        // =====================================================

        const foundCodes = [];


        Object.keys(
            COLOR_KEYWORDS
        ).forEach(
            function (key) {

                const regex =
                    new RegExp(
                        escapeRegExp(key),
                        'i'
                    );


                if (
                    regex.test(text)
                ) {

                    foundCodes.push(
                        key
                    );

                }

            }
        );


        // কোনো Code নেই
        if (
            foundCodes.length === 0
        ) {

            return;
        }


        // =====================================================
        // REMOVE ALL CODES
        // =====================================================

        let cleanText =
            text;


        foundCodes.forEach(
            function (key) {

                cleanText =
                    cleanText.replace(
                        new RegExp(
                            escapeRegExp(key),
                            'gi'
                        ),
                        ''
                    );

            }
        );


        cleanText =
            cleanText.trim();


        node.textContent =
            cleanText;


        // =====================================================
        // APPLY EVERY STYLE
        // =====================================================

        foundCodes.forEach(
            function (key) {

                const config =
                    COLOR_KEYWORDS[key];

                if (config) {

                    applySingleStyle(
                        el,
                        config
                    );

                }

            }
        );


        // =====================================================
        // MARK PROCESSED
        // =====================================================

        if (el.dataset) {

            el.dataset.colorFormatterProcessed =
                'true';

        }

    }


    // =========================================================
    // TOOLBAR CODE HIDER
    //
    // কোনো CSS পরিবর্তন করবে না।
    // শুধু #red/#bold/#gradient ইত্যাদি সরাবে।
    // =========================================================

    function hideColorCodesFromToolbar() {


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


                            const textNodes =
                                [];


                            let node;


                            while (
                                node =
                                walker.nextNode()
                            ) {

                                textNodes.push(
                                    node
                                );

                            }


                            textNodes.forEach(
                                function (textNode) {


                                    let text =
                                        textNode.nodeValue;


                                    if (!text) {
                                        return;
                                    }


                                    const newText =
                                        removeColorCodes(
                                            text
                                        );


                                    if (
                                        newText !==
                                        text
                                    ) {

                                        textNode.nodeValue =
                                            newText;

                                    }

                                }
                            );

                        }
                    );

            }
        );

    }


    // =========================================================
    // MAIN FUNCTION
    // =========================================================

    function applyDynamicStyles() {


        // -----------------------------------------------------
        // Content Elements
        // -----------------------------------------------------

        const elements =
            document.querySelectorAll(

                'h1, h2, h3, h4, h5, h6, ' +

                'span, p, b, strong, ' +

                'td, th, a, ' +

                '[data-category], ' +

                '[data-subcategory], ' +

                '[data-content], ' +

                '[data-color-text]'

            );


        elements.forEach(
            function (el) {

                applyColorToElement(
                    el
                );

            }
        );


        // -----------------------------------------------------
        // Toolbar থেকে সব Code Hide
        // -----------------------------------------------------

        hideColorCodesFromToolbar();

    }


    // =========================================================
    // MUTATION OBSERVER
    // =========================================================

    let observerStarted =
        false;


    function startObserver() {


        if (
            observerStarted
        ) {

            return;
        }


        if (
            !document.body
        ) {

            return;
        }


        observerStarted =
            true;


        const observer =
            new MutationObserver(
                function (mutations) {


                    let shouldProcess =
                        false;


                    mutations.forEach(
                        function (mutation) {

                            if (
                                mutation.type ===
                                'childList' &&

                                mutation.addedNodes.length >
                                0
                            ) {

                                shouldProcess =
                                    true;

                            }

                        }
                    );


                    if (
                        shouldProcess
                    ) {

                        applyDynamicStyles();

                    }

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


    // =========================================================
    // INITIALIZE
    // =========================================================

    function initializeColorFormatter() {


        applyDynamicStyles();


        startObserver();


        // Firebase / Dynamic Content
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
            initializeColorFormatter
        );

    } else {

        initializeColorFormatter();

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
