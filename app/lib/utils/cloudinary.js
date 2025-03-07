import { v2 as cloudinary } from 'cloudinary';

// Helper function to get environment-specific variables
const getEnvironmentConfig = () => {
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
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME,
    isProduction: process.env.NODE_ENV === 'production',
    isStaging: process.env.RAILWAY_ENVIRONMENT_NAME === 'staging',
  });
  console.error('Available environment variables:', 
    Object.keys(process.env)
      .filter(key => key.includes('CLOUDINARY') || key.includes('SHOPIFY'))
      .map(key => `${key}: ${process.env[key] ? '[SET]' : '[NOT SET]'}`)
  );
  throw new Error(`Missing required Cloudinary configuration: ${missingConfig.join(', ')}`);
}

cloudinary.config(config);

console.log('Cloudinary Configuration:', {
  cloud_name: config.cloud_name,
  api_key: config.api_key ? '***' : undefined,
  api_secret: config.api_secret ? '***' : undefined,
  isConfigured: cloudinary.config().cloud_name === config.cloud_name,
  environment: {
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME,
    isProduction: process.env.NODE_ENV === 'production',
    isStaging: process.env.RAILWAY_ENVIRONMENT_NAME === 'staging',
  }
});

export const uploadToCloudinary = async (file) => {
  console.log('=== Cloudinary Upload START ===');
  
  if (!cloudinary.config().cloud_name) {
    throw new Error('Cloudinary is not properly configured');
  }

  console.log('Received file:', {
    name: file.name,
    type: file.type,
    size: file.size
  });

  try {
    console.log('Converting file to base64');
    // Convert file to base64
    const base64Data = await file.arrayBuffer().then(buffer => 
      Buffer.from(buffer).toString('base64')
    );
    console.log('File converted to base64');
    
    // Upload to Cloudinary
    console.log('Initiating Cloudinary upload');
    const result = await cloudinary.uploader.upload(
      `data:${file.type};base64,${base64Data}`,
      {
        folder: 'product-options',
        resource_type: 'auto',
        timeout: 60000, // 60 second timeout
      }
    );
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
      stack: error.stack,
      code: error.http_code,
      details: error.error?.message || error.error
    });
    console.log('=== Cloudinary Upload END (with error) ===');
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  console.log('=== Cloudinary Delete START ===');
  console.log('Deleting publicId:', publicId);

  try {
    const result = await cloudinary.uploader.destroy(publicId);
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