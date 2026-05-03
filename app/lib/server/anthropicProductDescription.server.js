/**
 * Claude Messages API — product description from reference image + title + collection examples.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function messageFromAnthropicErrorBody(json, resStatus, rawText) {
  const err = json?.error;
  if (err && typeof err === "object" && typeof err.message === "string") {
    return err.message;
  }
  if (typeof err === "string") return err;
  if (typeof json?.message === "string") return json.message;
  if (rawText && rawText.length > 0 && rawText.length < 800 && !rawText.trim().startsWith("<")) {
    return rawText.trim();
  }
  return `Anthropic request failed (${resStatus}).`;
}

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

  const model =
    typeof process.env.ANTHROPIC_PRODUCT_DESCRIPTION_MODEL === "string" &&
    process.env.ANTHROPIC_PRODUCT_DESCRIPTION_MODEL.trim()
      ? process.env.ANTHROPIC_PRODUCT_DESCRIPTION_MODEL.trim()
      : "claude-sonnet-4-6";

  const body = JSON.stringify({
    model,
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

  const messagesJsonUtf8Bytes = Buffer.byteLength(body, "utf8");
  console.info("[anthropicProductDescription] outbound request size", {
    model,
    mediaType,
    imageDecodedApproxBytes: approxBytes,
    imageBase64CharLength: imageBase64.trim().length,
    messagesJsonUtf8Bytes,
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

  const rawText = await res.text();
  let json = {};
  try {
    json = rawText ? JSON.parse(rawText) : {};
  } catch {
    json = {};
  }

  if (!res.ok) {
    const msg = messageFromAnthropicErrorBody(json, res.status, rawText);
    const err = new Error(msg);
    err.status = res.status;
    throw err;
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
