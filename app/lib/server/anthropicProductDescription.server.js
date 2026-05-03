/**
 * Claude Messages API — product description from reference image + title + collection examples.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/**
 * @param {object} params
 * @param {string} params.title
 * @param {unknown} params.examples — non-null JSON value from Shopify (object or array)
 * @param {string} params.imageBase64 — raw base64, no data: prefix
 * @param {"image/jpeg"|"image/png"} params.mediaType
 * @returns {Promise<string>} Plain description text
 */
export async function generateProductDescriptionViaClaude({
  title,
  examples,
  imageBase64,
  mediaType,
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  if (examples == null) {
    throw new Error("examples must be non-null for Claude generation.");
  }

  const allowed = new Set(["image/jpeg", "image/png"]);
  if (!allowed.has(mediaType)) {
    throw new Error("mediaType must be image/jpeg or image/png.");
  }

  if (typeof imageBase64 !== "string" || !imageBase64.trim()) {
    throw new Error("imageBase64 is required.");
  }

  const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    throw new Error("Image payload is too large.");
  }

  const titleStr = String(title ?? "").trim() || "Untitled";

  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64.trim(),
            },
          },
          {
            type: "text",
            text: `Product title: ${titleStr}\n\nExample descriptions for this collection:\n${JSON.stringify(examples)}\n\nWrite a product description in the same style. The headcovers are photographed in a workshop setting — focus on the leather materials, colors, textures, and quilted pattern visible on the covers, not the background.`,
          },
        ],
      },
    ],
  });

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      (typeof json === "string" ? json : null) ||
      res.statusText;
    throw new Error(msg || `Anthropic API error (${res.status})`);
  }

  const parts = json?.content;
  if (!Array.isArray(parts)) {
    throw new Error("Unexpected Anthropic response shape.");
  }

  const textBlock = parts.find((p) => p && p.type === "text");
  const text = String(textBlock?.text ?? "").trim();
  if (!text) {
    throw new Error("Empty description from model.");
  }

  return text;
}
