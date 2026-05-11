// app/lib/utils/googleDrive.js

/**
 * Cloud/API payloads sometimes put structured errors in `error`.
 * `new Error(object)` becomes the useless message "[object Object]".
 */
export function formatGoogleDriveUploadErrorMessage(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const s = value.trim();
    return s;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Error) {
    return formatGoogleDriveUploadErrorMessage(value.message) || value.name || "";
  }
  if (typeof value === "object") {
    if (typeof value.message === "string" && value.message.trim()) return value.message.trim();
    if (typeof value.error === "string" && value.error.trim()) return value.error.trim();
    if (Array.isArray(value.errors) && value.errors.length > 0) {
      const joined = value.errors
        .map((e) => formatGoogleDriveUploadErrorMessage(e))
        .filter(Boolean)
        .join("; ");
      if (joined) return joined;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value).trim();
}

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
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Google Drive upload failed:', result);
      const msg =
        formatGoogleDriveUploadErrorMessage(result?.error) ||
        formatGoogleDriveUploadErrorMessage(result) ||
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
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Google Drive update failed:', result);
      const msg =
        formatGoogleDriveUploadErrorMessage(result?.error) ||
        formatGoogleDriveUploadErrorMessage(result) ||
        'Update failed';
      throw new Error(msg);
    }
    
    return result;
  } catch (error) {
    console.error('Google Drive update error:', error);
    throw error;
  }
}