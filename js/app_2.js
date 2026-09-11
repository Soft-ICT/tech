// ডিফল্ট কালার প্যালেট বা ইউজার কাস্টম কালার সেভ করার ফাংশন
const AppThemeManager = {
    // কালার পরিবর্তন এবং অ্যাপ্লাই করার মূল ফাংশন
    applyTheme(colors) {
        // colors অবজেক্টে থাকবে: header, category, subCategory, dataProfile, homeNotice, scrollingNotice ইত্যাদি
        
        // ১. হেডার কালার পরিবর্তন
        const headerEl = document.querySelector('header, .app-header');
        if (headerEl && colors.header) {
            headerEl.style.backgroundColor = colors.header;
        }

        // ২. ক্যাটাগরি সেকশন কালার পরিবর্তন
        document.querySelectorAll('.category-item, .category-card').forEach(el => {
            if (colors.category) el.style.backgroundColor = colors.category;
        });

        // ৩. সাব-ক্যাটাগরি কালার পরিবর্তন
        document.querySelectorAll('.sub-category-item, .sub-cat-card').forEach(el => {
            if (colors.subCategory) el.style.backgroundColor = colors.subCategory;
        });

        // ৪. ডাটা প্রোফাইল কার্ড বা সেকশন কালার পরিবর্তন
        document.querySelectorAll('.data-profile, .profile-card').forEach(el => {
            if (colors.dataProfile) el.style.backgroundColor = colors.dataProfile;
        });

        // ৫. হোম নোটিশ সেকশন কালার পরিবর্তন
        const homeNoticeEl = document.querySelector('.home-notice, .notice-box');
        if (homeNoticeEl && colors.homeNotice) {
            homeNoticeEl.style.backgroundColor = colors.homeNotice;
        }

        // ৬. স্লাইডিং বা স্ক্রোলিং নোটিশ কালার পরিবর্তন (Marquee বা Scrolling Text)
        const scrollingNoticeEl = document.querySelector('.scrolling-notice, marquee, .ticker-wrap');
        if (scrollingNoticeEl && colors.scrollingNotice) {
            scrollingNoticeEl.style.backgroundColor = colors.scrollingNotice;
        }

        // লোকাল স্টোরেজে কালারগুলো সেভ করে রাখা
        localStorage.setItem('app_custom_colors', JSON.stringify(colors));
    },

    // সেভ করা কালার লোড করার ফাংশন (অ্যাপ স্টার্ট হওয়ার সময় কল করতে হবে)
    loadSavedTheme() {
        const savedColors = localStorage.getItem('app_custom_colors');
        if (savedColors) {
            try {
                const colors = JSON.parse(savedColors);
                this.applyTheme(colors);
            } catch (e) {
                console.error("Theme parse error:", e);
            }
        }
    },

    // ডিফল্ট বা রিসেট কালার
    resetTheme() {
        localStorage.removeItem('app_custom_colors');
        window.location.reload(); // পেজ রিলোড করে ডিফল্ট স্টাইলে ফিরে যাওয়া
    }
};

// অ্যাপ লোড হওয়ার পর থিম এপ্লাই করার জন্য
document.addEventListener('DOMContentLoaded', () => {
    AppThemeManager.loadSavedTheme();
});

