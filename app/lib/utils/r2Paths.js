/**
 * Shared R2 object-key helpers (no secrets). Used by the browser uploader and the S3 server layer.
 */

export function sanitizeR2Segment(value) {
  return String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.\./g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^\w.\-()/]/g, "-");
}

export function slugLabel(label) {
  return String(label ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function fileExtensionFromName(fileName, mimeType = "") {
  const name = String(fileName || "");
  const fromName = name.includes(".") ? name.split(".").pop() : "";
  const type = String(mimeType || "").toLowerCase();
  if (type === "image/png" || fromName.toLowerCase() === "png") return "png";
  if (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    fromName.toLowerCase() === "jpeg" ||
    fromName.toLowerCase() === "jpg"
  ) {
    return "jpg";
  }
  const ext = (fromName || "jpg").toLowerCase();
  if (ext === "jpeg") return "jpg";
  return ext || "jpg";
}

export function buildR2Prefix({ collection, folder }) {
  const col = sanitizeR2Segment(collection);
  const fold = sanitizeR2Segment(folder);
  return `products/${col}/${fold}`;
}

export function buildR2ObjectKey({ collection, folder, sku, label, ext }) {
  const prefix = buildR2Prefix({ collection, folder });
  const skuSeg = sanitizeR2Segment(sku);
  const lab = slugLabel(label);
  const extension = sanitizeR2Segment(ext) || "jpg";
  return `${prefix}/${skuSeg}-${lab}.${extension}`;
}

export function joinPublicUrl(base, keyOrPrefix) {
  const b = String(base || "").replace(/\/+$/, "");
  const k = String(keyOrPrefix || "").replace(/^\/+/, "");
  if (!b || !k) return "";
  return `${b}/${k}`;
}

export function isFrontViewLabel(label) {
  const lab = slugLabel(label);
  return lab === "front" || lab === "front-view";
}

export function pickPrimaryVariantImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) return "";
  const withUrl = images.filter((img) => {
    const url = img?.r2Data?.url || img?.url;
    return typeof url === "string" && url.trim();
  });
  if (withUrl.length === 0) return "";
  const front = withUrl.find((img) => isFrontViewLabel(img.label || img.type || ""));
  const chosen = front || withUrl[0];
  return String(chosen.r2Data?.url || chosen.url || "").trim();
}
