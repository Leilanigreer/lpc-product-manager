// app/lib/utils/imageCompression.js

/**
 * Client-side JPEG re-encode for Google Drive uploads.
 *
 * Why this exists: the Drive upload route (`api.upload.googledrive.js`) parses multipart with
 * `unstable_createMemoryUploadHandler({ maxPartSize: 10_000_000 })`. Modern phone JPEGs and any
 * non-trivial PNG screenshot regularly exceed 10 MB and fail with
 *   Field "file" exceeded upload size of 10000000 bytes.
 *
 * Strategy:
 *  1. Decode via `createImageBitmap(file, { imageOrientation: 'from-image' })` so EXIF rotation is
 *     baked in (otherwise iPhone portrait shots come out sideways once the EXIF tag is dropped).
 *  2. If the long edge > `maxLongEdgePx`, downscale to that on `OffscreenCanvas` (fallback to a
 *     hidden `<canvas>` for older Safari < 16.4 / browsers without OffscreenCanvas support).
 *  3. Encode JPEG iteratively at decreasing quality (0.85, 0.7, 0.55, 0.4). If still over the
 *     target, shrink dimensions by 0.85 and retry. Cap total attempts to avoid pathological loops.
 *  4. Always returns a `File` named `{originalStem}.jpg` so multipart form data stays clean.
 *
 * Transparency: by request, this always re-encodes to JPEG (no alpha preservation). PNG screenshots
 * with transparency become opaque (white background) — acceptable for product/group/variant photos.
 *
 * Only JPEG/PNG input is supported (matches existing reference-image policy). HEIC is rejected
 * earlier in the flow; this function does not need to handle it.
 */

const DEFAULT_MAX_BYTES = 8_000_000;
const DEFAULT_MAX_LONG_EDGE_PX = 3500;
const DEFAULT_START_QUALITY = 0.85;
const QUALITY_FLOOR = 0.4;
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4];
const DIMENSION_SHRINK_FACTOR = 0.85;
const MAX_ATTEMPTS = 8;

const JPEG_TYPES = new Set(["image/jpeg", "image/jpg"]);
const PNG_TYPES = new Set(["image/png"]);

function isSupportedImage(file) {
  if (!(file instanceof File)) return false;
  const t = (file.type || "").toLowerCase();
  if (JPEG_TYPES.has(t) || PNG_TYPES.has(t)) return true;
  const name = (file.name || "").toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".jpe") ||
    name.endsWith(".png")
  );
}

function stemForJpeg(originalName) {
  const base = String(originalName || "image").replace(/\.[^.]+$/i, "").trim();
  return base.length ? base : "image";
}

/**
 * Draws `bitmap` into a canvas at `width` × `height`. Prefers OffscreenCanvas when available,
 * falls back to a detached HTMLCanvasElement so the function works on older Safari.
 *
 * @returns {Promise<Blob>} JPEG blob at the requested quality.
 */
async function encodeJpeg(bitmap, width, height, quality) {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create 2D drawing context.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  }

  if (typeof document === "undefined") {
    throw new Error("Image compression requires a browser environment.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create 2D drawing context.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode JPEG."));
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Re-encode an image (JPEG or PNG) so it stays under the multipart limit imposed by the
 * Drive upload route.
 *
 * @param {File} file
 * @param {object} [opts]
 * @param {number} [opts.maxBytes=8_000_000]      Target ceiling for the returned File.
 * @param {number} [opts.maxLongEdgePx=3500]      Initial long-edge cap (px).
 * @param {number} [opts.startQuality=0.85]       Starting JPEG quality (0..1).
 * @returns {Promise<File>} A JPEG `File` ≤ `maxBytes` (best effort within `MAX_ATTEMPTS`).
 */
export async function compressImageForGoogleDrive(file, opts = {}) {
  if (!isSupportedImage(file)) {
    throw new Error(
      "Only JPEG or PNG images can be uploaded. Please export as JPEG or PNG and try again."
    );
  }

  const {
    maxBytes = DEFAULT_MAX_BYTES,
    maxLongEdgePx = DEFAULT_MAX_LONG_EDGE_PX,
    startQuality = DEFAULT_START_QUALITY,
  } = opts;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (err) {
    /** Some older browsers ignore the options arg. Retry without it before giving up. */
    try {
      bitmap = await createImageBitmap(file);
    } catch (innerErr) {
      void innerErr;
      void err;
      throw new Error("Could not prepare this image for upload.");
    }
  }

  try {
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    if (!sourceWidth || !sourceHeight) {
      throw new Error("Could not prepare this image for upload.");
    }

    let targetLongEdge = Math.min(
      Math.max(sourceWidth, sourceHeight),
      maxLongEdgePx
    );

    const qualitySteps = QUALITY_STEPS.filter((q) => q <= startQuality);
    if (qualitySteps.length === 0) qualitySteps.push(QUALITY_FLOOR);

    let bestBlob = null;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      const scale = targetLongEdge / Math.max(sourceWidth, sourceHeight);
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));

      for (const quality of qualitySteps) {
        attempts += 1;
        const blob = await encodeJpeg(bitmap, width, height, quality);
        if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
        if (blob.size <= maxBytes) {
          return new File([blob], `${stemForJpeg(file.name)}.jpg`, {
            type: "image/jpeg",
            lastModified: file.lastModified || Date.now(),
          });
        }
        if (attempts >= MAX_ATTEMPTS) break;
      }

      /** All quality steps still too large; shrink dimensions and try again. */
      const nextLongEdge = Math.floor(targetLongEdge * DIMENSION_SHRINK_FACTOR);
      if (nextLongEdge < 600 || nextLongEdge >= targetLongEdge) break;
      targetLongEdge = nextLongEdge;
    }

    /** Couldn't get under target — return the smallest attempt anyway. The route may still
     *  reject it; surfaced to the user as a normal Drive error. */
    if (bestBlob) {
      return new File([bestBlob], `${stemForJpeg(file.name)}.jpg`, {
        type: "image/jpeg",
        lastModified: file.lastModified || Date.now(),
      });
    }
    throw new Error("Could not prepare this image for upload.");
  } finally {
    if (typeof bitmap?.close === "function") bitmap.close();
  }
}
