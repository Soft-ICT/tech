// js/themeManager.js

export const AppThemeManager = {
    applyTheme(colors) {
        // ১. হেডার কালার
        const headerEl = document.querySelector('header.topbar, header, .app-header');
        if (headerEl && colors.header) {
            headerEl.style.backgroundColor = colors.header;
        }

        // ২. ক্যাটাগরি আইটেম কালার
        document.querySelectorAll('.category-item, .category-card').forEach(el => {
            if (colors.category) el.style.backgroundColor = colors.category;
        });

        // ৩. সাব-ক্যাটাগরি কালার
        document.querySelectorAll('.sub-category-item, .sub-cat-card').forEach(el => {
            if (colors.subCategory) el.style.backgroundColor = colors.subCategory;
        });

        // ৪. ডাটা প্রোফাইল কার্ড বা ডিটেইলস কার্ড কালার
        document.querySelectorAll('.data-profile, .profile-card, .details-container-card').forEach(el => {
            if (colors.dataProfile) el.style.backgroundColor = colors.dataProfile;
        });

        // ৫. হোম নোটিশ পপআপ কালার
        const homeNoticeEl = document.getElementById('homeNoticeBox');
        if (homeNoticeEl && colors.homeNotice) {
            homeNoticeEl.style.backgroundColor = colors.homeNotice;
        }

        // ৬. স্লাইডিং/স্ক্রোলিং নোটিশ কালার
        const scrollingNoticeEl = document.getElementById('slidingNoticeContainer');
        if (scrollingNoticeEl && colors.scrollingNotice) {
            scrollingNoticeEl.style.backgroundColor = colors.scrollingNotice;
        }

        // লোকাল স্টোরেজে সেভ করা
        localStorage.setItem('app_custom_colors', JSON.stringify(colors));
    },

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

    resetTheme() {
        localStorage.removeItem('app_custom_colors');
        window.location.reload();
    }
};

// অটো রান এবং ইভেন্ট লিসেনার সেটআপ
document.addEventListener('DOMContentLoaded', () => {
    AppThemeManager.loadSavedTheme();

    // ডাইনামিকালি রেন্ডার হওয়া এলিমেন্টের জন্য মিউটেশন অবজার্ভার (যাতে ডাটা লোড হওয়ার পরও কালার মুছে না যায়)
    const observer = new MutationObserver(() => {
        const savedColors = localStorage.getItem('app_custom_colors');
        if (savedColors) {
            try {
                AppThemeManager.applyTheme(JSON.parse(savedColors));
            } catch (e) {}
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // থিম সেভ করার বাটন ইভেন্ট
    document.getElementById('saveThemeBtn')?.addEventListener('click', () => {
        const newColors = {
            header: document.getElementById('clrHeader')?.value,
            category: document.getElementById('clrCategory')?.value,
            subCategory: document.getElementById('clrSubCategory')?.value,
            dataProfile: document.getElementById('clrDataProfile')?.value,
            homeNotice: document.getElementById('clrHomeNotice')?.value,
            scrollingNotice: document.getElementById('clrScrollingNotice')?.value
        };

        AppThemeManager.applyTheme(newColors);
        alert('থিম সফলভাবে আপডেট করা হয়েছে!');
    });

    // থিম রিসেট করার বাটন ইভেন্ট
    document.getElementById('resetThemeBtn')?.addEventListener('click', () => {
        AppThemeManager.resetTheme();
    });
});
