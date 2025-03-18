import { Cloudinary } from "@cloudinary/url-gen";

// Helper function to get environment-specific variables
const getEnvironmentConfig = () => {
  // For client-side, use window.ENV
  if (typeof window !== 'undefined' && window.ENV) {
    return {
      cloud_name: window.ENV.CLOUDINARY_CLOUD_NAME,
      api_key: window.ENV.CLOUDINARY_API_KEY,
      api_secret: window.ENV.CLOUDINARY_API_SECRET,
    };
  }

  // For server-side, use process.env
  if (typeof process !== 'undefined' && process.env) {
    // For Railway (staging and production)
    if (process.env.RAILWAY_ENVIRONMENT_NAME) {
      return {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      };
    }

    // For local development
    if (process.env.NODE_ENV === 'development') {
      return {
        cloud_name: process.env.SHOPIFY_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.SHOPIFY_CLOUDINARY_API_KEY,
        api_secret: process.env.SHOPIFY_CLOUDINARY_API_SECRET,
      };
    }

    // Fallback to standard env vars
    return {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };
  }

  // If neither context is available, throw an error
  throw new Error('Cloudinary configuration is not available in this context');
};

// Configure Cloudinary
const config = getEnvironmentConfig();

// Check if all required config is present
const missingConfig = Object.entries(config)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.error('Missing Cloudinary configuration:', missingConfig);
  console.error('Environment details:', {
    isClient: typeof window !== 'undefined',
    isServer: typeof process !== 'undefined',
    NODE_ENV: typeof process !== 'undefined' ? process.env.NODE_ENV : undefined,
    RAILWAY_ENVIRONMENT_NAME: typeof process !== 'undefined' ? process.env.RAILWAY_ENVIRONMENT_NAME : undefined,
    isProduction: typeof process !== 'undefined' ? process.env.NODE_ENV === 'production' : undefined,
    isStaging: typeof process !== 'undefined' ? process.env.RAILWAY_ENVIRONMENT_NAME === 'staging' : undefined,
  });
  throw new Error(`Missing required Cloudinary configuration: ${missingConfig.join(', ')}`);
}

// Configure Cloudinary with the new SDK
const cld = new Cloudinary({
  cloud: {
    cloudName: config.cloud_name
  }
});

// Only log configuration in development
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  console.log('Cloudinary Configuration:', {
    cloud_name: config.cloud_name,
    api_key: config.api_key ? '***' : undefined,
    api_secret: config.api_secret ? '***' : undefined,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME,
      isProduction: process.env.NODE_ENV === 'production',
      isStaging: process.env.RAILWAY_ENVIRONMENT_NAME === 'staging',
    }
  });
}

export const uploadToCloudinary = async (file, customPublicId = null) => {
  console.log('=== Cloudinary Upload START ===');
  
  if (!config.cloud_name) {
    throw new Error('Cloudinary is not properly configured');
  }

  console.log('Received file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    customPublicId
  });

  try {
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'product-images'); // Using product-images upload preset
    
    // If custom public ID is provided, add it to the form data
    if (customPublicId) {
      formData.append('public_id', customPublicId);
    }

    // Log the form data for debugging (excluding sensitive info)
    console.log('Upload form data:', {
      file: file.name,
      upload_preset: 'product-images',
      public_id: customPublicId
    });

    // Upload to Cloudinary
    console.log('Initiating Cloudinary upload');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud_name}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Upload failed: ${response.statusText} - ${errorData.error?.message || ''}`);
    }

    const result = await response.json();
    console.log('Cloudinary upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height
    });

    console.log('=== Cloudinary Upload END ===');
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', {
      message: error.message,
      stack: error.stack
    });
    console.log('=== Cloudinary Upload END (with error) ===');
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  console.log('=== Cloudinary Delete START ===');
  console.log('Deleting publicId:', publicId);

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = await generateSignature({
      public_id: publicId,
      timestamp: timestamp,
      api_key: config.api_key
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          signature: signature,
          api_key: config.api_key,
          timestamp: timestamp
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Delete result:', result);
    console.log('=== Cloudinary Delete END ===');
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    console.error('Error stack:', error.stack);
    console.log('=== Cloudinary Delete END (with error) ===');
    throw new Error('Failed to delete image');
  }
};

// Helper function to generate signature for upload and delete operations
const generateSignature = async (params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const signatureString = sortedParams + config.api_secret;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Export the Cloudinary instance for URL generation
export { cld }; 