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
        // পেজের সব টেক্সট নোড স্ক্যান করবে, তবে টুলবার বা হেডার বাদে
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;

        while (node = walker.nextNode()) {
            let text = node.nodeValue;
            if (!text) continue;

            // চেক করা হচ্ছে টেক্সটে কোনো কালার কোড আছে কি না
            for (const key in COLOR_KEYWORDS) {
                if (text.includes(key)) {
                    let parentElement = node.parentElement;
                    if (!parentElement) continue;

                    // টুলবার, ন্যাভবার বা হেডার এরিয়া হলে সেটিকে স্কিপ করবে (সুরক্ষিত রাখবে)
                    if (parentElement.closest('header, nav, .toolbar, .navbar, [class*="toolbar"], [class*="header"]')) {
                        continue;
                    }

                    if (parentElement.dataset.styledProcessed) continue;
                    parentElement.dataset.styledProcessed = "true";

                    // হ্যাশট্যাগ রিমোভ করে টেক্সট পরিচ্ছন্ন করা
                    let cleanHtml = parentElement.innerHTML.replace(key, '').trim();
                    parentElement.innerHTML = cleanHtml;

                    // কালার বা ডিজাইন অ্যাপ্লাই করা
                    let config = COLOR_KEYWORDS[key];
                    if (config.type === 'text') {
                        parentElement.style.color = config.color;
                        parentElement.style.fontWeight = 'bold';
                    } else if (config.type === 'underline') {
                        parentElement.style.borderBottom = config.borderBottom;
                    } else if (config.type === 'gradient') {
                        parentElement.style.background = config.background;
                        parentElement.style.color = config.color;
                    }
                }
            }
        }
    }

    // DOM লোড বা পরিবর্তন হলে স্বয়ংক্রিয়ভাবে রান করবে
    const observer = new MutationObserver(() => {
        applyDynamicStyles();
    });

    document.addEventListener("DOMContentLoaded", () => {
        applyDynamicStyles();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    setTimeout(applyDynamicStyles, 600);
})();
