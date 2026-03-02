export function safeParseJSON(raw, fallback) {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse stored value, using fallback.', e);
    return fallback;
  }
}
