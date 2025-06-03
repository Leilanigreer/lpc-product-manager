// app/lib/utils/cloudinary.js
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
    // Use SHOPIFY_CLOUDINARY_* variables for all environments
    return {
      cloud_name: process.env.SHOPIFY_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.SHOPIFY_CLOUDINARY_API_KEY,
      api_secret: process.env.SHOPIFY_CLOUDINARY_API_SECRET,
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

const cld = new Cloudinary({
  cloud: {
    cloudName: config.cloud_name
  }
});

// Helper function to get folder path from Cloudinary
export const getCloudinaryFolderPath = async (assetFolder) => {
  try {
    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${config.api_key}:${config.api_secret}`).toString('base64');
    
    // Construct the URL with the provided assetFolder
    const url = `https://api.cloudinary.com/v1_1/${config.cloud_name}/folders/search?expression=path=${assetFolder}`;

    // Make the GET request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    // Get the response text first
    const responseText = await response.text();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to parse response:', parseError);
        console.error('Response text:', responseText);
      }
      return null;
    }

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Search failed:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
      }
      return null;
    }
    
    if (!result.folders || result.folders.length === 0) {
      return null;
    }

    // Get the external_id from the first folder in the results
    return result.folders[0].external_id;
  } catch (error) {
    console.error('Error getting folder path:', error);
    console.error('Error stack:', error.stack);
    return null;
  }
};

export const uploadToCloudinary = async (file, customPublicId = null, collection = null, productPictureFolder = null) => {
  if (!config.cloud_name) {
    throw new Error('Cloudinary is not properly configured');
  }

  try {
    // Create form data for upload
    const formData = new FormData();
    
    // Create a new File object with the custom filename if provided
    const fileToUpload = customPublicId 
      ? new File([file], `${customPublicId}.${file.name.split('.').pop()}`, { type: file.type })
      : file;
    
    formData.append('file', fileToUpload);
    formData.append('upload_preset', 'product-images'); // Using product-images upload preset
    
    // Set the asset folder based on collection and productPictureFolder
    if (collection) {
      const assetFolder = productPictureFolder 
        ? `products/${collection}/${productPictureFolder}`
        : `products/${collection}`;
      formData.append('asset_folder', assetFolder);
    }
    
    // If custom public ID is provided, add it to the form data
    // Ensure public_id includes the products prefix and collection
    if (customPublicId) {
      let fullPublicId = customPublicId;
      if (!fullPublicId.startsWith('products/')) {
        fullPublicId = `products/${fullPublicId}`;
      }
      formData.append('public_id', fullPublicId);
    }

    // Make the upload request
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud_name}/auto/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const updateCloudinaryImage = async (publicId, newImage) => {
  try {
    // Create form data for upload
    const formData = new FormData();
    
    // Create a new File object with the same public_id
    const fileToUpload = new File([newImage], `${publicId}.${newImage.name.split('.').pop()}`, { type: newImage.type });
    
    formData.append('file', fileToUpload);
    formData.append('upload_preset', 'product-images');
    formData.append('public_id', publicId);
    formData.append('overwrite', 'true');
    formData.append('invalidate', 'true');

    // Make the upload request
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud_name}/auto/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary update failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Update failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary update error:', error);
    throw error;
  }
};

// Export the Cloudinary instance for URL generation
export { cld }; 

// Add this to your existing cloudinary.js file

export const uploadToCloudinaryWithSignature = async (file, publicId, collection = null, productPictureFolder = null) => {
  if (!config.cloud_name) {
    throw new Error('Cloudinary is not properly configured');
  }

  try {
    console.log('=== Cloudinary Signed Upload START ===');
    console.log('Uploading to Cloudinary:', { publicId, collection, productPictureFolder });
    
    // Request signature from server
    const signatureResponse = await fetch('/api/cloudinary/signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        publicId,
        collection,
        productPictureFolder
      })
    });

    if (!signatureResponse.ok) {
      const error = await signatureResponse.json();
      throw new Error(`Failed to get signature: ${error.error || signatureResponse.statusText}`);
    }

    const signatureData = await signatureResponse.json();
    console.log('Received signature data:', signatureData);
    
    // Create form data for upload
    const formData = new FormData();
    
    // Add the file
    formData.append('file', file);
    
    // Add all parameters from the signature response
    Object.entries(signatureData).forEach(([key, value]) => {
      if (key !== 'signature' && value !== undefined) {
        formData.append(key, value);
      }
    });
    
    // Add the signature last
    formData.append('signature', signatureData.signature);
    
    // Make the upload request
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Upload successful:', result);
    console.log('=== Cloudinary Signed Upload END ===');
    return result;
  } catch (error) {
    console.error('Cloudinary signed upload error:', error);
    console.error('Error stack:', error.stack);
    console.log('=== Cloudinary Signed Upload END (with error) ===');
    throw error;
  }
};