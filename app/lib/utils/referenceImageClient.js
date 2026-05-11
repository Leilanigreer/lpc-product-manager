/**
 * Browser-only: convert uploaded file (HEIC/JPEG/PNG) to base64 + media type for Claude API.
 * Uses `heic2any` when it works; many iPhone HEIC variants fail its WASM libheif — then we upload
 * the original HEIC to Cloudinary and fetch a JPEG delivery URL (Cloudinary decodes HEIC server-side).
 *
 * Large images are normalized on the server with Sharp (see anthropicProductDescription.server.js)
 * before calling Anthropic — avoids double compression here and keeps the browser path simple.
 */

import { formatUnknownApiError } from "./formatApiError.js";

const MAX_FILE_BYTES = 40 * 1024 * 1024;

/** ISO BMFF `ftyp` brands used by Apple HEIC / HEIF (avoid relying on filename — Sharp on Linux often has no libheif). */
const HEIF_FAMILY_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "heif",
]);

/**
 * @param {Blob} blob
 * @returns {Promise<boolean>}
 */
async function blobLooksLikeHeifFamily(blob) {
  try {
    const buf = await blob.slice(0, 32).arrayBuffer();
    const v = new Uint8Array(buf);
    if (v.length < 12) return false;
    const typ = String.fromCharCode(v[4], v[5], v[6], v[7]);
    if (typ !== "ftyp") return false;
    const brand = String.fromCharCode(v[8], v[9], v[10], v[11]).toLowerCase();
    return HEIF_FAMILY_BRANDS.has(brand);
  } catch {
    return false;
  }
}

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

/** Insert JPEG format transformation after `/upload/` (Cloudinary delivery URL). */
function toCloudinaryJpegDeliveryUrl(secureUrl) {
  if (typeof secureUrl !== "string" || !secureUrl.includes("://")) return secureUrl;
  const marker = "/upload/";
  const i = secureUrl.indexOf(marker);
  if (i === -1) return secureUrl;
  const prefix = secureUrl.slice(0, i + marker.length);
  const suffix = secureUrl.slice(i + marker.length);
  if (suffix.startsWith("f_jpg")) return secureUrl;
  return `${prefix}f_jpg,q_90/${suffix}`;
}

/**
 * Upload HEIC to Cloudinary, then download as JPEG bytes (decoding happens on Cloudinary, not in WASM).
 * @param {File} heicFile
 * @returns {Promise<Blob>}
 */
async function convertHeicViaCloudinaryFallback(heicFile) {
  const { uploadToCloudinaryWithSignature } = await import("./cloudinary.js");
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `ref-${Date.now()}`;
  const publicIdTail = `_reference-heic-temp/${id}`;
  const collection = "_reference-heic-temp";

  const upload = await uploadToCloudinaryWithSignature(
    heicFile,
    publicIdTail,
    collection,
    null
  );
  const secure = upload?.secure_url;
  if (!secure || typeof secure !== "string") {
    throw new Error("Cloudinary upload returned no secure_url");
  }
  const jpegUrl = toCloudinaryJpegDeliveryUrl(secure);
  const res = await fetch(jpegUrl, { mode: "cors", credentials: "omit" });
  if (!res.ok) {
    throw new Error(`Cloudinary JPEG fetch failed (${res.status})`);
  }
  return res.blob();
}

/**
 * Converts HEIC in-browser when needed; returns JPEG/PNG bytes and a File for uploads.
 *
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

  /** @type {Blob} */
  let blob = file;
  const lower = file.name.toLowerCase();
  const sniffHeif = await blobLooksLikeHeifFamily(file);
  const isHeif =
    sniffHeif ||
    lower.endsWith(".heic") ||
    lower.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif";

  if (isHeif) {
    try {
      const heic2any = (await import("heic2any")).default;
      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.92,
      });
      blob = Array.isArray(converted) ? converted[0] : converted;
    } catch (heic2anyErr) {
      try {
        blob = await convertHeicViaCloudinaryFallback(file);
      } catch (cloudErr) {
        const wasm = formatUnknownApiError(heic2anyErr);
        const cloud = formatUnknownApiError(cloudErr);
        const wasmPart = wasm.trim() || "heic2any failed";
        const cloudPart = cloud.trim() ? `; Cloudinary: ${cloud}` : "";
        throw new Error(
          `Could not convert HEIC/HEIF (${wasmPart}${cloudPart}). Export as JPEG or PNG from Photos (or another editor) and upload again.`
        );
      }
    }
  }

  if (!(blob instanceof Blob)) {
    throw new Error("Could not convert image.");
  }

  let mediaType = blob.type === "image/png" ? "image/png" : "image/jpeg";
  if (!mediaType.startsWith("image/")) {
    mediaType = uint8StartsWithPng(new Uint8Array(await blob.slice(0, 8).arrayBuffer()))
      ? "image/png"
      : "image/jpeg";
  }

  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);

  if (isHeif && !uint8StartsWithJpeg(bytes) && !uint8StartsWithPng(bytes)) {
    throw new Error(
      "HEIC conversion did not produce a JPEG or PNG. Export the photo as JPEG or PNG and try again."
    );
  }

  if (!isHeif && (await blobLooksLikeHeifFamily(new Blob([bytes])))) {
    throw new Error(
      "This file looks like HEIC/HEIF but was not labeled as such. Rename it with a .heic extension or export as JPEG/PNG and upload again."
    );
  }

  if (!uint8StartsWithJpeg(bytes) && !uint8StartsWithPng(bytes)) {
    throw new Error(
      "Unsupported image format. Use JPEG, PNG, or HEIC/HEIF from an iPhone or Photos export."
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
  const normalizedFile = new File([blob], normalizedName, {
    type: mediaType,
    lastModified: file.lastModified,
  });

  return { base64, mediaType, previewBlob: blob, normalizedFile };
}
