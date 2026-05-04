// app/lib/server/shopifyStagedProductMedia.server.js
/**
 * Shopify Admin staged upload for product images (no public CDN URL required).
 * @see https://shopify.dev/docs/api/admin-graphql/latest/mutations/stagedUploadsCreate
 */

const STAGED_UPLOADS_CREATE = `#graphql
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/** Filename safe for staged upload (alphanumeric, dot, hyphen, underscore). */
export function safeStagedFilename(name) {
  if (typeof name !== "string" || !name.trim()) return "";
  const trimmed = name.trim().replace(/[^a-zA-Z0-9._-]+/g, "_");
  return trimmed.length > 120 ? trimmed.slice(-120) : trimmed;
}

export function mimeForStagedProductImage(mimeType, fileName) {
  if (typeof mimeType === "string" && mimeType.startsWith("image/")) {
    return mimeType.split(";")[0].trim();
  }
  const lower = String(fileName || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
}

function extensionForMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/heic" || mime === "image/heif") return "heic";
  return "jpg";
}

/**
 * Upload image bytes to Shopify’s staged storage; returns `resourceUrl` for `productUpdate` media `originalSource`.
 *
 * @param {{ graphql: Function }} admin - Authenticated Admin API client (`admin.graphql`)
 * @param {Buffer} buffer
 * @param {string} filename - Must include an extension consistent with `mimeType`
 * @param {string} mimeType - e.g. image/jpeg
 * @returns {Promise<string>} resourceUrl
 */
export async function uploadBufferAsStagedProductImage(
  admin,
  buffer,
  filename,
  mimeType
) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("uploadBufferAsStagedProductImage: non-empty buffer required");
  }
  /** Shopify product image limit (see Admin “Manage media” docs). */
  const maxBytes = 20 * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw new Error(
      `uploadBufferAsStagedProductImage: file is ${buffer.length} bytes (max ${maxBytes})`
    );
  }
  const fileSize = String(buffer.length);
  const stagedResponse = await admin.graphql(STAGED_UPLOADS_CREATE, {
    variables: {
      input: [
        {
          filename,
          mimeType,
          httpMethod: "POST",
          resource: "PRODUCT_IMAGE",
          fileSize,
        },
      ],
    },
  });
  const stagedJson = await stagedResponse.json();
  if (stagedJson.errors?.length) {
    throw new Error(stagedJson.errors.map((e) => e.message).join("; "));
  }
  const userErrors = stagedJson.data?.stagedUploadsCreate?.userErrors ?? [];
  if (userErrors.length) {
    throw new Error(userErrors.map((e) => e.message).join("; "));
  }
  const target = stagedJson.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target?.url || !target.resourceUrl) {
    throw new Error("stagedUploadsCreate: missing staged target url or resourceUrl");
  }

  const form = new FormData();
  for (const { name, value } of target.parameters) {
    form.append(name, value);
  }
  form.append("file", new Blob([buffer], { type: mimeType }), filename);

  const uploadRes = await fetch(target.url, { method: "POST", body: form });
  if (!uploadRes.ok) {
    const snippet = (await uploadRes.text()).slice(0, 500);
    throw new Error(`Staged binary upload failed: HTTP ${uploadRes.status} ${snippet}`);
  }

  return target.resourceUrl;
}

/**
 * Build a staged filename with a sane extension when the source name lacks one.
 *
 * @param {string} driveFileName
 * @param {string} mimeType
 * @param {string} driveFileId - used for a short unique suffix when renaming
 */
export function stagedFilenameFromDrive(driveFileName, mimeType, driveFileId) {
  const mime = mimeForStagedProductImage(mimeType, driveFileName);
  const ext = extensionForMime(mime);
  const safe = safeStagedFilename(driveFileName);
  if (safe && /\.[a-zA-Z0-9]{2,8}$/.test(safe)) {
    return safe;
  }
  const shortId =
    typeof driveFileId === "string" && driveFileId.length >= 8
      ? driveFileId.slice(0, 8)
      : "image";
  return `group-image-${shortId}.${ext}`;
}
