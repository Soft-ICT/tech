/**
 * Color & Design Formatter for Firebase Data
 * Path: js/color-formatter.js
 *
 * কাজ:
 * - শুধু Category / Sub-category / নির্দিষ্ট Content Text-এ color code কাজ করবে
 * - Toolbar / Navbar / Header-এর color পরিবর্তন করবে না
 * - #red, #blue ইত্যাদি কোড হাইড থাকবে
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
    // যেসব এলাকা থেকে COLOR FORMATTER সম্পূর্ণভাবে বাদ যাবে
    // =========================================================

    const EXCLUDED_SELECTORS = [
        'header',
        'nav',
        '.navbar',
        '.topbar',
        '.toolbar',
        '#toolbar',
        '#topbar',
        '.header',
        '#header',

        // আপনার অ্যাপের সম্ভাব্য Toolbar / Navigation
        '#navToggleBtn',
        '#menuIcon',
        '#backIcon',

        // সাধারণ Button / Control
        'button',
        'input',
        'textarea',
        'select',

        // Modal-এর control অংশ
        '.modal-header',
        '.modal-footer'
    ];


    // =========================================================
    // CHECK: এই element formatter-এর জন্য নিষিদ্ধ কি না
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

        // তার parent / ancestor excluded কি না
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
    // শুধু Content-এর জন্য formatter
    // =========================================================

    function applyColorToElement(el) {

        if (!el || isExcludedElement(el)) {
            return;
        }

        // আগে থেকেই process করা হলে আবার পরিবর্তন করবে না
        if (el.dataset.colorFormatterProcessed === "true") {
            return;
        }

        // Child element থাকলে parent-এর পুরো textContent পরিবর্তন করা যাবে না
        if (el.childNodes.length !== 1) {
            return;
        }

        const node = el.childNodes[0];

        // শুধু সরাসরি Text Node হলে কাজ করবে
        if (!node || node.nodeType !== Node.TEXT_NODE) {
            return;
        }

        let text = node.textContent || '';

        if (!text.trim()) {
            return;
        }

        let foundKeyword = null;
        let config = null;

        // Keyword খুঁজে বের করা
        for (const key in COLOR_KEYWORDS) {
            if (text.includes(key)) {
                foundKeyword = key;
                config = COLOR_KEYWORDS[key];
                break;
            }
        }

        // কোনো color code না থাকলে কিছু করবে না
        if (!foundKeyword) {
            return;
        }

        // =====================================================
        // COLOR CODE HIDE
        // =====================================================

        const cleanText = text
            .replace(foundKeyword, '')
            .trim();

        node.textContent = cleanText;


        // =====================================================
        // STYLE APPLY
        // =====================================================

        if (config.type === 'text') {

            el.style.color = config.color;
            el.style.fontWeight = 'bold';

        }

        else if (config.type === 'underline') {

            el.style.borderBottom = config.borderBottom;
            el.style.paddingBottom = '2px';

        }

        else if (config.type === 'gradient') {

            el.style.background = config.background;
            el.style.color = config.color;
        }


        // Processed mark
        el.dataset.colorFormatterProcessed = "true";
    }


    // =========================================================
    // CONTENT ELEMENT খুঁজে formatter চালানো
    // =========================================================

    function applyDynamicStyles() {

        // পুরো document-এর সব div/span পরিবর্তন না করে
        // Category / Content-এর সম্ভাব্য element-গুলো নেওয়া হচ্ছে।

        const elements = document.querySelectorAll(
            'h1, h2, h3, h4, h5, h6, ' +
            'span, p, b, strong, ' +
            'td, th, a, ' +
            '[data-category], ' +
            '[data-subcategory], ' +
            '[data-content], ' +
            '[data-color-text]'
        );

        elements.forEach(el => {
            applyColorToElement(el);
        });
    }


    // =========================================================
    // FIREBASE / DYNAMIC CONTENT OBSERVER
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

        const observer = new MutationObserver((mutations) => {

            let shouldProcess = false;

            mutations.forEach(mutation => {

                if (mutation.type === 'childList' &&
                    mutation.addedNodes.length > 0) {

                    shouldProcess = true;
                }
            });

            if (shouldProcess) {
                applyDynamicStyles();
            }
        });


        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }


    // =========================================================
    // INITIALIZE
    // =========================================================

    function initializeColorFormatter() {

        applyDynamicStyles();

        startObserver();

        // Firebase data একটু পরে render হলে
        setTimeout(applyDynamicStyles, 300);
        setTimeout(applyDynamicStyles, 800);
        setTimeout(applyDynamicStyles, 1500);
        setTimeout(applyDynamicStyles, 3000);
    }


    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initializeColorFormatter
        );

    } else {

        initializeColorFormatter();
    }


    window.addEventListener(
        'load',
        applyDynamicStyles
    );


    // অন্য JS থেকে চাইলে manually call করা যাবে
    window.applyFirebaseTextColors = applyDynamicStyles;

})();
