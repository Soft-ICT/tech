// js/custom-settings.js
"use strict";

/* ============================================================
   CUSTOM SETTINGS
   ============================================================ */
const CS_THEME = "app_theme_color";
const CS_BG = "app_bg_color";
const CS_TEXT = "app_text_color";
const CS_BG_IMAGE = "app_bg_image";
const CS_LANGUAGE = "app_language";

function applyCustomSettings() {
  applyThemeColor();
  applyBackground();
  applyGlobalTextColor();
}

/* ============================================================
   REMOVE FONT SIZE OPTIONS (AGGRESSIVE REMOVAL)
   ============================================================ */
function removeFontSizeSettings() {
  // ১. আইডি দিয়ে রিমুভ করার চেষ্টা
  const ids = ["fontSizeRange", "contentFontSizeRange"];
  ids.forEach(function (id) {
    const input = document.getElementById(id);
    if (input) {
      const parent = input.closest("div, li, tr, section");
      if (parent) parent.remove();
      else input.remove();
    }
  });

  // ২. লেখা বা লেবেল ধরে সম্পূর্ণ রো রিমুভ করা
  document.querySelectorAll("*").forEach(function (el) {
    // সরাসরি চাইল্ড টেক্সট চেক করা
    if (el.children.length === 0 || el.tagName === "LABEL" || el.tagName === "SPAN" || el.tagName === "P" || el.tagName === "H3") {
      const text = el.textContent ? el.textContent.trim() : "";
      if (
        text.includes("Font Size") ||
        text.includes("Content Font Size")
      ) {
        // এর সবচেয়ে কাছের সেটিং কন্টেইনার বা প্যারেন্ট ব্লক রিমুভ করা
        const container = el.closest(".setting-item, .settings-item, .setting-row, .form-group, .setting-option, div, li");
        if (container && container !== document.body && container !== document.documentElement) {
          container.remove();
        } else {
          el.remove();
        }
      }
    }
  });
}

/* ============================================================
   THEME COLOR
   ============================================================ */
function applyThemeColor() {
  const color = localStorage.getItem(CS_THEME);
  if (!color) return;

  document.documentElement.style.setProperty("--primary-color", color);

  const toolbarElements = document.querySelectorAll(".topbar, .drawer-header, .sub-toolbar");
  toolbarElements.forEach(function (el) {
    el.style.setProperty("background-color", color, "important");
  });

  const headers = document.querySelectorAll(".header-box, .header-banner");
  headers.forEach(function (el) {
    el.style.setProperty("background-color", color, "important");
  });
}

/* ============================================================
   BACKGROUND (FIXED IMAGE & COLOR)
   ============================================================ */
function applyBackground() {
  const image = localStorage.getItem(CS_BG_IMAGE);
  const color = localStorage.getItem(CS_BG);

  if (image) {
    document.body.style.setProperty("background-image", 'url("' + image + '")', "important");
    document.body.style.setProperty("background-size", "cover", "important");
    document.body.style.setProperty("background-position", "center center", "important");
    document.body.style.setProperty("background-repeat", "no-repeat", "important");
    // ফিক্সড সাইজ যাতে স্ক্রল করলে উঠানামা না করে
    document.body.style.setProperty("background-attachment", "fixed", "important");

    if (color) {
      document.body.style.setProperty("background-color", color, "important");
    }
  } else if (color) {
    document.body.style.setProperty("background-color", color, "important");
    document.body.style.removeProperty("background-image");
    document.body.style.setProperty("background-attachment", "fixed", "important");
  }

  const dashboard = document.getElementById("mainDashboardView");
  if (dashboard) {
    dashboard.style.setProperty("background", "transparent", "important");
  }
}

/* ============================================================
   COLOR FORMATTER DETECTION
   ============================================================ */
function isColorFormatterElement(el) {
  if (!el) return false;
  if (el.hasAttribute("data-color-text") || el.hasAttribute("data-formatter-color") || el.hasAttribute("data-colored")) {
    return true;
  }
  const className = typeof el.className === "string" ? el.className : "";
  if (className.includes("formatter") || className.includes("formatted") || className.includes("gradient")) {
    return true;
  }
  if (el.style && el.style.getPropertyValue("color")) {
    return true;
  }
  return false;
}

/* ============================================================
   GLOBAL TEXT COLOR
   ============================================================ */
function applyGlobalTextColor() {
  const color = localStorage.getItem(CS_TEXT);
  if (!color) return;

  document.documentElement.style.setProperty("--app-text-color", color);

  const selectors = ["body", ".topbar", ".drawer", ".data-card", ".modal", "h1", "h2", "h3", "h4", "p", "label", "li", "a"];
  document.querySelectorAll(selectors.join(",")).forEach(function (el) {
    if (isColorFormatterElement(el)) return;
    const tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag === "img" || tag === "svg" || tag === "path" || tag === "input") return;
    el.style.setProperty("color", color, "important");
  });
}

/* ============================================================
   GALLERY UI (BACKGROUND IMAGE BUTTONS)
   ============================================================ */
function createBackgroundImageUI() {
  if (document.getElementById("customBackgroundImageBox")) return;

  const bgColorInput = document.getElementById("bgColorInput");
  if (!bgColorInput) return;

  const parent = bgColorInput.closest(".setting-item, .settings-item, .setting-row, .form-group, div") || bgColorInput.parentElement;
  if (!parent) return;

  const box = document.createElement("div");
  box.id = "customBackgroundImageBox";
  box.style.display = "flex";
  box.style.alignItems = "center";
  box.style.gap = "8px";
  box.style.marginTop = "10px";

  // Gallery Button (🖼️)
  const chooseButton = document.createElement("button");
  chooseButton.type = "button";
  chooseButton.id = "chooseBgImageBtn";
  chooseButton.innerHTML = "🖼️";
  chooseButton.title = "Background Image from Gallery";
  chooseButton.style.width = "42px";
  chooseButton.style.height = "42px";
  chooseButton.style.fontSize = "20px";
  chooseButton.style.cursor = "pointer";

  // Hidden File Input
  const input = document.createElement("input");
  input.type = "file";
  input.id = "bgImageInput";
  input.accept = "image/*";
  input.style.display = "none";

  // Remove Button (🗑️)
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.id = "removeBgImageBtn";
  removeButton.innerHTML = "🗑️";
  removeButton.title = "Remove Background Image";
  removeButton.style.width = "42px";
  removeButton.style.height = "42px";
  removeButton.style.fontSize = "20px";
  removeButton.style.cursor = "pointer";

  box.appendChild(chooseButton);
  box.appendChild(input);
  box.appendChild(removeButton);
  parent.appendChild(box);
}

function openGallery() {
  const input = document.getElementById("bgImageInput");
  if (input) input.click();
}

function saveBackgroundImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    alert("অনুগ্রহ করে একটি ছবি নির্বাচন করুন।");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const image = new Image();
    image.onload = function () {
      const maxSize = 1600;
      let width = image.width;
      let height = image.height;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, width, height);

      const data = canvas.toDataURL("image/jpeg", 0.82);
      try {
        localStorage.setItem(CS_BG_IMAGE, data);
        applyBackground();
      } catch (error) {
        alert("ছবিটি সংরক্ষণ করা যায়নি। ছোট সাইজের ছবি দিন।");
      }
    };
    image.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function removeBackgroundImage() {
  localStorage.removeItem(CS_BG_IMAGE);
  const input = document.getElementById("bgImageInput");
  if (input) input.value = "";
  applyBackground();
}

/* ============================================================
   EVENT LISTENERS & INIT
   ============================================================ */
export function setupCustomSettingsListener() {
  document.addEventListener("change", function (e) {
    if (!e.target) return;
    if (e.target.id === "themeColorInput") {
      localStorage.setItem(CS_THEME, e.target.value);
      applyThemeColor();
    }
    if (e.target.id === "bgColorInput") {
      localStorage.setItem(CS_BG, e.target.value);
      applyBackground();
    }
    if (e.target.id === "textColorInput") {
      localStorage.setItem(CS_TEXT, e.target.value);
      applyGlobalTextColor();
    }
    if (e.target.id === "bgImageInput") {
      saveBackgroundImage(e.target.files && e.target.files[0]);
    }
  });

  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "chooseBgImageBtn") openGallery();
    if (e.target && e.target.id === "removeBgImageBtn") removeBackgroundImage();
  });
}

window.addEventListener("DOMContentLoaded", function () {
  removeFontSizeSettings();
  createBackgroundImageUI();
  applyCustomSettings();
  setupCustomSettingsListener();

  // একাধিকবার চেক করা যাতে UI রেন্ডার হওয়ার সাথে সাথে রিমুভ হয়ে যায়
  setTimeout(removeFontSizeSettings, 300);
  setTimeout(removeFontSizeSettings, 1000);
  setTimeout(createBackgroundImageUI, 500);
});

window.applyCustomSettings = applyCustomSettings;
window.applyThemeColor = applyThemeColor;
window.applyBackground = applyBackground;
window.applyGlobalTextColor = applyGlobalTextColor;
window.removeBackgroundImage = removeBackgroundImage;
