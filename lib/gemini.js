// Gemini API client — builds the prompt, calls generateContent, extracts the JS code.

const SYSTEM_PROMPT = [
  'You are given an HTML form and a description written by the user in natural language.',
  'Output ONLY a single JavaScript code block (no explanations) that fills this form with the user data.',
  'The code runs in the page context, and jQuery may be available.',
  'General rules (the form can be anything):',
  '- Map each piece of user data to the most appropriate field, deciding by the field label, name, id, placeholder or type.',
  '- After setting a value, dispatch input and change events (bubbles: true). For checkbox/radio/select and custom dropdown widgets, set the value appropriately and dispatch the needed event.',
  '- If a field depends on another (its value or options load after another field changes), set the base field first, dispatch change, wait briefly, then set the dependent field.',
  '- If there is no data for a field, leave it untouched; never guess or fill a field incorrectly.',
  '- The code must be safe and must NOT submit the form; only fill the fields.',
  '- Return only the code, preferably inside a ```javascript block.'
].join('\n');

export async function generateFillCode({ apiKey, model = 'gemini-2.5-flash', userPrompt, formHtml }) {
  if (!apiKey) throw new Error('Gemini API key is not set. Open the Options page and enter your key.');
  if (!formHtml) throw new Error('No form was found on this page.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: `${SYSTEM_PROMPT}\n\nUser data:\n${userPrompt}\n\nForm HTML:\n${formHtml}` }]
    }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error?.message || ''; } catch { detail = await res.text().catch(() => ''); }
    throw new Error(`Gemini error (${res.status}): ${detail || 'unknown'}`);
  }

  const data = await res.json();
  const cand = data?.candidates?.[0];
  if (!cand) throw new Error('No response from Gemini (possibly blocked by a safety filter).');
  const text = (cand.content?.parts || []).map(p => p.text || '').join('');
  const code = extractCode(text);
  if (!code) throw new Error('No extractable code was found in the Gemini response.');
  return code;
}

function extractCode(text) {
  const fenced = text.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}
