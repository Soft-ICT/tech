// js/themeManager.js

export const AppThemeManager = {
    applyTheme(colors) {
        const headerEl = document.querySelector('header, .app-header');
        if (headerEl && colors.header) {
            headerEl.style.backgroundColor = colors.header;
        }

        document.querySelectorAll('.category-item, .category-card').forEach(el => {
            if (colors.category) el.style.backgroundColor = colors.category;
        });

        document.querySelectorAll('.sub-category-item, .sub-cat-card').forEach(el => {
            if (colors.subCategory) el.style.backgroundColor = colors.subCategory;
        });

        document.querySelectorAll('.data-profile, .profile-card').forEach(el => {
            if (colors.dataProfile) el.style.backgroundColor = colors.dataProfile;
        });

        const homeNoticeEl = document.querySelector('.home-notice, .notice-box');
        if (homeNoticeEl && colors.homeNotice) {
            homeNoticeEl.style.backgroundColor = colors.homeNotice;
        }

        const scrollingNoticeEl = document.querySelector('.scrolling-notice, marquee, .ticker-wrap');
        if (scrollingNoticeEl && colors.scrollingNotice) {
            scrollingNoticeEl.style.backgroundColor = colors.scrollingNotice;
        }

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

        // থিম এপ্লাই ও লোকাল স্টোরেজে সেভ
        AppThemeManager.applyTheme(newColors);
        
        // ফায়ারবেস রিয়েলটাইম ডেটাবেজে সেভ করতে চাইলে (অ্যাডমিনের জন্য):
        // database.ref('settings/themeColors').set(newColors);

        alert('থিম সফলভাবে আপডেট করা হয়েছে!');
    });

    // থিম রিসেট করার বাটন ইভেন্ট
    document.getElementById('resetThemeBtn')?.addEventListener('click', () => {
        AppThemeManager.resetTheme();
    });
});
