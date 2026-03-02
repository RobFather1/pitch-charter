export function safeParseJSON(raw, fallback) {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse stored value, using fallback.', e);
    return fallback;
  }
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`localStorage.setItem('${key}') failed:`, e);
  }
}
