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
        const allElements = document.querySelectorAll('span, p, div, b, strong, td, th');

        allElements.forEach(el => {
            // ১. যদি এটি টুলবার, হেডার বা ওপরের নেভিগেশন বার হয়, তবে সেটিকে সরাসরি স্কিপ করবে
            if (el.closest('header, nav, .toolbar, .navbar, [class*="toolbar"], [class*="header"], [id*="toolbar"], [id*="header"]')) {
                return;
            }

            if (el.children.length === 0 && el.textContent) {
                let text = el.textContent;

                for (const key in COLOR_KEYWORDS) {
                    if (text.includes(key)) {
                        let config = COLOR_KEYWORDS[key];
                        
                        // হ্যাশট্যাগ রিমোভ করে টেক্সট পরিষ্কার করা এবং লাল করা
                        el.textContent = text.replace(key, '').trim();
                        el.dataset.styledProcessed = "true";

                        if (config.type === 'text') {
                            el.style.color = config.color;
                            el.style.fontWeight = 'bold';
                        } else if (config.type === 'underline') {
                            el.style.borderBottom = config.borderBottom;
                        } else if (config.type === 'gradient') {
                            el.style.background = config.background;
                            el.style.color = config.color;
                        }
                        break;
                    }
                }
            }
        });
    }

    const observer = new MutationObserver(() => {
        applyDynamicStyles();
    });

    document.addEventListener("DOMContentLoaded", () => {
        applyDynamicStyles();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    setTimeout(applyDynamicStyles, 400);
})();
