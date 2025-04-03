// app/routes/api.upload.googledrive.js
import { json, unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
import { uploadToGoogleDrive } from "../lib/server/googleDrive";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Check for Google Drive configuration
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      console.error('Missing GOOGLE_PRIVATE_KEY');
      return json({ error: "Missing GOOGLE_PRIVATE_KEY" }, { status: 500 });
    }
    
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      console.error('Missing GOOGLE_CLIENT_EMAIL');
      return json({ error: "Missing GOOGLE_CLIENT_EMAIL" }, { status: 500 });
    }
    
    if (!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
      console.error('Missing GOOGLE_DRIVE_ROOT_FOLDER_ID');
      return json({ error: "Missing GOOGLE_DRIVE_ROOT_FOLDER_ID" }, { status: 500 });
    }

    // Create upload handler with buffer option to ensure we get the file as a buffer
    const uploadHandler = unstable_createMemoryUploadHandler({
      maxPartSize: 10_000_000, // 10MB limit
    });
    
    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    
    // Extract data
    const file = formData.get('file');
    const collection = formData.get('collection');
    const folderName = formData.get('folderName');
    const sku = formData.get('sku');
    const label = formData.get('label');

    // Validate required fields
    if (!file) {
      return json({ error: "No file provided" }, { status: 400 });
    }
    
    if (!collection || !folderName || !sku) {
      return json({ 
        error: "Missing required parameters", 
        missing: {
          collection: !collection,
          folderName: !folderName,
          sku: !sku
        } 
      }, { status: 400 });
    }

    // Make sure we can access the file contents
    if (typeof file.arrayBuffer !== 'function') {
      console.error('File object does not support arrayBuffer method');
      return json({ error: "Unsupported file format" }, { status: 400 });
    }

    const result = await uploadToGoogleDrive(file, { collection, folderName, sku, label });
    return json(result);
  } catch (error) {
    console.error("Google Drive upload error:", error.message);
    console.error("Error stack:", error.stack);
    
    return json({ 
      error: error.message || "Upload failed",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}