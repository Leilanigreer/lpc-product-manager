// app/lib/utils/googleDrive.js
export async function uploadToGoogleDrive(file, { collection, folderName, sku, label }) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', collection);
    formData.append('folderName', folderName);
    formData.append('sku', sku);
    if (label) {
      formData.append('label', label);
    }

    const response = await fetch('/api/upload/googledrive', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Google Drive upload failed:', result);
      throw new Error(result.error || 'Upload failed');
    }
    
    return result;
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw error;
  }
}