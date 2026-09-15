// js/custom-settings.js

"use strict";

// নিখুঁত এবং নিরাপদ গ্লোবাল CSS স্টাইল ট্যাগ আপডেট করার ফাংশন
function updateGlobalStyles() {
    const themeColor = localStorage.getItem('app_theme_color');
    const bgColor = localStorage.getItem('app_bg_color');
    const textColor = localStorage.getItem('app_text_color');
    const uiFontSize = localStorage.getItem('app_ui_font_size'); 
    const contentFontSize = localStorage.getItem('app_content_font_size'); 
    const appLanguage = localStorage.getItem('app_language');

    let styleTag = document.getElementById('dynamic-custom-app-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-custom-app-styles';
        document.head.appendChild(styleTag);
    }

    let cssRules = `
        /* ১. টপবার এবং ড্রয়ার হেডার */
        ${themeColor ? `
            .topbar, .drawer-header, .sub-toolbar {
                background-color: ${themeColor} !important;
            }
            
            /* ২. হেডারের অরিজিনাল ডিজাইন, বর্ডার-রেডিয়াস ও শেপ শতভাগ ঠিক রেখে শুধু ব্যাকগ্রাউন্ড ও টেক্সট কালার পরিবর্তন */
            .header-box, .header-banner {
                background-color: ${themeColor} !important;
            }
            .header-box h2, .header-box h3, .header-banner span, .header-banner h2 {
                color: #ffffff !important;
            }
        ` : ''}

        /* ৩. মূল ব্যাকগ্রাউন্ড কালার (শুধু বডিতে এপ্লাই হবে, কার্ড বা হেডারে প্রভাব ফেলবে না) */
        ${bgColor ? `
            body {
                background-color: ${bgColor} !important;
            }
            #mainDashboardView, #categoryDetailsView, #dataDetailsView, .all-search-container {
                background-color: transparent !important;
            }
        ` : ''}

        /* ৪. টেক্সট কালার (নির্দিষ্ট UI এলিমেন্টে, কার্ডের ডিজাইন নষ্ট না করে) */
        ${textColor ? `
            .category-card h3, .subcategory-card h3, 
            .menu-text, .drawer-section-title, 
            #appTitle, .topbar span, .topbar h2 {
                color: ${textColor} !important;
            }
        ` : ''}

        /* ৫. UI ফন্ট সাইজ (ড্রয়ার, ক্যাটাগরি, সাব-ক্যাটাগরি) */
        ${uiFontSize ? `
            .menu-text, .category-card h3, .subcategory-card h3, .drawer-section-title {
                font-size: ${uiFontSize}px !important;
            }
        ` : ''}

        /* ৬. কন্টেন্ট ফন্ট সাইজ (ডাটা কার্ড এবং ডাটা প্রোফাইল) */
        ${contentFontSize ? `
            .data-card-name, .data-card-detail, .details-info-box, .info-label, .info-value {
                font-size: ${contentFontSize}px !important;
            }
        ` : ''}
    `;

    styleTag.innerHTML = cssRules;

    if (appLanguage) {
        applyLanguageTranslation(appLanguage);
    }
}

// ল্যাঙ্গুয়েজ চেঞ্জ করার কার্যকরী ফাংশন
function applyLanguageTranslation(lang) {
    if (lang === 'en') {
        document.querySelectorAll('.data-card-detail').forEach(el => {
            if (el.textContent.includes('মোবাইল:')) el.innerHTML = el.innerHTML.replace('মোবাইল:', 'Mobile:');
            if (el.textContent.includes('টেলিফোন:')) el.innerHTML = el.innerHTML.replace('টেলিফোন:', 'Phone:');
            if (el.textContent.includes('পদবী:')) el.innerHTML = el.innerHTML.replace('পদবী:', 'Designation:');
        });
    } else {
        document.querySelectorAll('.data-card-detail').forEach(el => {
            if (el.textContent.includes('Mobile:')) el.innerHTML = el.innerHTML.replace('Mobile:', 'মোবাইল:');
            if (el.textContent.includes('Phone:')) el.innerHTML = el.innerHTML.replace('Phone:', 'টেলিফোন:');
            if (el.textContent.includes('Designation:')) el.innerHTML = el.innerHTML.replace('Designation:', 'পদবী:');
        });
    }
}

// সেটিংসের ইভেন্ট লিসেনার
export function setupCustomSettingsListener() {
    document.addEventListener('change', (e) => {
        if (!e.target) return;

        if (e.target.id === 'themeColorInput') {
            localStorage.setItem('app_theme_color', e.target.value);
            updateGlobalStyles();
        }
        if (e.target.id === 'bgColorInput') {
            localStorage.setItem('app_bg_color', e.target.value);
            updateGlobalStyles();
        }
        if (e.target.id === 'textColorInput') {
            localStorage.setItem('app_text_color', e.target.value);
            updateGlobalStyles();
        }
        if (e.target.name === 'appLang' || e.target.id === 'languageSelect') {
            localStorage.setItem('app_language', e.target.value);
            updateGlobalStyles();
            if (typeof refreshCurrentView === 'function') {
                refreshCurrentView();
            }
        }
    });

    document.addEventListener('input', (e) => {
        if (!e.target.id) return;

        if (e.target.id === 'fontSizeRange') {
            localStorage.setItem('app_ui_font_size', e.target.value);
            updateGlobalStyles();
        }
        if (e.target.id === 'contentFontSizeRange') {
            localStorage.setItem('app_content_font_size', e.target.value);
            updateGlobalStyles();
        }
    });
}

// DOM পরিবর্তন ট্র্যাক করার জন্য অবজারভার
function observeDOMChanges() {
    const observer = new MutationObserver(() => {
        updateGlobalStyles();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

window.addEventListener('DOMContentLoaded', () => {
    updateGlobalStyles();
    setupCustomSettingsListener();
    observeDOMChanges();
});
