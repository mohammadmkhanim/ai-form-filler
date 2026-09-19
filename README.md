# AI Form Filler (Gemini)

A Chrome extension (Manifest V3) that fills the form on the current page from a plain‑language
description, using the **Google Gemini** API. You describe your data (name, address, phone, …),
Gemini generates the JavaScript to fill the form, and the extension runs it on the page.
Everything runs in your browser with **your own** Gemini key — no server. Works with form data in
any language.

## Install (developer mode)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `form-filler-extension` folder.
3. Click the extension icon → ⚙ **Settings** → paste your Gemini API key
   (get one at https://aistudio.google.com/app/apikey) → **Save**.

## Usage

1. Open a page that has a form.
2. Click the extension icon, describe your data, and press **Fill form**.

## Project structure

```
popup/    UI + orchestration
options/  API key & model settings (chrome.storage)
lib/      Gemini client (prompt build + code extraction)
icons/    extension icon
manifest.json
```

> ⚠️ The extension runs AI‑generated code on the page — use it only on forms you trust.
> The executed code is shown under "Code that ran".

---

Built during my Master's studies, in collaboration with my supervisor
**[@myaghoubi](https://github.com/myaghoubi)**.
