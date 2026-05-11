// app/lib/utils/googleDrive.js

import { formatUnknownApiError } from "./formatApiError.js";

export const formatGoogleDriveUploadErrorMessage = formatUnknownApiError;

export async function uploadToGoogleDrive(
  file,
  { collection, folderName, sku, label, originalsFolderName }
) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', collection);
    formData.append('folderName', folderName);
    formData.append('sku', sku);
    if (label) {
      formData.append('label', label);
    }
    if (originalsFolderName) {
      formData.append('originalsFolderName', originalsFolderName);
    }

    const response = await fetch('/api/upload/googledrive', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Google Drive upload failed:', result);
      const msg =
        formatUnknownApiError(result?.error) ||
        formatUnknownApiError(result) ||
        'Upload failed';
      throw new Error(msg);
    }

    return result;
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw error;
  }
}

export async function updateToGoogleDrive(file, fileId) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileId', fileId);

    const response = await fetch('/api/upload/googledrive', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Google Drive update failed:', result);
      const msg =
        formatUnknownApiError(result?.error) ||
        formatUnknownApiError(result) ||
        'Update failed';
      throw new Error(msg);
    }

    return result;
  } catch (error) {
    console.error('Google Drive update error:', error);
    throw error;
  }
}
