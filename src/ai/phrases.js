const DEFAULT_PHRASES = {
  disambiguate_found_two: 'I found 2 hiro in your contact list, which one do you mean?',
  compose_prompt: 'What would you like to say?',
  confirm_message_to: 'Confirm message to {{name}}.',
  confirm_ready_send: 'Ready to send?',
  edit_message: 'Edit your message.',
  contact_not_found: 'Contact not found.',
};

let phraseMap = { ...DEFAULT_PHRASES };

function applyTemplate(text, vars = {}) {
  return String(text || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function initPhrases() {
  try {
    const res = await fetch('/api/phrases', { method: 'GET' });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const phrases = data?.phrases;
    if (!phrases || typeof phrases !== 'object') return;
    phraseMap = { ...DEFAULT_PHRASES, ...phrases };
  } catch {
    // keep defaults
  }
}

export function phrase(key, vars = {}) {
  const value = phraseMap[key];
  const fallback = DEFAULT_PHRASES[key] || '';
  return applyTemplate(value || fallback, vars);
}

export function allPhrases() {
  return { ...phraseMap };
}
