/**
 * Claude Messages API — product description from reference image + title + collection examples.
 */

import sharp from "sharp";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
/** Anthropic Messages API: max ~5 MB decoded per image (docs.anthropic.com vision). */
const ANTHROPIC_MAX_DECODED_IMAGE_BYTES = 5 * 1024 * 1024;
/** Guardrail before Sharp — large workshop RAWs; output is always shrunk for Claude. */
const MAX_INCOMING_DECODED_BYTES = 28 * 1024 * 1024;
/** Anthropic recommends ~1568px long edge for vision; keeps payload well under 5MB. */
const VISION_MAX_EDGE = 1568;

/**
 * Assistant `message` objects use `content` as either a string or an array of blocks.
 * Sonnet 4.x may emit `thinking` (and multiple `text`) blocks; `max_tokens` must cover both.
 */
function extractAssistantTextFromMessage(aiJson) {
  const parts = aiJson?.content;
  if (typeof parts === "string") {
    return parts.trim();
  }
  if (!Array.isArray(parts)) {
    return "";
  }
  const chunks = [];
  for (const p of parts) {
    if (p && p.type === "text" && typeof p.text === "string") {
      const t = p.text.trim();
      if (t) chunks.push(t);
    }
  }
  return chunks.join("\n\n").trim();
}

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

  const trimmedB64 = imageBase64.trim();
  const approxIncoming = Math.ceil((trimmedB64.length * 3) / 4);
  if (approxIncoming > MAX_INCOMING_DECODED_BYTES) {
    throw new Error(
      `Reference image is about ${Math.ceil(approxIncoming / (1024 * 1024))}MB after decoding; max ${Math.floor(MAX_INCOMING_DECODED_BYTES / (1024 * 1024))}MB before processing.`
    );
  }

  let imageBase64ForApi;
  let mediaTypeForApi;
  try {
    const inputBuf = Buffer.from(trimmedB64, "base64");
    const outBuf = await sharp(inputBuf)
      .rotate()
      .resize({
        width: VISION_MAX_EDGE,
        height: VISION_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    if (outBuf.length > ANTHROPIC_MAX_DECODED_IMAGE_BYTES) {
      throw new Error(
        "Compressed image still exceeds Anthropic's 5MB per-image limit; try a smaller source file."
      );
    }
    imageBase64ForApi = outBuf.toString("base64");
    mediaTypeForApi = "image/jpeg";
  } catch (e) {
    if (e instanceof Error && e.message.includes("Anthropic's 5MB")) {
      throw e;
    }
    const hint = e instanceof Error ? e.message : String(e);
    throw new Error(`Could not prepare image for Claude (${hint}).`);
  }

  const titleStr = String(title ?? "").trim() || "Untitled";

  const model =
    typeof process.env.ANTHROPIC_PRODUCT_DESCRIPTION_MODEL === "string" &&
    process.env.ANTHROPIC_PRODUCT_DESCRIPTION_MODEL.trim()
      ? process.env.ANTHROPIC_PRODUCT_DESCRIPTION_MODEL.trim()
      : "claude-sonnet-4-6";

  const maxTokens = 8192;
  const userPromptText = `Product title: ${titleStr}\n\nExample descriptions for this collection:\n${JSON.stringify(examples)}\n\nWrite a product description in the same style. The headcovers are photographed in a workshop setting — focus on the leather materials, colors, textures, and quilted pattern visible on the covers, not the background.`;

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaTypeForApi,
            data: imageBase64ForApi,
          },
        },
        {
          type: "text",
          text: userPromptText,
        },
      ],
    },
  ];

  const requestObj = {
    model,
    max_tokens: maxTokens,
    messages,
  };

  const body = JSON.stringify(requestObj);

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

  const text = extractAssistantTextFromMessage(json);
  if (!text) {
    throw new Error("Empty description from model.");
  }

  return text;
}
