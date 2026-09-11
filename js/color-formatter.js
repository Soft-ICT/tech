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
        // প্রজেক্টের যেকোনো টেক্সট এলিমেন্ট বা কার্ডের ভেতরের লেখা স্ক্যান করার জন্য
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;

        while (node = walker.nextNode()) {
            let text = node.nodeValue;
            if (!text) continue;

            for (const key in COLOR_KEYWORDS) {
                if (text.includes(key)) {
                    // এলিমেন্টটিকে ফাদার ট্যাগ সহ খুঁজে বের করা
                    let parentElement = node.parentElement;
                    if (parentElement && !parentElement.dataset.styledProcessed) {
                        parentElement.dataset.styledProcessed = "true";
                        
                        // পুরো টেক্সট থেকে হ্যাশট্যাগ রিমোভ করা
                        let cleanHtml = parentElement.innerHTML.replace(key, '').trim();
                        parentElement.innerHTML = cleanHtml;

                        // কালার বা স্টাইল অ্যাপ্লাই করা
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
    }

    // পেজে ডাটা লোড হওয়ার পর এবং পরিবর্তন হলে রান করবে
    const observer = new MutationObserver(() => {
        applyDynamicStyles();
    });

    document.addEventListener("DOMContentLoaded", () => {
        applyDynamicStyles();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // অতিরিক্ত সুরক্ষার জন্য সামান্য সময় পর পর চেক করা
    setTimeout(applyDynamicස්ටাইল, 500);
})();
