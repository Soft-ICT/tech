// js/custom-settings.js

"use strict";

// ডাইনামিক গ্লোবাল CSS স্টাইল ট্যাগ তৈরি বা আপডেট করার ফাংশন (স্থায়ী সমাধানের জন্য)
function updateGlobalStyles() {
    const themeColor = localStorage.getItem('app_theme_color');
    const bgColor = localStorage.getItem('app_bg_color');
    const textColor = localStorage.getItem('app_text_color');
    const uiFontSize = localStorage.getItem('app_ui_font_size'); 
    const contentFontSize = localStorage.getItem('app_content_font_size'); 
    const appLanguage = localStorage.getItem('app_language');

    // একটি ইউনিক আইডি দিয়ে স্টাইল ট্যাগ তৈরি করা যাতে বারবার ডুপ্লিকেট না হয়
    let styleTag = document.getElementById('dynamic-custom-app-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-custom-app-styles';
        document.head.appendChild(styleTag);
    }

    // গ্লোবাল CSS রুলস তৈরি যা পুরো অ্যাপে স্থায়ীভাবে কাজ করবে
    let cssRules = `
        /* ১. থিম কালার (টপবার, হেডার, ড্রয়ার হেডার এবং মার্কিং করা হেডার) */
        ${themeColor ? `
            .topbar, .drawer-header, .sub-toolbar {
                background-color: ${themeColor} !important;
            }
            .header-box, .header-banner, .header-banner span {
                background-color: ${themeColor} !important;
                color: #ffffff !important;
            }
        ` : ''}

        /* ২. ব্যাকগ্রাউন্ড কালার */
        ${bgColor ? `
            body, #mainDashboardView, #categoryDetailsView, #dataDetailsView, .all-search-container {
                background-color: ${bgColor} !important;
            }
        ` : ''}

        /* ৩. টেক্সট কালার (color-formatter এর কালার বাদে সব টেক্সটে এপ্লাই হবে) */
        ${textColor ? `
            body, .category-card h3, .subcategory-card h3, 
            .data-card-name, .data-card-detail, 
            .details-info-box, .info-label, .info-value, 
            .menu-text, .drawer-section-title, 
            #appTitle, .topbar span, .topbar h2,
            .header-banner span, p, span, div {
                color: ${textColor} !important;
            }
            /* মার্কিং করা হেডারের টেক্সট থিম কালার দিলে সবসময় সাদা থাকবে */
            .header-box, .header-banner, .header-banner span {
                color: #ffffff !important;
            }
        ` : ''}

        /* ৪. UI ফন্ট সাইজ (ড্রয়ার, ক্যাটাগরি, সাব-ক্যাটাগরি) */
        ${uiFontSize ? `
            .menu-text, .category-card h3, .subcategory-card h3, .drawer-section-title {
                font-size: ${uiFontSize}px !important;
            }
        ` : ''}

        /* ৫. কন্টেন্ট ফন্ট সাইজ (ডাটা কার্ড এবং ডাটা প্রোফাইল) */
        ${contentFontSize ? `
            .data-card-info, .details-info-box, .data-card-name, .data-card-detail {
                font-size: ${contentFontSize}px !important;
            }
        ` : ''}
    `;

    styleTag.innerHTML = cssRules;

    // ভাষা পরিবর্তনের হ্যান্ডেল
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

// সেটিংসের ইভেন্ট লিসেনার এবং লাইভ আপডেট সেটআপ
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
        if (!e.target) return;

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

// MutationObserver ব্যবহার করে অ্যাপের যেকোনো জায়গায় নতুন কন্টেন্ট বা ভিউ লোড হলে সাথে সাথে স্টাইল বজায় রাখা
function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
        // পেজে নতুন এলিমেন্ট যোগ হলেই গ্লোবাল স্টাইল রি-এপ্লাই হবে, ফলে আর সাময়িক পরিবর্তন হয়ে মুছে যাবে না
        updateGlobalStyles();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// পেজ লোড হওয়ার সাথে সাথে সেটিংস কল করা এবং অবজারভার চালু করা
window.addEventListener('DOMContentLoaded', () => {
    updateGlobalStyles();
    setupCustomSettingsListener();
    observeDOMChanges();
});
