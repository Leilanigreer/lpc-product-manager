/**
 * Browser-only: reference image → base64 + media type for Claude API.
 * **JPEG and PNG only** (no HEIC — avoids WASM/libheif and server-side Sharp HEIC issues).
 */

const MAX_FILE_BYTES = 40 * 1024 * 1024;

const JPEG_TYPES = new Set(["image/jpeg", "image/jpg"]);
const PNG_TYPES = new Set(["image/png"]);

function uint8StartsWithJpeg(bytes) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function uint8StartsWithPng(bytes) {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

function extensionLooksHeic(name) {
  const lower = String(name || "").toLowerCase();
  return lower.endsWith(".heic") || lower.endsWith(".heif");
}

function mimeLooksHeic(type) {
  const t = String(type || "").toLowerCase();
  return t === "image/heic" || t === "image/heif";
}

/**
 * @param {File} file
 * @returns {Promise<{ base64: string; mediaType: 'image/jpeg'|'image/png'; previewBlob: Blob; normalizedFile: File }>}
 */
export async function convertDroppedFileToReferenceImage(file) {
  if (!(file instanceof File)) {
    throw new Error("Invalid file.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image is too large (max 40 MB).");
  }

  if (extensionLooksHeic(file.name) || mimeLooksHeic(file.type)) {
    throw new Error(
      "HEIC/HEIF is not supported. In Photos: File → Export → Export unmodified original, or export as JPEG/PNG, then upload."
    );
  }

  const lower = file.name.toLowerCase();
  const isPngExt = lower.endsWith(".png");
  const isJpegExt =
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".jpe");

  if (!isPngExt && !isJpegExt && file.type && !JPEG_TYPES.has(file.type) && !PNG_TYPES.has(file.type)) {
    throw new Error("Please upload a .jpg, .jpeg, or .png reference image.");
  }

  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  let mediaType;
  if (uint8StartsWithPng(bytes)) {
    mediaType = "image/png";
  } else if (uint8StartsWithJpeg(bytes)) {
    mediaType = "image/jpeg";
  } else {
    throw new Error(
      "File is not a valid JPEG or PNG (wrong contents). Export as JPEG or PNG and try again."
    );
  }

  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  const base64 = btoa(binary);

  const ext = mediaType === "image/png" ? ".png" : ".jpg";
  const baseStem = file.name.replace(/\.[^.]+$/i, "").trim() || "reference";
  const normalizedName = `${baseStem}${ext}`;
  const previewBlob = new Blob([bytes], { type: mediaType });
  const normalizedFile = new File([previewBlob], normalizedName, {
    type: mediaType,
    lastModified: file.lastModified,
  });

  return { base64, mediaType, previewBlob, normalizedFile };
}
