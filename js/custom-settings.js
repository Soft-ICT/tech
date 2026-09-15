// js/custom-settings.js

"use strict";

// অ্যাপ লোড হওয়ার সাথে সাথে এবং পরিবর্তন করলে সেটিংস অ্যাপ্লাই করার ফাংশন
function applyCustomSettings() {
    const themeColor = localStorage.getItem('app_theme_color');
    const bgColor = localStorage.getItem('app_bg_color');
    const textColor = localStorage.getItem('app_text_color');
    const uiFontSize = localStorage.getItem('app_ui_font_size'); // ড্রয়ার, ক্যাটাগরি ও সাব-ক্যাটাগরির জন্য
    const contentFontSize = localStorage.getItem('app_content_font_size'); // ডাটা ও প্রোফাইলের জন্য
    const appLanguage = localStorage.getItem('app_language');

    // ১. থিম কালার (হেডার, টপবার ও ড্রয়ার হেডার একসাথে পরিবর্তন হবে)
    if (themeColor) {
        document.documentElement.style.setProperty('--primary-color', themeColor);
        const headersAndToolbars = document.querySelectorAll('.topbar, .drawer-header, .header-banner, .sub-toolbar');
        headersAndToolbars.forEach(el => {
            el.style.backgroundColor = themeColor;
        });
    }

    // ২. ব্যাকগ্রাউন্ড কালার
    if (bgColor) {
        document.body.style.backgroundColor = bgColor;
    }

    // ৩. টেক্সট কালার
    if (textColor) {
        document.body.style.color = textColor;
    }

    // ৪. UI ফন্ট সাইজ (ড্রয়ার, ক্যাটাগরি, সাব-ক্যাটাগরি ও মেনু টেক্সট)
    if (uiFontSize) {
        const uiElements = document.querySelectorAll('.menu-text, .category-card h3, .subcategory-card h3, .drawer-section-title');
        uiElements.forEach(el => {
            el.style.fontSize = uiFontSize + 'px';
        });
    }

    // ৫. কন্টেন্ট ফন্ট সাইজ (ডাটা কার্ড এবং ডাটা প্রোফাইল ডিটেইলসের জন্য)
    if (contentFontSize) {
        const contentElements = document.querySelectorAll('.data-card-info, .details-info-box, .data-card-name');
        contentElements.forEach(el => {
            el.style.fontSize = contentFontSize + 'px';
        });
    }

    // ৬. ভাষা বা ল্যাঙ্গুয়েজ মোড হ্যান্ডেল করার লজিক (যদি থাকে)
    if (appLanguage) {
        // এখানে আপনার অ্যাপের ভাষা পরিবর্তনের লজিক বা ফাংশন কল করতে পারেন
        console.log("Current App Language:", appLanguage);
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
        // ল্যাঙ্গুয়েজ রেডিও বাটন হ্যান্ডেল করা
        if (e.target.name === 'appLang') {
            localStorage.setItem('app_language', e.target.value);
            applyCustomSettings();
            // চাইলে পেজ রিলোড বা ভাষা পরিবর্তনের রি-রেন্ডার ফাংশন কল করতে পারেন
            window.location.reload();
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
