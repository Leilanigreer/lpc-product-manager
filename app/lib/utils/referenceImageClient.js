/**
 * Browser-only: convert uploaded file (HEIC/JPEG/PNG) to base64 + media type for Claude API.
 * Uses dynamic import of `heic2any` so the module is not loaded on the server.
 *
 * Large images are normalized on the server with Sharp (see anthropicProductDescription.server.js)
 * before calling Anthropic — avoids double compression here and keeps the browser path simple.
 */

const MAX_FILE_BYTES = 40 * 1024 * 1024;

/**
 * @param {File} file
 * @returns {Promise<{ base64: string, mediaType: 'image/jpeg'|'image/png', previewBlob: Blob }>}
 */
export async function convertDroppedFileToReferenceImage(file) {
  if (!(file instanceof File)) {
    throw new Error("Invalid file.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image is too large (max 40 MB).");
  }

  /** @type {Blob} */
  let blob = file;
  const lower = file.name.toLowerCase();
  const isHeic =
    lower.endsWith(".heic") ||
    lower.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif";

  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    blob = Array.isArray(converted) ? converted[0] : converted;
  }

  if (!(blob instanceof Blob)) {
    throw new Error("Could not convert image.");
  }

  let mediaType = blob.type === "image/png" ? "image/png" : "image/jpeg";
  if (!mediaType.startsWith("image/")) {
    mediaType = "image/jpeg";
  }

  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  const base64 = btoa(binary);

  return { base64, mediaType, previewBlob: blob };
}
