// app/lib/server/googleDrive.js
import { google } from 'googleapis/build/src/index.js';
import { Readable } from 'node:stream';

// Create the Google Auth client with detailed error logging
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

console.log('Google Auth credentials check:', {
  hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
  clientEmailLength: process.env.GOOGLE_CLIENT_EMAIL?.length,
  hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
  privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length,
  // Show the beginning of the client email to verify it looks correct
  // (without showing the entire email for security)
  clientEmailStart: process.env.GOOGLE_CLIENT_EMAIL?.substring(0, 8) + '...'
});

console.log('Google Drive credentials check in server code:');
console.log('- GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'set' : 'not set');
console.log('- GOOGLE_PRIVATE_KEY length:', process.env.GOOGLE_PRIVATE_KEY?.length || 0);
console.log('- GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? 'set' : 'not set');
console.log('- GOOGLE_DRIVE_ROOT_FOLDER_ID:', process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ? 'set' : 'not set');

// Create the Google Drive client
const drive = google.drive({ version: 'v3', auth });

// Helper function to find or create a folder
async function findOrCreateFolder(parentId, folderName, isCollection = false) {
  console.log(`\nSearching for folder "${folderName}" in parent "${parentId}"`);
  
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
    console.log(`Found existing folder "${folderName}"`);
    return response.data.files[0].id;
  }

  // If folder doesn't exist, create it (only for non-collection folders)
  if (!isCollection) {
    console.log(`Creating new folder "${folderName}"`);
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
      supportsAllDrives: true,
    });

    console.log(`Created new folder "${folderName}"`);
    return folder.data.id;
  } else {
    throw new Error(`Collection folder "${folderName}" not found. Available folders: ${listResponse.data.files.map(f => f.name).join(', ')}`);
  }
}

export async function uploadToGoogleDrive(file, { collection, folderName, sku, label }) {
  try {
    console.log('\n=== Starting Google Drive Upload ===');
    console.log('File:', file.name);
    console.log('Collection:', collection);
    console.log('Folder:', folderName);
    console.log('SKU:', sku);
    
    const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!ROOT_FOLDER_ID) {
      throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured');
    }
    
    // First verify the root folder exists
    try {
      const rootFolder = await drive.files.get({
        fileId: ROOT_FOLDER_ID,
        fields: 'id, name',
        supportsAllDrives: true,
      });
      console.log(`Root folder verified: ${rootFolder.data.name}`);
    } catch (folderError) {
      throw new Error(`Could not verify root folder: ${folderError.message}`);
    }

    // Create folder structure: Headcovers -> Collection -> Product Folder
    let targetFolderId = ROOT_FOLDER_ID;
    
    if (collection) {
      targetFolderId = await findOrCreateFolder(targetFolderId, collection, true);
    }
    
    if (folderName) {
      targetFolderId = await findOrCreateFolder(targetFolderId, folderName);
    }
    
    // Prepare file for upload
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
    
    // Upload file
    const fileMetadata = {
      name: fullFileName,
      parents: [targetFolderId],
    };
    
    const media = {
      mimeType: file.type,
      body: Readable.from(fileBuffer)
    };
    
    console.log(`Uploading file: ${fullFileName}`);
    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });
    
    console.log('Upload successful!');
    console.log('File link:', uploadedFile.data.webViewLink);
    console.log('=== Upload Complete ===\n');
    
    return {
      success: true,
      fileId: uploadedFile.data.id,
      webViewLink: uploadedFile.data.webViewLink,
    };
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw new Error(`Google Drive upload failed: ${error.message}`);
  }
}