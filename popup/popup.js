import { generateFillCode } from '../lib/gemini.js';

const $ = (id) => document.getElementById(id);
const statusEl = $('status');

function setStatus(msg, kind = 'busy') {
  statusEl.textContent = msg;
  statusEl.className = `status ${kind}`;
}

async function getSettings() {
  const s = await chrome.storage.sync.get({ apiKey: '', model: 'gemini-2.5-flash' });
  // auto-migrate deprecated models (e.g. gemini-2.0-flash)
  if (!s.model || s.model.startsWith('gemini-2.0')) s.model = 'gemini-2.5-flash';
  return s;
}

// ---- functions injected into the page (must be self-contained) ----
function extractFormFromPage() {
  const forms = Array.from(document.querySelectorAll('form'));
  const score = (f) => f.querySelectorAll('input, select, textarea').length;
  let target = null;
  const active = document.activeElement;
  if (active && active.closest) target = active.closest('form');
  if (!target && forms.length) target = forms.slice().sort((a, b) => score(b) - score(a))[0];
  if (!target) return null;
  return target.outerHTML;
}

function runCodeInPage(code) {
  try {
    const s = document.createElement('script');
    s.textContent = code;
    (document.head || document.documentElement).appendChild(s);
    s.remove();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

// ---- main flow ----
async function fillForm() {
  const fillBtn = $('fillBtn');
  const prompt = $('prompt').value.trim();
  if (!prompt) { setStatus('Please describe the data first.', 'err'); return; }

  const { apiKey, model } = await getSettings();
  if (!apiKey) { setStatus('Gemini key is not set. Enter it in Options.', 'err'); return; }

  fillBtn.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('No active tab found.');

    setStatus('Reading the page form…');
    const [{ result: formHtml } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFormFromPage
    });
    if (!formHtml) throw new Error('No form was found on this page.');

    setStatus('Generating code with Gemini…');
    const code = await generateFillCode({ apiKey, model, userPrompt: prompt, formHtml });

    $('codeOut').textContent = code;
    $('codeBox').classList.remove('hidden');

    setStatus('Running the code on the page…');
    const [{ result: runRes } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: runCodeInPage,
      args: [code]
    });
    if (!runRes || !runRes.ok) throw new Error('Failed to run the code: ' + ((runRes && runRes.error) || 'unknown'));

    setStatus('✅ Done. The form was filled.', 'ok');
  } catch (err) {
    setStatus('Error: ' + ((err && err.message) || err), 'err');
  } finally {
    fillBtn.disabled = false;
  }
}

// ---- wiring ----
document.addEventListener('DOMContentLoaded', async () => {
  const { apiKey } = await getSettings();
  if (!apiKey) $('noKey').classList.remove('hidden');
  $('fillBtn').addEventListener('click', fillForm);
  $('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('openOptions').addEventListener('click', (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
});
