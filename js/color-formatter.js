/**
 * Color & Design Formatter for Firebase Data
 * Path: Js/color-formatter.js
 */

(function () {
    'use strict';

    // কালার এবং ডিজাইন প্যাটার্ন ম্যাপিং
    const COLOR_KEYWORDS = {
        // সিঙ্গেল কালার
        '#red': { color: '#ef4444', type: 'text' },
        '#blue': { color: '#2563eb', type: 'text' },
        '#green': { color: '#10b981', type: 'text' },
        '#yellow': { color: '#f59e0b', type: 'text' },
        '#purple': { color: '#8b5cf6', type: 'text' },
        '#pink': { color: '#ec4899', type: 'text' },

        // আন্ডারলাইন ডিজাইন
        '#underline_red': { borderBottom: '2px solid #ef4444', type: 'underline' },
        '#underline_blue': { borderBottom: '2px solid #2563eb', type: 'underline' },
        '#underline_gold': { borderBottom: '2px solid #f59e0b', type: 'underline' },

        // গ্রেডিয়েন্ট ডিজাইন (ব্যাকগ্রাউন্ড বা টেক্সট গ্রেডিয়েন্ট)
        '#grad_sunset': { background: 'linear-gradient(135deg, #f97316, #ef4444)', color: '#fff', type: 'gradient' },
        '#grad_ocean': { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', type: 'gradient' },
        '#grad_emerald': { background: 'linear-gradient(135deg, #10b981, #047857)', color: '#fff', type: 'gradient' },
        '#grad_royal': { background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', type: 'gradient' }
    };

    function applyDynamicStyles() {
        // ডাটা কার্ড এবং ডিটেইলস ভিউয়ের টেক্সটগুলো স্ক্যান করা
        const targetElements = document.querySelectorAll('.data-card-name, .data-card-detail, .info-value, .header-banner span');

        targetElements.forEach(el => {
            if (el.dataset.styledProcessed) return;

            let originalText = el.innerHTML;
            let matchedKey = null;
            let styleConfig = null;

            // টেক্সটের মধ্যে কালার কোড খোঁজা (যেমন: #red, #grad_ocean ইত্যাদি)
            for (const key in COLOR_KEYWORDS) {
                if (originalText.includes(key)) {
                    matchedKey = key;
                    styleConfig = COLOR_KEYWORDS[key];
                    break;
                }
            }

            if (matchedKey && styleConfig) {
                // টেক্সট থেকে কালার কোড ট্যাগটি রিমোভ করে পরিচ্ছন্ন করা
                el.innerHTML = originalText.replace(matchedKey, '').trim();
                el.dataset.styledProcessed = "true";

                // ডিজাইন অ্যাপ্লাই করা
                if (styleConfig.type === 'text') {
                    el.style.color = styleConfig.color;
                    el.style.fontWeight = 'bold';
                } else if (styleConfig.type === 'underline') {
                    el.style.borderBottom = styleConfig.borderBottom;
                    el.style.paddingBottom = '2px';
                } else if (styleConfig.type === 'gradient') {
                    const cardParent = el.closest('.data-card-item, .header-banner');
                    if (cardParent) {
                        cardParent.style.background = styleConfig.background;
                        cardParent.style.color = styleConfig.color;
                        // ভেতরের টেক্সটের কালার অ্যাডজাস্ট করা
                        cardParent.querySelectorAll('div, span').forEach(inner => {
                            inner.style.color = styleConfig.color;
                        });
                    }
                }
            }
        });
    }

    // DOM পরিবর্তন লক্ষ্য করার জন্য MutationObserver ব্যবহার করা হলো
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                shouldProcess = shouldProcess || true;
            }
        });
        if (shouldProcess) {
            setTimeout(applyDynamicStyles, 50);
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        applyDynamicStyles();
        observer.observe(document.body, { childList: true, subtree: true });
    });

})();
