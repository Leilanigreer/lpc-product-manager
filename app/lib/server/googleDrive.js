// app/lib/server/googleDrive.js
import { google } from 'googleapis/build/src/index.js';

// Log authentication details
console.log('Google Drive Authentication Debug:');
console.log('GOOGLE_CLIENT_EMAIL exists:', !!process.env.GOOGLE_CLIENT_EMAIL);
console.log('GOOGLE_PRIVATE_KEY exists:', !!process.env.GOOGLE_PRIVATE_KEY);
console.log('GOOGLE_PROJECT_ID exists:', !!process.env.GOOGLE_PROJECT_ID);
console.log('GOOGLE_DRIVE_ROOT_FOLDER_ID exists:', !!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);

// Process private key to handle different formats
function processPrivateKey(privateKey) {
  if (!privateKey) {
    console.log('Private key is missing');
    return null;
  }
  
  console.log('Private key format check:');
  console.log('- Contains BEGIN marker:', privateKey.includes('-----BEGIN'));
  console.log('- Contains END marker:', privateKey.includes('-----END'));
  console.log('- Contains newlines:', privateKey.includes('\n'));
  console.log('- Contains escaped newlines:', privateKey.includes('\\n'));
  
  // If the key already has proper formatting, return it as is
  if (privateKey.includes('-----BEGIN') && privateKey.includes('-----END')) {
    console.log('Key has proper BEGIN/END markers, replacing escaped newlines if needed');
    // Replace escaped newlines with actual newlines if needed
    return privateKey.replace(/\\n/g, '\n');
  }
  
  // If the key doesn't have proper formatting, try to fix it
  try {
    // Try to decode if it's base64 encoded
    if (!privateKey.includes('-----BEGIN')) {
      console.log('Attempting to decode as base64');
      try {
        const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
        if (decoded.includes('-----BEGIN')) {
          console.log('Successfully decoded base64 key');
          return decoded;
        } else {
          console.log('Decoded but no BEGIN marker found');
        }
      } catch (e) {
        console.log('Not a base64 encoded key:', e.message);
      }
    }
    
    // If we still don't have a properly formatted key, try to construct one
    if (!privateKey.includes('-----BEGIN')) {
      console.log('Attempting to construct proper key format');
      // Check if the key contains newlines or escaped newlines
      if (privateKey.includes('\\n')) {
        // Replace escaped newlines with actual newlines
        const processedKey = privateKey.replace(/\\n/g, '\n');
        if (processedKey.includes('-----BEGIN')) {
          console.log('Successfully processed key with escaped newlines');
          return processedKey;
        }
      }
      
      // If the key doesn't have newlines, add them
      if (!privateKey.includes('\n')) {
        // Split the key into chunks of 64 characters
        const chunks = [];
        for (let i = 0; i < privateKey.length; i += 64) {
          chunks.push(privateKey.substring(i, i + 64));
        }
        
        const formattedKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----`;
        console.log('Constructed properly formatted key');
        return formattedKey;
      }
    }
  } catch (e) {
    console.error('Error processing private key:', e.message);
  }
  
  console.log('Returning original key as fallback');
  return privateKey;
}

// Create the Google Auth client with detailed error logging
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: processPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    project_id: process.env.GOOGLE_PROJECT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

// Create the Google Drive client
const drive = google.drive({ version: 'v3', auth });

// Helper function to find or create a folder
async function findOrCreateFolder(parentId, folderName, isCollection = false) {
  // List all folders in the parent
  const listResponse = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  
  // Use exact name matching for all folders
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (response.data.files && response.data.files.length > 0) {
    const folderId = response.data.files[0].id;
    // Get the webViewLink for the folder
    const folderDetails = await drive.files.get({
      fileId: folderId,
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });
    return {
      id: folderId,
      webViewLink: folderDetails.data.webViewLink
    };
  }

  // If folder doesn't exist, create it (only for non-collection folders)
  if (!isCollection) {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });

    return {
      id: folder.data.id,
      webViewLink: folder.data.webViewLink
    };
  } else {
    throw new Error(`Collection folder "${folderName}" not found. Available folders: ${listResponse.data.files.map(f => f.name).join(', ')}`);
  }
}

export async function uploadToGoogleDrive(file, { collection, folderName, sku, label }) {
  try {
    const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!ROOT_FOLDER_ID) {
      throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured');
    }
    
    // Simple verification check for the root folder
    let isVerified = false;
    try {
      await drive.files.get({
        fileId: ROOT_FOLDER_ID,
        fields: 'id',
        supportsAllDrives: true,
      });
      isVerified = true;
      console.log('Root folder verification successful');
    } catch (folderError) {
      console.error('Root folder verification failed:', folderError.message);
      throw new Error(`Could not verify root folder: ${ROOT_FOLDER_ID} - ${folderError.message}`);
    }

    // Find or create the collection folder
    const collectionFolder = await findOrCreateFolder(ROOT_FOLDER_ID, collection, true);
    if (!collectionFolder) {
      throw new Error(`Failed to find or create collection folder: ${collection}`);
    }

    // Find or create the product folder
    const productFolder = await findOrCreateFolder(collectionFolder.id, folderName);
    if (!productFolder) {
      throw new Error(`Failed to find or create product folder: ${folderName}`);
    }

    // Find or create the Originals subfolder
    const originalsFolder = await findOrCreateFolder(productFolder.id, "Originals");
    if (!originalsFolder) {
      throw new Error(`Failed to find or create Originals folder for: ${folderName}`);
    }

    // Prepare the file for upload
    const fileName = label ? `${sku}-${label}` : sku;
    const fileExtension = file.name.split('.').pop();
    const fullFileName = `${fileName}.${fileExtension}`;
    
    // Convert file to buffer
    let fileBuffer;
    if (file.buffer && Buffer.isBuffer(file.buffer)) {
      fileBuffer = file.buffer;
    } else if (typeof file.arrayBuffer === 'function') {
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      throw new Error('File object does not support conversion to buffer');
    }
    
    // Upload the file
    const fileMetadata = {
      name: fullFileName,
      parents: [originalsFolder.id]
    };
    
    const media = {
      mimeType: file.type,
      body: fileBuffer
    };
    
    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });
    
    return {
      success: true,
      fileId: uploadedFile.data.id,
      webViewLink: uploadedFile.data.webViewLink,
      folderPath: {
        collection,
        folderName,
        fullPath: `${collection}/${folderName}`,
        collectionFolderUrl: collectionFolder?.webViewLink,
        productFolderUrl: productFolder?.webViewLink,
        originalsFolderUrl: originalsFolder?.webViewLink
      }
    };
  } catch (error) {
    console.error('Google Drive upload failed:', error.message);
    throw new Error(`Google Drive upload failed: ${error.message}`);
  }
}

// Function to test authentication
export async function testGoogleDriveAuth() {
  try {
    console.log('Testing Google Drive authentication...');
    
    // Log environment variables (without exposing the actual values)
    console.log('Environment variables check:');
    console.log('- GOOGLE_CLIENT_EMAIL length:', process.env.GOOGLE_CLIENT_EMAIL ? process.env.GOOGLE_CLIENT_EMAIL.length : 0);
    console.log('- GOOGLE_PRIVATE_KEY length:', process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0);
    console.log('- GOOGLE_PROJECT_ID length:', process.env.GOOGLE_PROJECT_ID ? process.env.GOOGLE_PROJECT_ID.length : 0);
    console.log('- GOOGLE_DRIVE_ROOT_FOLDER_ID length:', process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ? process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID.length : 0);
    
    // Log the processed private key format
    const processedKey = processPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    console.log('Processed private key format:');
    console.log('- Contains BEGIN marker:', processedKey ? processedKey.includes('-----BEGIN') : false);
    console.log('- Contains END marker:', processedKey ? processedKey.includes('-----END') : false);
    console.log('- Contains newlines:', processedKey ? processedKey.includes('\n') : false);
    
    // Try to get the about information which requires authentication
    console.log('Attempting to authenticate with Google Drive API...');
    const about = await drive.about.get({
      fields: 'user,storageQuota',
    });
    
    console.log('Authentication successful!');
    console.log('Authenticated as:', about.data.user.emailAddress);
    console.log('Storage quota:', about.data.storageQuota);
    
    return {
      success: true,
      user: about.data.user,
      quota: about.data.storageQuota
    };
  } catch (error) {
    console.error('Authentication test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Stack trace hidden in production'
    });
    
    // Check if the error is related to the private key
    if (error.message.includes('DECODER routines') || error.message.includes('private key')) {
      console.error('Private key format issue detected. Please check the format of your GOOGLE_PRIVATE_KEY environment variable.');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}