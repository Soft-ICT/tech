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
        // পেজের সমস্ত এলিমেন্ট চেক করা (যেগুলোতে টেক্সট আছে)
        const allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, span, p, div, a, b, strong, td, th');

        allElements.forEach(el => {
            // যদি ভেতরের কোনো চাইল্ড এলিমেন্ট না থাকে (শুধু সরাসরি টেক্সট থাকে)
            if (el.children.length === 0 && el.textContent) {
                let text = el.textContent;

                for (const key in COLOR_KEYWORDS) {
                    if (text.includes(key)) {
                        // টুলবার বা হেডার এরিয়া যদি বাঁচাতে চান, তবে নিচের কন্ডিশনটি রাখতে পারেন। 
                        // তবে টাইটেল বা হেডার লাল করতে চাইলে এই প্রটেকশন হটিয়ে দেওয়া ভালো। 
                        // যেহেতু আপনি কমান্ড্যান্ট লেখাটি কালার করতে চাচ্ছেন, তাই এটি হেডার হলেও কাজ করবে।

                        let config = COLOR_KEYWORDS[key];
                        
                        // টেক্সট থেকে কি-ওয়ার্ড রিমোভ করে পরিচ্ছন্ন করা
                        el.textContent = text.replace(key, '').trim();
                        el.dataset.styledProcessed = "true";

                        // স্টাইল অ্যাপ্লাই করা
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

    // DOM পরিবর্তন বা পেজ লোড হওয়ার সাথে সাথে রান করার জন্য
    const observer = new MutationObserver(() => {
        applyDynamicStyles();
    });

    document.addEventListener("DOMContentLoaded", () => {
        applyDynamicStyles();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // ডাইনামিক রেন্ডারিংয়ের জন্য অতিরিক্ত টাইমার
    setTimeout(applyDynamicStyles, 300);
    setTimeout(applyDynamicStyles, 800);
})();
