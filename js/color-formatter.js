/**
 * Color & Design Formatter for Firebase Data (Final Fix)
 * Path: Js/color-formatter.js
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
        // শুধুমাত্র প্রজেক্টের লিস্ট বা কার্ড এরিয়া টার্গেট করা (যাতে টুলবার বা হেডার পুরোপুরি নিরাপদ থাকে)
        const contentElements = document.querySelectorAll('.data-card-item, .card, .list-item, .content-area span, .content-area p, .data-card-name');

        // যদি সুনির্দিষ্ট ক্লাস না পাওয়া যায়, তবে সাধারণ টেক্সট এলিমেন্টগুলো স্ক্যান করবে তবে হেডার/টুলবার কঠোরভাবে বাদ রাখবে
        const targetNodes = contentElements.length > 0 ? contentElements : document.querySelectorAll('span, p, div, b, strong');

        targetNodes.forEach(el => {
            // অতি জরুরি ফিল্টার: টুলবার, হেডার, ন্যাভবার বা ব্যাক বাটন সংলগ্ন এলাকা হলে স্কিপ করবে
            if (el.closest('header, nav, .toolbar, .navbar, .header, [class*="toolbar"], [class*="header"], [class*="nav"], button')) {
                return;
            }

            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                let text = el.textContent;

                for (const key in COLOR_KEYWORDS) {
                    if (text.includes(key)) {
                        let config = COLOR_KEYWORDS[key];

                        // কোড হাইড করা এবং টেক্সট পরিষ্কার করা
                        let cleanText = text.replace(key, '').trim();
                        el.textContent = cleanText;
                        el.dataset.styledProcessed = "true";

                        // স্টাইল অ্যাপ্লাই করা
                        if (config.type === 'text') {
                            el.style.color = config.color;
                            el.style.fontWeight = 'bold';
                        } else if (config.type === 'underline') {
                            el.style.borderBottom = config.borderBottom;
                            el.style.paddingBottom = '2px';
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
    setTimeout(applyDynamicStyles, 1000);
})();
