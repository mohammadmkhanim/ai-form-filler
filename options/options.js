const apiKeyEl = document.getElementById('apiKey');
const modelEl = document.getElementById('model');
const savedEl = document.getElementById('saved');

function load() {
  chrome.storage.sync.get({ apiKey: '', model: 'gemini-2.5-flash' }, (s) => {
    apiKeyEl.value = s.apiKey;
    // migrate away from deprecated models
    modelEl.value = (!s.model || s.model.startsWith('gemini-2.0')) ? 'gemini-2.5-flash' : s.model;
  });
}

function save() {
  chrome.storage.sync.set({ apiKey: apiKeyEl.value.trim(), model: modelEl.value }, () => {
    savedEl.textContent = '✅ Saved';
    setTimeout(() => (savedEl.textContent = ''), 2000);
  });
}

document.addEventListener('DOMContentLoaded', load);
document.getElementById('save').addEventListener('click', save);
