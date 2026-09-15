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

    // ১. থিম কালার (টপবার, হেডার, ড্রয়ার হেডার এবং ডাটা হেডার বা ব্যানার একসাথে পরিবর্তন হবে)
    if (themeColor) {
        document.documentElement.style.setProperty('--primary-color', themeColor);
        
        // টপবার এবং ড্রয়ার হেডার
        const headersAndToolbars = document.querySelectorAll('.topbar, .drawer-header, .sub-toolbar');
        headersAndToolbars.forEach(el => {
            el.style.backgroundColor = themeColor;
        });

        // ক্যাটাগরি ডিটেইলস পেজের ডাটা হেডার বা ব্যানার (.header-box এবং .header-banner)
        const dataHeaders = document.querySelectorAll('.header-box, .header-banner');
        dataHeaders.forEach(el => {
            el.style.backgroundColor = themeColor;
            el.style.color = "#ffffff"; // থিম কালার দিলে টেক্সট যাতে স্পষ্ট দেখা যায়
        });
    }

    // ২. ব্যাকগ্রাউন্ড কালার
    if (bgColor) {
        document.body.style.backgroundColor = bgColor;
        const mainDashboard = document.getElementById('mainDashboardView');
        if (mainDashboard) mainDashboard.style.backgroundColor = bgColor;
    }

    // ৩. টেক্সট কালার (সারা অ্যাপের মেইন টেক্সট এবং কার্ডের ভেতরের টেক্সট কালার ফোর্সিং)
    if (textColor) {
        document.body.style.color = textColor;
        const textElements = document.querySelectorAll('.data-card-name, .data-card-detail, .category-card h3, .subcategory-card h3, .info-value, .info-label');
        textElements.forEach(el => {
            el.style.color = textColor;
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

// ল্যাঙ্গুয়েজ চেঞ্জ করার কার্যকরী ফাংশন (বাংলা / ইংরেজি লেবেল পরিবর্তন)
function applyLanguageTranslation(lang) {
    // আপনি চাইলে এখানে স্ট্যাটিক লেবেল বা UI টেক্সট পরিবর্তন করতে পারেন
    if (lang === 'en') {
        // ইংরেজির জন্য লেবেল পরিবর্তন লজিক
        document.querySelectorAll('.data-card-detail').forEach(el => {
            if (el.textContent.includes('মোবাইল:')) el.innerHTML = el.innerHTML.replace('মোবাইল:', 'Mobile:');
            if (el.textContent.includes('টেলিফোন:')) el.innerHTML = el.innerHTML.replace('টেলিফোন:', 'Phone:');
            if (el.textContent.includes('পদবী:')) el.innerHTML = el.innerHTML.replace('পদবী:', 'Designation:');
        });
    } else {
        // বাংলার জন্য লেবেল পরিবর্তন লজিক
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
        // ল্যাঙ্গুয়েজ রেডিও বাটন বা সিলেক্ট হ্যান্ডেল করা
        if (e.target.name === 'appLang' || e.target.id === 'languageSelect') {
            const langVal = e.target.value;
            localStorage.setItem('app_language', langVal);
            applyCustomSettings();
            // রেন্ডার রিফ্রেশ করার জন্য 
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
