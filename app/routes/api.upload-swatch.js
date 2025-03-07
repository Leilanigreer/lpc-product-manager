import { json } from "@remix-run/node";
import { uploadToCloudinary } from "../lib/utils/cloudinary";

export const action = async ({ request }) => {
  console.log('=== Upload Swatch API START ===');
  
  if (request.method !== "POST") {
    console.log('Invalid method:', request.method);
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    console.log('Parsing form data');
    const formData = await request.formData();
    const file = formData.get("file");

    console.log('File received:', {
      exists: !!file,
      isFile: file instanceof File,
      type: file?.type,
      size: file?.size,
      name: file?.name
    });

    if (!file || !(file instanceof File)) {
      console.log('No valid file in request');
      return json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    console.log('Validating file type:', file.type);
    if (!file.type.startsWith("image/")) {
      console.log('Invalid file type:', file.type);
      return json({ error: "Invalid file type" }, { status: 400 });
    }

    // Upload to Cloudinary
    console.log('Starting Cloudinary upload');
    try {
      const result = await uploadToCloudinary(file);
      console.log('Cloudinary upload result:', result);
      console.log('=== Upload Swatch API END ===');
      return json(result);
    } catch (cloudinaryError) {
      console.error('Cloudinary specific error:', {
        message: cloudinaryError.message,
        stack: cloudinaryError.stack,
        details: cloudinaryError.details || 'No additional details'
      });
      return json({ 
        error: "Cloudinary upload failed", 
        details: cloudinaryError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    console.log('=== Upload Swatch API END (with error) ===');
    return json({ error: error.message }, { status: 500 });
  }
}; 