// js/custom-settings.js

"use strict";

// অ্যাপ লোড হওয়ার সাথে সাথে সেভ করা সেটিংস অ্যাপ্লাই করা
function applyCustomSettings() {
    const themeColor = localStorage.getItem('app_theme_color');
    const bgColor = localStorage.getItem('app_bg_color');
    const textColor = localStorage.getItem('app_text_color');
    const fontSize = localStorage.getItem('app_font_size');
    const contentFontSize = localStorage.getItem('app_content_font_size');

    // ১. থিম কালার (হেডার বা প্রাইমারি এলিমেন্ট)
    if (themeColor) {
        document.documentElement.style.setProperty('--primary-color', themeColor);
        const topbar = document.querySelector('.topbar, .drawer-header');
        if (topbar) topbar.style.backgroundColor = themeColor;
    }

    // ২. ব্যাকগ্রাউন্ড কালার
    if (bgColor) {
        document.body.style.backgroundColor = bgColor;
    }

    // ৩. টেক্সট কালার
    if (textColor) {
        document.body.style.color = textColor;
    }

    // ৪. ফন্ট সাইজ
    if (fontSize) {
        document.body.style.fontSize = fontSize + 'px';
    }

    // ৫. কন্টেন্ট ফন্ট সাইজ
    if (contentFontSize) {
        document.querySelectorAll('.data-card-detail, .category-card h3, .menu-text').forEach(el => {
            el.style.fontSize = contentFontSize + 'px';
        });
    }
}

// সেটিংস মোডাল থেকে ডাটা পরিবর্তন করে সেভ করার ফাংশন (বাইপাস লজিক)
export function setupCustomSettingsListener() {
    // সেটিংসে পরিবর্তন আসলে লাইভ প্রিভিউ বা স্টোরেজে সেভ করার ইভেন্ট
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'themeColorInput') {
            localStorage.setItem('app_theme_color', e.target.value);
            applyCustomSettings();
        }
        if (e.target && e.target.id === 'bgColorInput') {
            localStorage.setItem('app_bg_color', e.target.value);
            applyCustomSettings();
        }
        if (e.target && e.target.id === 'textColorInput') {
            localStorage.setItem('app_text_color', e.target.value);
            applyCustomSettings();
        }
    });

    document.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'fontSizeRange') {
            localStorage.setItem('app_font_size', e.target.value);
            applyCustomSettings();
        }
        if (e.target && e.target.id === 'contentFontSizeRange') {
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
