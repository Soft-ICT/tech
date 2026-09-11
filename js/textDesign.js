function applyTextDesign(rawText) {
    if (!rawText) return '';
    let text = rawText;

    // ===== BASIC FORMATTING =====
    text = text.replace(/\*\*__\-\-((?:.|\n)+?)\-\_\_\*\*/g, '<b><i><u>$1</u></i></b>');
    text = text.replace(/\*\*\-\-((?:.|\n)+?)\-\*\*/g, '<b><u>$1</u></b>');
    text = text.replace(/\_\___\-\-((?:.|\n)+?)\-\_\_\_\_/g, '<i><u>$1</u></i>');
    text = text.replace(/\*\*((?:.|\n)+?)\*\*/g, '<b>$1</b>');
    text = text.replace(/\_\_((?:.|\n)+?)\_\_/g, '<i>$1</i>');
    text = text.replace(/\-\-((?:.|\n)+?)\-\-/g, '<u>$1</u>');
    text = text.replace(/\~\~((?:.|\n)+?)\~\~/g, '<strike>$1</strike>');
    
    // সাইজ পরিবর্তন (Small & Large)
    text = text.replace(/\!\!\!((?:.|\n)+?)\!\!\!/g, '<span style="font-size: 2em;">$1</span>');
    text = text.replace(/\!\!((?:.|\n)+?)\!\!/g, '<span style="font-size: 1.5em;">$1</span>');
    text = text.replace(/\#((?:.|\n)+?)\#/g, '<span style="background-color: yellow; color: black; padding: 2px 4px;">$1</span>');

    // ===== BASIC COLORS (Shortcuts) =====
    text = text.replace(/'((?:.|\n)+?)'/g, '<span class="c-red">$1</span>');
    text = text.replace(/\+((?:.|\n)+?)\+/g, '<span class="c-green">$1</span>');
    text = text.replace(/\^((?:.|\n)+?)\^/g, '<span class="c-blue">$1</span>');
    text = text.replace(/\=((?:.|\n)+?)\=/g, '<span class="c-cyan">$1</span>');

    // ===== LETTER TAG COLORS (%R{}, %G{} etc.) =====
    text = text.replace(/%R\{((?:.|\n)+?)\}%/g, '<span class="c-red">$1</span>');
    text = text.replace(/%G\{((?:.|\n)+?)\}%/g, '<span class="c-green">$1</span>');
    text = text.replace(/%B\{((?:.|\n)+?)\}%/g, '<span class="c-blue">$1</span>');
    text = text.replace(/%C\{((?:.|\n)+?)\}%/g, '<span class="c-cyan">$1</span>');
    text = text.replace(/%M\{((?:.|\n)+?)\}%/g, '<span class="c-magenta">$1</span>');
    text = text.replace(/%Y\{((?:.|\n)+?)\}%/g, '<span class="c-yellow">$1</span>');
    text = text.replace(/%K\{((?:.|\n)+?)\}%/g, '<span class="c-black">$1</span>');
    text = text.replace(/%W\{((?:.|\n)+?)\}%/g, '<span class="c-white">$1</span>');
    text = text.replace(/%O\{((?:.|\n)+?)\}%/g, '<span class="c-orange">$1</span>');

    // ===== CUSTOM HEX COLOR (#HEX:FF0000!text!) =====
    text = text.replace(/#HEX:([0-9a-fA-F]{6,8})!((?:.|\n)+?)!/g, function(match, hex, content) {
        return `<span style="color: #${hex}; font-weight: bold;">${content}</span>`;
    });

    // ===== LINKS [Title](URL) =====
    text = text.replace(/\[((?:.|\n)+?)\]\(((?:https?:\/\/|www\.)\S+)\)/g, '<a href="$2" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>');

    // ===== ADVANCED EFFECTS =====
    text = text.replace(/%GRADIENT\{((?:.|\n)+?)\}%/g, '<span class="effect-gradient">$1</span>');
    text = text.replace(/%OUTLINE\{((?:.|\n)+?)\}%/g, '<span class="effect-outline">$1</span>');
    text = text.replace(/%SHADOW\{((?:.|\n)+?)\}%/g, '<span class="effect-shadow">$1</span>');
    text = text.replace(/%BLUR\{((?:.|\n)+?)\}%/g, '<span class="effect-blur">$1</span>');
    text.replace(/%RAINBOW\{((?:.|\n)+?)\}%/g, '<span class="effect-rainbow">$1</span>');
    text = text.replace(/%RAINBOW\{((?:.|\n)+?)\}%/g, '<span class="effect-rainbow">$1</span>');
    text = text.replace(/%NEON\{((?:.|\n)+?)\}%/g, '<span class="effect-neon">$1</span>');
    text = text.replace(/%3D\{((?:.|\n)+?)\}%/g, '<span class="effect-3d">$1</span>');
    text = text.replace(/%SHIMMER\{((?:.|\n)+?)\}%/g, '<span class="effect-shimmer">$1</span>');
    text = text.replace(/%GRADIENT_ANIM\{((?:.|\n)+?)\}%/g, '<span class="effect-gradient-anim">$1</span>');

    // ===== HIGHLIGHT EFFECT (%HIGHLIGHT{text;textColor;bgColor}%) =====
    text = text.replace(/%HIGHLIGHT\{(.*?)\;(.*?)\;(.*?)\}%/g, function(match, t, fg, bg) {
        return `<span style="color: ${fg}; background-color: ${bg}; padding: 2px 4px; border-radius: 3px;">${t}</span>`;
    });

    return text;
}
