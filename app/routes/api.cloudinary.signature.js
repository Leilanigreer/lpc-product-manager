import { json } from "@remix-run/node";
import crypto from 'crypto';

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const data = await request.json();
    const { publicId, collection, productPictureFolder } = data;
    
    if (!publicId) {
      return json({ error: "Missing publicId parameter" }, { status: 400 });
    }
    
    // Create timestamp
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Build parameters object
    const params = {
      public_id: publicId,
      timestamp: timestamp,
      overwrite: "true",
      invalidate: "true",
      upload_preset: "product-images"
    };
    
    // Add asset_folder if both collection and productPictureFolder are provided
    if (collection && productPictureFolder) {
      params.asset_folder = `products/${collection}/${productPictureFolder}`;
    } else if (collection) {
      params.asset_folder = `products/${collection}`;
    }
    
    // Create signature string: sort keys alphabetically and join with &
    const signatureString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&') + process.env.SHOPIFY_CLOUDINARY_API_SECRET;
    
    // Generate SHA-1 hash
    const signature = crypto
      .createHash('sha1')
      .update(signatureString)
      .digest('hex');
    
    return json({
      signature,
      timestamp,
      params,
      apiKey: process.env.SHOPIFY_CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error("Signature generation error:", error);
    return json({ error: error.message }, { status: 500 });
  }
}