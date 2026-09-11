/**
 * Color & Design Formatter for Firebase Data
 * Path: js/color-formatter.js
 */

(function () {
    'use strict';

    const COLOR_KEYWORDS = {
        '#red': { color: '#ef4444', type: 'text' },
        '#blue': { color: '#2563eb', type: 'text' },
        '#green': { color: '#10b981', type: 'text' },
        '#yellow': { color: '#f59e0b', type: 'text' },
        '#purple': { color: '#8b5cf6', type: 'text' },
        '#pink': { color: '#ec4899', type: 'text' },
        '#underline_gold': { borderBottom: '2px solid #f59e0b', type: 'underline' },
        '#grad_ocean': { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', type: 'gradient' }
    };

    function applyDynamicStyles() {
        // প্রজেক্টের মেইন ডাটা কার্ড বা লিস্ট আইটেমগুলো টার্গেট করা (টুলবার বাদ দিয়ে)
        const targetElements = document.querySelectorAll('.data-card-item, .data-card-name, .data-card-detail, .info-value');

        targetElements.forEach(el => {
            if (el.dataset.styledProcessed) return;

            let originalHTML = el.innerHTML;
            let matchedKey = null;
            let styleConfig = null;

            // কালার কি-ওয়ার্ড খোঁজা
            for (const key in COLOR_KEYWORDS) {
                if (originalHTML.includes(key)) {
                    matchedKey = key;
                    styleConfig = COLOR_KEYWORDS[key];
                    break;
                }
            }

            if (matchedKey && styleConfig) {
                // হ্যাশট্যাগ রিমোভ করে টেক্সট পরিষ্কার করা
                el.innerHTML = originalHTML.replace(matchedKey, '').trim();
                el.dataset.styledProcessed = "true";

                // ডিজাইন বা কালার অ্যাপ্লাই করা
                if (styleConfig.type === 'text') {
                    el.style.color = styleConfig.color;
                    el.style.fontWeight = 'bold';
                } else if (styleConfig.type === 'underline') {
                    el.style.borderBottom = styleConfig.borderBottom;
                    el.style.paddingBottom = '2px';
                } else if (styleConfig.type === 'gradient') {
                    el.style.background = styleConfig.background;
                    el.style.color = styleConfig.color;
                }
            }
        });
    }

    // DOM পরিবর্তন লক্ষ্য করার জন্য Observer
    const observer = new MutationObserver(() => {
        applyDynamicStyles();
    });

    document.addEventListener("DOMContentLoaded", () => {
        applyDynamicStyles();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    setTimeout(applyDynamicStyles, 500);
})();
