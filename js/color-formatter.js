/**
 * Color & Design Formatter for Firebase Data
 * Path: Js/color-formatter.js
 *
 * Features:
 * 1. Category / Sub-category / Data text-এর Color Code কাজ করবে
 * 2. #red, #blue ইত্যাদি মূল text থেকে hide হবে
 * 3. Toolbar-এর নিজের color/style পরিবর্তন হবে না
 * 4. Toolbar-এ Color Code থাকলে শুধু Code hide হবে
 * 5. Firebase dynamic content-এর সাথেও কাজ করবে
 */

(function () {

    'use strict';


    // =========================================================
    // COLOR KEYWORDS
    // =========================================================

    const COLOR_KEYWORDS = {

        '#red': {
            color: '#ef4444',
            type: 'text'
        },

        '#blue': {
            color: '#2563eb',
            type: 'text'
        },

        '#green': {
            color: '#10b981',
            type: 'text'
        },

        '#yellow': {
            color: '#f59e0b',
            type: 'text'
        },

        '#purple': {
            color: '#8b5cf6',
            type: 'text'
        },

        '#pink': {
            color: '#ec4899',
            type: 'text'
        },

        '#underline_gold': {
            borderBottom: '2px solid #f59e0b',
            type: 'underline'
        },

        '#grad_ocean': {
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: '#fff',
            type: 'gradient'
        }

    };


    // =========================================================
    // TOOLBAR / HEADER EXCLUDE LIST
    //
    // এগুলোর কোনো Color / Background / Design পরিবর্তন করা হবে না
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
    // কোনো Element Toolbar/Header-এর ভিতরে আছে কি না
    // =========================================================

    function isExcludedElement(el) {

        if (!el || !(el instanceof Element)) {
            return true;
        }


        // নিজে excluded কি না
        for (const selector of EXCLUDED_SELECTORS) {

            try {

                if (el.matches(selector)) {
                    return true;
                }

            } catch (e) {}

        }


        // Parent / Ancestor excluded কি না
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
    // Color Code escape করার জন্য
    // =========================================================

    function escapeRegExp(string) {

        return string.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );

    }


    // =========================================================
    // TEXT থেকে Color Code সরানো
    // =========================================================

    function removeColorCodes(text) {

        if (!text) {
            return text;
        }


        Object.keys(COLOR_KEYWORDS).forEach(function (key) {

            const escapedKey = escapeRegExp(key);

            const regex = new RegExp(
                escapedKey,
                'gi'
            );

            text = text.replace(regex, '');

        });


        return text;

    }


    // =========================================================
    // CATEGORY / SUB-CATEGORY / DATA-এর Color Apply
    // =========================================================

    function applyColorToElement(el) {

        if (!el) {
            return;
        }


        // Toolbar / Navbar হলে কোনোভাবেই Color Apply করবে না
        if (isExcludedElement(el)) {
            return;
        }


        // আগে process করা হলে আবার process করবে না
        if (
            el.dataset &&
            el.dataset.colorFormatterProcessed === 'true'
        ) {

            return;

        }


        // Child element থাকলে parent-এর text পরিবর্তন করা যাবে না
        if (el.childNodes.length !== 1) {
            return;
        }


        const node = el.childNodes[0];


        // শুধু Text Node-এর ক্ষেত্রে কাজ করবে
        if (
            !node ||
            node.nodeType !== Node.TEXT_NODE
        ) {

            return;

        }


        let text = node.textContent || '';


        if (!text.trim()) {
            return;
        }


        let foundKeyword = null;
        let config = null;


        // =====================================================
        // Color Code খুঁজে বের করা
        // =====================================================

        for (const key in COLOR_KEYWORDS) {

            if (text.toLowerCase().includes(
                key.toLowerCase()
            )) {

                foundKeyword = key;
                config = COLOR_KEYWORDS[key];

                break;

            }

        }


        // Color Code নেই
        if (!foundKeyword) {
            return;
        }


        // =====================================================
        // Color Code HIDE
        // =====================================================

        const cleanText = text
            .replace(
                new RegExp(
                    escapeRegExp(foundKeyword),
                    'gi'
                ),
                ''
            )
            .trim();


        node.textContent = cleanText;


        // =====================================================
        // TEXT COLOR
        // =====================================================

        if (config.type === 'text') {

            el.style.color = config.color;

            el.style.fontWeight = 'bold';

        }


        // =====================================================
        // UNDERLINE
        // =====================================================

        else if (config.type === 'underline') {

            el.style.borderBottom =
                config.borderBottom;

            el.style.paddingBottom = '2px';

        }


        // =====================================================
        // GRADIENT
        // =====================================================

        else if (config.type === 'gradient') {

            el.style.background =
                config.background;

            el.style.color =
                config.color;

        }


        // =====================================================
        // Processed Mark
        // =====================================================

        if (el.dataset) {

            el.dataset.colorFormatterProcessed =
                'true';

        }

    }


    // =========================================================
    // TOOLBAR থেকে শুধু Color Code HIDE
    //
    // গুরুত্বপূর্ণ:
    // এখানে কোনো CSS Color / Background পরিবর্তন করা হয় না।
    // শুধু #red/#blue ইত্যাদি text থেকে সরানো হয়।
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


        toolbarSelectors.forEach(function (selector) {

            document
                .querySelectorAll(selector)
                .forEach(function (toolbar) {


                    // Toolbar-এর ভিতরের Text Node খুঁজবে

                    const walker =
                        document.createTreeWalker(

                            toolbar,

                            NodeFilter.SHOW_TEXT,

                            null,

                            false

                        );


                    const textNodes = [];

                    let node;


                    while (
                        node = walker.nextNode()
                    ) {

                        textNodes.push(node);

                    }


                    // প্রতিটি Text Node থেকে
                    // শুধু Color Code remove করবে

                    textNodes.forEach(function (textNode) {

                        let text =
                            textNode.nodeValue;


                        if (!text) {
                            return;
                        }


                        const newText =
                            removeColorCodes(text);


                        if (newText !== text) {

                            textNode.nodeValue =
                                newText;

                        }

                    });

                });

        });

    }


    // =========================================================
    // MAIN COLOR FORMATTER
    // =========================================================

    function applyDynamicStyles() {


        // =====================================================
        // Category / Sub-category / Data-এর জন্য Elements
        // =====================================================

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


        elements.forEach(function (el) {

            applyColorToElement(el);

        });


        // =====================================================
        // Toolbar-এ Color Code থাকলে শুধু Hide করবে
        // =====================================================

        hideColorCodesFromToolbar();

    }


    // =========================================================
    // MUTATION OBSERVER
    //
    // Firebase থেকে নতুন Data / Category আসলে
    // formatter আবার কাজ করবে।
    // =========================================================

    let observerStarted = false;


    function startObserver() {


        if (observerStarted) {
            return;
        }


        if (!document.body) {
            return;
        }


        observerStarted = true;


        const observer =
            new MutationObserver(function (mutations) {


                let shouldProcess = false;


                mutations.forEach(function (mutation) {

                    if (
                        mutation.type === 'childList' &&
                        mutation.addedNodes.length > 0
                    ) {

                        shouldProcess = true;

                    }

                });


                if (shouldProcess) {

                    applyDynamicStyles();

                }

            });


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


        // প্রথমবার
        applyDynamicStyles();


        // Observer চালু
        startObserver();


        // Firebase / Dynamic UI render হওয়ার পর
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
    //
    // অন্য JavaScript থেকে প্রয়োজন হলে:
    // window.applyFirebaseTextColors();
    // =========================================================

    window.applyFirebaseTextColors =
        applyDynamicStyles;


})();
