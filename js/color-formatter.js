/**
 * Color & Design Formatter for Firebase Data (100% Working)
 * Path: Js/color-formatter.js
 */

(function () {
    'use strict';

    // কালার এবং ডিজাইন প্যাটার্ন
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
        // পেজের হেডার, ন্যাভবার বা টুলবারের মূল ব্যাকগ্রাউন্ড বা স্টাইল যেন নষ্ট না হয়,
        // কিন্তু সেগুলোর ভেতরের টেক্সট বা টাইটেল যদি কালার কোড থাকে তা যেন কাজ করে।
        const allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, span, p, div, b, strong, td, th, a');

        allElements.forEach(el => {
            // যদি এলিমেন্টের ভেতরে চাইল্ড ট্যাগ না থাকে এবং টেক্সট থাকে
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                let text = el.textContent;

                for (const key in COLOR_KEYWORDS) {
                    if (text.includes(key)) {
                        let config = COLOR_KEYWORDS[key];

                        // ১. টেক্সট থেকে কালার কোডটি সম্পূর্ণ রিমোভ বা হাইড করে ফেলা
                        let cleanText = text.replace(key, '').trim();
                        el.textContent = cleanText;
                        el.dataset.styledProcessed = "true";

                        // ২. কাঙ্ক্ষিত কালার বা স্টাইল অ্যাপ্লাই করা
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

    // ফায়ারবেজ থেকে ডাটা লোড বা পেজ পরিবর্তন হলে রিয়েল-টাইমে কাজ করার জন্য
    const observer = new MutationObserver(() => {
        applyDynamicStyles();
    });

    document.addEventListener("DOMContentLoaded", () => {
        applyDynamicStyles();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // পেজ রেন্ডারিংয়ের বিভিন্ন মুহূর্তে যেন কোডটি মিস না হয়
    window.addEventListener('load', applyDynamicStyles);
    setTimeout(applyDynamicStyles, 300);
    setTimeout(applyDynamicStyles, 800);
    setTimeout(applyDynamicStyles, 1500);
})();
