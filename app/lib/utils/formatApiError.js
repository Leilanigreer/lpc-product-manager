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
    if (Array.isArray(value.message) && value.message.length > 0) {
      const joined = value.message
        .map((m) =>
          typeof m === "string" ? m.trim() : formatUnknownApiError(m)
        )
        .filter(Boolean)
        .join("; ");
      if (joined) return joined;
    }
    if (typeof value.message === "string" && value.message.trim()) return value.message.trim();
    if (typeof value.error === "string" && value.error.trim()) return value.error.trim();
    if (Array.isArray(value.errors) && value.errors.length > 0) {
      const joined = value.errors
        .map((e) => formatUnknownApiError(e))
        .filter(Boolean)
        .join("; ");
      if (joined) return joined;
    }
    const name = typeof value.name === "string" ? value.name.trim() : "";
    const code = value.code;
    const codePart =
      code !== undefined && code !== null && code !== ""
        ? String(code)
        : "";
    if (name || codePart) {
      const msg =
        typeof value.message === "string" && value.message.trim()
          ? value.message.trim()
          : formatUnknownApiError(value.message);
      const bits = [name, codePart, msg].filter(Boolean);
      if (bits.length) return bits.join(": ");
    }
    try {
      return JSON.stringify(value);
    } catch {
      return Object.prototype.toString.call(value);
    }
  }
  return String(value).trim();
}

/** Shopify Admin GraphQL HTTP bodies use `errors: [{ message?: ... }]`. Join without stringifying nested objects as "[object Object]". */
export function formatShopifyGraphqlErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return "";
  return errors
    .map((e) => formatUnknownApiError(e))
    .filter(Boolean)
    .join("; ");
}
