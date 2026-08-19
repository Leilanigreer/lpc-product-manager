/**
 * Generates the HTML content for the product creation notification email
 * @param {Object} data - The product data
 * @param {Object} data.product - The Shopify product data
 * @param {Object} data.databaseSave - The database save result
 * @param {Object} data.shop - The shop data
 * @param {string|null} [data.r2DashboardUrl] - Cloudflare dashboard URL listing this product's R2 objects
 * @param {boolean} data.hasImages - Whether the product has any images
 * @param {string} [data.notes] - Optional notes from product creation
 * @returns {string} The HTML content for the email
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateProductCreationNotification({ product, databaseSave, shop, r2DashboardUrl, hasImages, notes }) {
  const shopDomain = shop.myshopifyDomain?.replace('.myshopify.com', '');
  const productId = product.id.split('/').pop();
  const adminUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
  const googleDriveUrl = databaseSave.mainProduct.googleDriveFolderUrl;
  const cloudflareUrl =
    (typeof r2DashboardUrl === "string" && r2DashboardUrl.trim()) ||
    (typeof databaseSave?.mainProduct?.r2DashboardUrl === "string" &&
      databaseSave.mainProduct.r2DashboardUrl.trim()) ||
    "";
  const trimmedNotes = typeof notes === "string" ? notes.trim() : "";
  const notesHtml = trimmedNotes
    ? escapeHtml(trimmedNotes).replace(/\r\n|\r|\n/g, "<br>")
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Karl just created: ${product.title}</title>
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
          .warning {
            color: #d82c0d;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <p>Karl just created a new set on the website:</p>
          
          <p>Admin URL: <a href="${adminUrl}" class="link">${adminUrl}</a></p>
          
          ${hasImages ? `
            <p>Please work your magic on these product photos</p>
            ${googleDriveUrl ? `<p>Google Drive Folder: <a href="${googleDriveUrl}" class="link">${googleDriveUrl}</a></p>` : ""}
            ${cloudflareUrl ? `<p>Cloudflare Images: <a href="${cloudflareUrl}" class="link">${cloudflareUrl}</a></p>` : ""}
          ` : `
            <p class="warning">No images have been uploaded for this product yet.</p>
            <p>Ask Karl to upload images to Google Drive and Cloudflare R2.</p>
          `}
          ${notesHtml ? `
            <p><strong>Notes:</strong></p>
            <p>${notesHtml}</p>
          ` : ""}
        </div>
      </body>
    </html>
  `;
}

