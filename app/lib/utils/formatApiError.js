/**
 * Normalizes API / thrown values into a display-safe string.
 * Avoids "[object Object]" from coercing non-string `message` fields.
 */
export function formatUnknownApiError(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const s = value.trim();
    return s;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Error) {
    return formatUnknownApiError(value.message) || value.name || "";
  }
  if (typeof value === "object") {
    if (typeof value.message === "string" && value.message.trim()) return value.message.trim();
    if (typeof value.error === "string" && value.error.trim()) return value.error.trim();
    if (Array.isArray(value.errors) && value.errors.length > 0) {
      const joined = value.errors
        .map((e) => formatUnknownApiError(e))
        .filter(Boolean)
        .join("; ");
      if (joined) return joined;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value).trim();
}
