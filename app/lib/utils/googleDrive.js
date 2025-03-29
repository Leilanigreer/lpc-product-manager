// app/lib/utils/googleDrive.js
export async function uploadToGoogleDrive(file, { collection, folderName, sku, label }) {
  console.log('=== Google Drive Upload START ===');
  console.log('Preparing upload:', {
    name: file.name,
    type: file.type,
    size: file.size,
    collection,
    folderName,
    sku,
    label
  });

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', collection);
    formData.append('folderName', folderName);
    formData.append('sku', sku);
    if (label) {
      formData.append('label', label);
    }

    console.log('Sending upload request to API endpoint');
    const response = await fetch('/api/upload/googledrive', {
      method: 'POST',
      body: formData
    });

    console.log('Response received:', {
      status: response.status,
      ok: response.ok
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Upload failed:', result);
      throw new Error(result.error || 'Upload failed');
    }

    console.log('Google Drive upload successful:', result);
    console.log('=== Google Drive Upload END ===');
    
    return result;
  } catch (error) {
    console.error('Google Drive upload error:', error);
    console.log('=== Google Drive Upload END (with error) ===');
    throw error;
  }
}