// ============================================================
// translation-worker.js
// Local Bengali -> English translation worker
// ============================================================
// This file is loaded by app.js as a module Worker.
// It uses Transformers.js + NLLB-200 and does not use Google
// Translate. The model is cached by the browser after download.
// ============================================================

import { pipeline, env } from
    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2";

/* Browser-side model/cache configuration. */
env.allowLocalModels = false;
env.useBrowserCache = true;

let translator = null;

async function loadTranslator() {
    if (translator) return translator;

    translator = await pipeline(
        "translation",
        "Xenova/nllb-200-distilled-600M",
        {
            device: "wasm"
        }
    );

    return translator;
}

function postError(id, error) {
    self.postMessage({
        type: "error",
        id,
        error: error?.message || String(error)
    });
}

self.onmessage = async (event) => {
    const data = event.data || {};

    if (data.type !== "translate") return;

    const id = data.id;
    const text = String(data.text || "").trim();

    if (!text) {
        self.postMessage({
            type: "result",
            id,
            text: ""
        });
        return;
    }

    try {
        const model = await loadTranslator();

        const result = await model(text, {
            src_lang: "ben_Beng",
            tgt_lang: "eng_Latn"
        });

        const translated =
            Array.isArray(result) && result[0]
                ? String(result[0].translation_text || "").trim()
                : "";

        self.postMessage({
            type: "result",
            id,
            text: translated || text
        });
    } catch (error) {
        console.error("NLLB translation error:", error);
        postError(id, error);
    }
};
