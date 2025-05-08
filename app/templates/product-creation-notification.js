/**
 * Generates the HTML content for the product creation notification email
 * @param {Object} data - The product data
 * @param {Object} data.product - The Shopify product data
 * @param {Object} data.databaseSave - The database save result
 * @param {Object} data.shop - The shop data
 * @param {string} data.cloudinaryFolderId - The Cloudinary folder ID
 * @param {boolean} data.hasImages - Whether the product has any images
 * @returns {string} The HTML content for the email
 */
export function generateProductCreationNotification({ product, databaseSave, shop, cloudinaryFolderId, hasImages }) {
  const shopDomain = shop.myshopifyDomain?.replace('.myshopify.com', '');
  const productId = product.id.split('/').pop(); // Extract ID from gid://shopify/Product/123456789
  const adminUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
  const googleDriveUrl = databaseSave.mainProduct.googleDriveFolderUrl;
  const cloudinaryUrl = hasImages ? `https://console.cloudinary.com/console/c-978fe81eba4503099559efedf96dd2/media_library/folders/${cloudinaryFolderId}?view_mode=mosaic` : null;

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
            <p>Google Drive Folder: <a href="${googleDriveUrl}" class="link">${googleDriveUrl}</a></p>
            <p>Cloudinary URL: <a href="${cloudinaryUrl}" class="link">${cloudinaryUrl}</a></p>
          ` : `
            <p class="warning">No images have been uploaded for this product yet.</p>
            <p>Ask Karl to upload images to the Google Drive folder.</p>
          `}
        </div>
      </body>
    </html>
  `;
} 

