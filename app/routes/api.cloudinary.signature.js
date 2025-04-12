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
    
    // Build parameters object in the exact order Cloudinary expects
    const params = {
      asset_folder: collection && productPictureFolder 
        ? `products/${collection}/${productPictureFolder}`
        : collection 
          ? `products/${collection}`
          : undefined,
      invalidate: "true",
      overwrite: "true",
      public_id: publicId,
      timestamp: timestamp
    };

    // Remove undefined values
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
    
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
    
    // Return all parameters needed for the form data
    return json({
      ...params,
      signature,
      api_key: process.env.SHOPIFY_CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error("Signature generation error:", error);
    return json({ error: error.message }, { status: 500 });
  }
}