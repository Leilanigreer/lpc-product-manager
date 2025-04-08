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
  if (!privateKey) return null;
  
  // If the key already has proper formatting, return it as is
  if (privateKey.includes('-----BEGIN') && privateKey.includes('-----END')) {
    // Replace escaped newlines with actual newlines if needed
    return privateKey.replace(/\\n/g, '\n');
  }
  
  // If the key doesn't have proper formatting, try to fix it
  try {
    // Try to decode if it's base64 encoded
    if (!privateKey.includes('-----BEGIN')) {
      try {
        const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
        if (decoded.includes('-----BEGIN')) {
          return decoded;
        }
      } catch (e) {
        // Not a base64 encoded key
      }
    }
    
    // If we still don't have a properly formatted key, try to construct one
    if (!privateKey.includes('-----BEGIN')) {
      // This is a simplified approach and might need adjustment
      return `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
  } catch (e) {
    // If all else fails, return the original key
  }
  
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
    
    // Try to get the about information which requires authentication
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
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}