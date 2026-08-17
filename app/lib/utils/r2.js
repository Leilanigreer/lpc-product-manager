import { formatUnknownApiError } from "./formatApiError.js";
import {
  buildR2ObjectKey,
  fileExtensionFromName,
} from "./r2Paths.js";

export const formatR2UploadErrorMessage = formatUnknownApiError;

async function shopifyAuthHeaders(extra = {}) {
  const headers = { ...extra };
  try {
    if (typeof window !== "undefined" && window.shopify?.idToken) {
      headers.Authorization = `Bearer ${await window.shopify.idToken()}`;
    }
  } catch {
    // Session cookies may still authenticate the Remix action.
  }
  return headers;
}

function resolveKey(file, { collection, folder, sku, label, key: existingKey } = {}) {
  if (typeof existingKey === "string" && existingKey.trim()) {
    return existingKey.trim().replace(/^\/+/, "");
  }
  return buildR2ObjectKey({
    collection,
    folder,
    sku,
    label,
    ext: fileExtensionFromName(file.name || "image.jpg", file.type),
  });
}

async function uploadViaServer(file, key, meta) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("key", key);
  if (meta.collection) formData.append("collection", meta.collection);
  if (meta.folder) formData.append("folder", meta.folder);
  if (meta.sku) formData.append("sku", meta.sku);
  if (meta.label) formData.append("label", meta.label);

  const response = await fetch("/api/upload/r2", {
    method: "POST",
    credentials: "same-origin",
    headers: await shopifyAuthHeaders(),
    body: formData,
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    throw new Error(
      formatUnknownApiError(payload?.error) ||
        formatUnknownApiError(payload) ||
        "R2 upload failed"
    );
  }
  if (!payload.key || !payload.url) {
    throw new Error("R2 upload response was missing key or url.");
  }
  return { key: payload.key, url: payload.url };
}

/**
 * Upload the original file to R2. Tries a presigned PUT first (needs bucket CORS);
 * falls back to a server PutObject so uploads work before CORS is configured.
 */
export async function uploadToR2(
  file,
  { collection, folder, sku, label, key: existingKey } = {}
) {
  if (!(file instanceof File) && !(file instanceof Blob)) {
    throw new Error("A file is required for R2 upload.");
  }

  const fileName = file.name || "image.jpg";
  const contentType = file.type || "application/octet-stream";
  const key = resolveKey(file, { collection, folder, sku, label, key: existingKey });
  const meta = { collection, folder, sku, label };

  try {
    const signatureResponse = await fetch("/api/upload/r2/presign", {
      method: "POST",
      headers: await shopifyAuthHeaders({ "Content-Type": "application/json" }),
      credentials: "same-origin",
      body: JSON.stringify({
        key,
        collection,
        folder,
        sku,
        label,
        fileName,
        contentType,
      }),
    });

    let signaturePayload = {};
    try {
      signaturePayload = await signatureResponse.json();
    } catch {
      signaturePayload = {};
    }

    if (signatureResponse.ok && signaturePayload.uploadUrl && signaturePayload.key) {
      const putResponse = await fetch(signaturePayload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": signaturePayload.contentType || contentType,
        },
        body: file,
      });
      if (putResponse.ok) {
        return {
          key: signaturePayload.key,
          url: signaturePayload.publicUrl,
        };
      }
    }
  } catch {
    // Fall through to server upload (typical when bucket CORS is not set yet).
  }

  return uploadViaServer(file, key, meta);
}

export async function uploadClaudePreviewToR2(file) {
  const ext = fileExtensionFromName(file?.name, file?.type);
  const key = `products/_claude-preview/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${ext}`;
  return uploadToR2(file, { key });
}
