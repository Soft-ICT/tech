// js/custom-settings.js

"use strict";

// অ্যাপ লোড হওয়ার সাথে সাথে এবং পরিবর্তন করলে সেটিংস অ্যাপ্লাই করার ফাংশন
function applyCustomSettings() {
    const themeColor = localStorage.getItem('app_theme_color');
    const bgColor = localStorage.getItem('app_bg_color');
    const textColor = localStorage.getItem('app_text_color');
    const uiFontSize = localStorage.getItem('app_ui_font_size'); 
    const contentFontSize = localStorage.getItem('app_content_font_size'); 
    const appLanguage = localStorage.getItem('app_language');

    // ১. থিম কালার (টপবার, হেডার, ড্রয়ার হেডার এবং মার্কিং করা ডাটা হেডার সহ সমস্ত ব্যানার)
    if (themeColor) {
        document.documentElement.style.setProperty('--primary-color', themeColor);
        
        // টপবার, ড্রয়ার হেডার, সাব-টুলবার
        const toolbars = document.querySelectorAll('.topbar, .drawer-header, .sub-toolbar');
        toolbars.forEach(el => {
            el.style.setProperty('background-color', themeColor, 'important');
        });

        // মার্কিং করা ডাটা হেডার বা ব্যানার (.header-box, .header-banner ইত্যাদি)
        const markedHeaders = document.querySelectorAll('.header-box, .header-banner, .header-banner span');
        markedHeaders.forEach(el => {
            el.style.setProperty('background-color', themeColor, 'important');
            el.style.setProperty('color', '#ffffff', 'important'); // ব্যাকগ্রাউন্ড কালার গাঢ় হলে টেক্সট সাদা দেখাবে
        });
    }

    // ২. ব্যাকগ্রাউন্ড কালার
    if (bgColor) {
        document.body.style.backgroundColor = bgColor;
        const views = document.querySelectorAll('#mainDashboardView, #categoryDetailsView, #dataDetailsView, .all-search-container');
        views.forEach(v => v.style.backgroundColor = bgColor);
    }

    // ৩. টেক্সট কালার (color-formatter.js এর কোড বাদে পুরো অ্যাপের সমস্ত টেক্সট কালার পরিবর্তন)
    if (textColor) {
        document.body.style.color = textColor;

        // সমস্ত টেক্সট কন্টেইনার এবং এলিমেন্টগুলোর কালার ফোর্সিং (যেগুলো কালার-ফরমেটার দ্বারা বিশেষভাবে রঙিন নয়)
        const allTextElements = document.querySelectorAll(`
            .category-card h3, .subcategory-card h3, 
            .data-card-name, .data-card-detail, 
            .details-info-box, .info-label, .info-value, 
            .menu-text, .drawer-section-title, 
            #appTitle, .topbar span, .topbar h2,
            .header-banner span
        `);

        allTextElements.forEach(el => {
            // যদি এলিমেন্টটিতে color-formatter বা কাস্টম স্টাইল না থাকে তবেই টেক্সট কালার বসবে
            if (!el.hasAttribute('data-custom-colored')) {
                el.style.setProperty('color', textColor, 'important');
            }
        });
    }

    // ৪. UI ফন্ট সাইজ (ড্রয়ার, ক্যাটাগরি, সাব-ক্যাটাগরি)
    if (uiFontSize) {
        const uiElements = document.querySelectorAll('.menu-text, .category-card h3, .subcategory-card h3, .drawer-section-title');
        uiElements.forEach(el => {
            el.style.fontSize = uiFontSize + 'px';
        });
    }

    // ৫. কন্টেন্ট ফন্ট সাইজ (ডাটা কার্ড এবং ডাটা প্রোফাইল)
    if (contentFontSize) {
        const contentElements = document.querySelectorAll('.data-card-info, .details-info-box, .data-card-name');
        contentElements.forEach(el => {
            el.style.fontSize = contentFontSize + 'px';
        });
    }

    // ৬. ভাষা বা ল্যাঙ্গুয়েজ মোড হ্যান্ডেল করার লজিক
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
            applyCustomSettings();
        }
        if (e.target.id === 'bgColorInput') {
            localStorage.setItem('app_bg_color', e.target.value);
            applyCustomSettings();
        }
        if (e.target.id === 'textColorInput') {
            localStorage.setItem('app_text_color', e.target.value);
            applyCustomSettings();
        }
        if (e.target.name === 'appLang' || e.target.id === 'languageSelect') {
            localStorage.setItem('app_language', e.target.value);
            applyCustomSettings();
            if (typeof refreshCurrentView === 'function') {
                refreshCurrentView();
            }
        }
    });

    document.addEventListener('input', (e) => {
        if (!e.target) return;

        if (e.target.id === 'fontSizeRange') {
            localStorage.setItem('app_ui_font_size', e.target.value);
            applyCustomSettings();
        }
        if (e.target.id === 'contentFontSizeRange') {
            localStorage.setItem('app_content_font_size', e.target.value);
            applyCustomSettings();
        }
    });
}

// পেজ লোড হওয়ার সাথে সাথে সেটিংস কল করা
window.addEventListener('DOMContentLoaded', () => {
    applyCustomSettings();
    setupCustomSettingsListener();
});
