/**
 * Color & Design Formatter for Firebase Data
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
        // প্রজেক্টের শুধুমাত্র ডাটা কার্ড বা কনটেন্ট এরিয়ার এলিমেন্টগুলো টার্গেট করা
        // টুলবার, ন্যাভবার, ক্যাটাগরি বা হেডার এরিয়া বাদ দেওয়া হয়েছে যাতে সেগুলোর কালার পরিবর্তন না হয়
        const contentElements = document.querySelectorAll('.data-card-item, .data-card, .card, .info-content, p, span, div, b, strong, td, th');

        contentElements.forEach(el => {
            // যদি এলিমেন্টটি টুলবার বা ক্যাটাগরি নেভিগেশনের অংশ হয়, তবে স্কিপ করবে
            if (el.closest('header, nav, .toolbar, .navbar, .category-bar, .sub-category, [class*="toolbar"], [class*="navbar"], [class*="category"], [class*="header"]')) {
                return;
            }

            // শুধুমাত্র সরাসরি টেক্সট ধারণকারী এলিমেন্টগুলোর ওপর কাজ করবে
            if (el.children.length === 0 && el.textContent) {
                let originalText = el.textContent;

                for (const key in COLOR_KEYWORDS) {
                    if (originalText.includes(key)) {
                        let config = COLOR_KEYWORDS[key];
                        
                        // ১. কোডটি বা কি-ওয়ার্ডটি স্ক্রিন থেকে সম্পূর্ণ মুছে ফেলা (হাইড করা)
                        let cleanText = originalText.replace(key, '').trim();
                        el.textContent = cleanText;
                        el.dataset.styledProcessed = "true";

                        // ২. সুনির্দিষ্ট কালার বা ডিজাইন অ্যাপ্লাই করা
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

    // ফায়ারবেজ থেকে ডাটা লোড বা পরিবর্তন হওয়ার সময় ডাইনামিক্যালি কাজ করার জন্য
    const observer = new MutationObserver(() => {
        applyDynamicStyles();
    });

    document.addEventListener("DOMContentLoaded", () => {
        applyDynamicStyles();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // রেন্ডারিং নিশ্চিত করতে টাইমার ব্যবহার
    setTimeout(applyDynamicStyles, 400);
    setTimeout(applyDynamicStyles, 900);
})();
