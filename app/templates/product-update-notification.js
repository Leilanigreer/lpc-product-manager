/**
 * Product-update notification email — sent only when new variant images were uploaded.
 */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hasNewlyUploadedImageData(img) {
  if (!img || typeof img !== "object") return false;
  const r2Url = typeof img.r2Data?.url === "string" ? img.r2Data.url.trim() : "";
  if (r2Url) return true;
  const driveLink =
    typeof img.driveData?.webViewLink === "string"
      ? img.driveData.webViewLink.trim()
      : "";
  if (driveLink) return true;
  const fileId =
    typeof img.driveData?.fileId === "string" ? img.driveData.fileId.trim() : "";
  return Boolean(fileId);
}

/**
 * Variant images uploaded on this update submit (Drive and/or R2).
 * Existing Shopify media is not included — those rows have no driveData/r2Data.
 *
 * @param {object} productData
 * @returns {{ sku: string|null, label: string }[]}
 */
export function collectNewlyUploadedVariantImages(productData) {
  const items = [];
  const variants = Array.isArray(productData?.variants) ? productData.variants : [];
  for (const variant of variants) {
    const sku = String(variant?.sku || "").trim() || null;
    const images = Array.isArray(variant?.images) ? variant.images : [];
    for (const img of images) {
      if (!hasNewlyUploadedImageData(img)) continue;
      items.push({
        sku,
        label: String(img?.label || "").trim() || "image",
      });
    }
  }
  return items;
}

export function productDataHasNewlyUploadedImages(productData) {
  return collectNewlyUploadedVariantImages(productData).length > 0;
}

function numericProductId(productId) {
  const raw = String(productId || "");
  const fromGid = raw.match(/Product\/(\d+)/);
  if (fromGid) return fromGid[1];
  return raw.split("/").pop() || "";
}

function shopHandle(shop) {
  const domain =
    (typeof shop === "object" && shop?.myshopifyDomain) ||
    (typeof shop === "string" ? shop : "");
  return String(domain)
    .replace(/\.myshopify\.com$/i, "")
    .trim();
}

/**
 * @param {Object} data
 * @param {string} data.productId - Shopify Product GID or numeric id
 * @param {string} data.title
 * @param {string|{ myshopifyDomain?: string }} data.shop
 * @param {string} [data.googleDriveFolderUrl]
 * @param {string} [data.r2DashboardUrl]
 * @param {{ sku: string|null, label: string }[]} [data.newImages]
 * @returns {string}
 */
export function generateProductUpdateNotification({
  productId,
  title,
  shop,
  googleDriveFolderUrl,
  r2DashboardUrl,
  newImages,
}) {
  const handle = shopHandle(shop);
  const numericId = numericProductId(productId);
  const adminUrl =
    handle && numericId
      ? `https://admin.shopify.com/store/${handle}/products/${numericId}`
      : "";
  const safeTitle = escapeHtml(title || "a product");
  const googleDriveUrl =
    typeof googleDriveFolderUrl === "string" ? googleDriveFolderUrl.trim() : "";
  const cloudflareUrl =
    typeof r2DashboardUrl === "string" ? r2DashboardUrl.trim() : "";
  const imageRows = Array.isArray(newImages) ? newImages : [];
  const imageListHtml =
    imageRows.length > 0
      ? `<ul>${imageRows
          .map((row) => {
            const ident = row.sku
              ? `${escapeHtml(row.sku)} — ${escapeHtml(row.label)}`
              : escapeHtml(row.label);
            return `<li>${ident}</li>`;
          })
          .join("")}</ul>`
      : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Karl just updated: ${safeTitle}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            border: 1px solid #e1e1e1;
          }
          .link {
            color: #008060;
            text-decoration: none;
          }
          .link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <p>Karl just updated ${safeTitle} with new variant photos:</p>
          
          ${adminUrl ? `<p>Admin URL: <a href="${adminUrl}" class="link">${adminUrl}</a></p>` : ""}
          
          <p>Please work your magic on these product photos</p>
          ${imageListHtml}
          ${googleDriveUrl ? `<p>Google Drive Folder: <a href="${googleDriveUrl}" class="link">${escapeHtml(googleDriveUrl)}</a></p>` : ""}
          ${cloudflareUrl ? `<p>Cloudflare Images: <a href="${cloudflareUrl}" class="link">${escapeHtml(cloudflareUrl)}</a></p>` : ""}
        </div>
      </body>
    </html>
  `;
}
