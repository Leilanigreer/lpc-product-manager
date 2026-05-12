// app/lib/utils/googleDrive.js

import { formatUnknownApiError } from "./formatApiError.js";
import { compressImageForGoogleDrive } from "./imageCompression.js";

export const formatGoogleDriveUploadErrorMessage = formatUnknownApiError;

/**
 * Drive route enforces `maxPartSize: 10_000_000`. All Drive callers funnel through this helper, so
 * compressing here is the single chokepoint: variant images, additional views, and the
 * reference/group image all inherit the size guard automatically.
 *
 * Compression always re-encodes to JPEG by design (transparency is not preserved — confirmed with
 * product owner; product/group/variant photography is opaque).
 */
async function prepareFileForDriveUpload(file) {
  if (!(file instanceof File) && !(file instanceof Blob)) {
    return file;
  }
  return compressImageForGoogleDrive(file);
}

export async function uploadToGoogleDrive(
  file,
  { collection, folderName, sku, label, originalsFolderName }
) {
  try {
    const preparedFile = await prepareFileForDriveUpload(file);
    const formData = new FormData();
    formData.append('file', preparedFile);
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
    const preparedFile = await prepareFileForDriveUpload(file);
    const formData = new FormData();
    formData.append('file', preparedFile);
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
