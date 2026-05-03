// app/lib/generators/htmlDescription.js

/**
 * Escape text for safe inclusion in HTML.
 * @param {string} s
 */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Plain product description (from AI or hand entry) → minimal HTML for Shopify `descriptionHtml`.
 * Line breaks preserved as `<br/>`.
 * @param {string} plain
 */
export function plainProductDescriptionToHtml(plain) {
  const trimmed = String(plain ?? "").trim();
  if (!trimmed) return "";
  const withBreaks = escapeHtml(trimmed).replace(/\n/g, "<br/>");
  return `<div class="product-description">${withBreaks}</div>`;
}

/**
 * @deprecated Create-product now uses {@link plainProductDescriptionToHtml} only (no Postgres common block).
 * Retained for any legacy callers.
 */
export const generateDescriptionHTML = (formState, commonDescription) => {
  if (!formState?.collection?.description) {
    return "";
  }

  try {
    const { description, commonDescription: includeCommon } = formState.collection;

    const commonContent = Array.isArray(commonDescription)
      ? commonDescription.find((desc) => desc.isActive)?.content
      : null;

    const descriptionParts = [
      "<div>",
      "<br>",
      `<div><span>${description}</span></div>`,
      '<div><span></span><br></div>',
    ];

    if (includeCommon && commonContent) {
      descriptionParts.push(
        `<div><div><div>${commonContent}</div></div></div>`
      );
    }

    descriptionParts.push("</div>");
    return descriptionParts.join("").replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("Error generating HTML description:", error.message);
    return "";
  }
};
