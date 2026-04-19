/**
 * Public-facing leather name: metaobject `name` when present.
 * Form dropdowns use `label` (e.g. blended collection line when set — see `getLeatherColorsFromShopify`).
 * Falls back to `label` when `name` is missing.
 * @param {{ name?: string, label?: string } | null | undefined} leather
 * @returns {string}
 */
export function leatherNameForListing(leather) {
  if (!leather) return "";
  const n = typeof leather.name === "string" ? leather.name.trim() : "";
  if (n) return n;
  return typeof leather.label === "string" ? leather.label.trim() : "";
}
