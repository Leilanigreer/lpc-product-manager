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

export async function uploadToGoogleDrive(file, { collection, folderName, sku, label }) {
  try {
    // Log all inputs for debugging
    console.log('Upload to Google Drive called with:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      fileKeys: Object.keys(file),
      hasBuffer: !!file.buffer,
      hasStream: typeof file.stream === 'function',
      collection,
      folderName,
      sku,
      label
    });
    
    const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!ROOT_FOLDER_ID) {
      throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured');
    }

    // First verify the folder exists and get its details
    console.log('Verifying folder exists:', ROOT_FOLDER_ID);
    try {
      await drive.files.get({
        fileId: ROOT_FOLDER_ID,
        fields: 'id, name, driveId',
        supportsAllDrives: true,
      });
    } catch (folderError) {
      console.error('Error verifying folder:', folderError);
      throw new Error(`Could not verify folder: ${folderError.message}`);
    }
    
    // Simple file name creation
    const fileName = label ? `${sku}-${label}` : sku;
    const fileExtension = file.name.split('.').pop();
    const fullFileName = `${fileName}.${fileExtension}`;
    
    // Simple upload to root folder for now
    const fileMetadata = {
      name: fullFileName,
      parents: [ROOT_FOLDER_ID],
    };
    
    // Convert the file to a Buffer first
    let fileBuffer;
    
    if (file.buffer && Buffer.isBuffer(file.buffer)) {
      fileBuffer = file.buffer;
      console.log('Using existing file.buffer');
    } else {
      console.log('Converting file to buffer');
      if (typeof file.arrayBuffer === 'function') {
        fileBuffer = Buffer.from(await file.arrayBuffer());
        console.log('Used arrayBuffer method to create buffer');
      } else {
        throw new Error('File object does not support conversion to buffer');
      }
    }
    
    // Create a readable stream from the buffer
    const fileStream = Readable.from(fileBuffer);
    
    const media = {
      mimeType: file.type,
      body: fileStream
    };
    
    console.log('Uploading file to Google Drive:', {
      fileName: fullFileName,
      mimeType: file.type,
      fileSize: fileBuffer.length,
      parent: ROOT_FOLDER_ID
    });
    
    // Upload file with support for shared drives
    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });
    
    console.log('File uploaded successfully:', {
      fileId: uploadedFile.data.id,
      webViewLink: uploadedFile.data.webViewLink
    });
    
    return {
      success: true,
      fileId: uploadedFile.data.id,
      webViewLink: uploadedFile.data.webViewLink,
    };
  } catch (error) {
    console.error('Error in uploadToGoogleDrive:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errors: error.errors,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(`Google Drive upload failed: ${error.message}`);
  }
}