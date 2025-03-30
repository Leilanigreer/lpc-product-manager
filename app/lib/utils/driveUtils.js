// Google Drive folder IDs
export const DRIVE_FOLDERS = {
  LPCGOLF: '0AAdajSnHLnEyUk9PVA',
  HEADCOVERS: '1baikNxfL9Bxb9Td-ZMUFMRVuc5WEdMrA',
};

/**
 * Get the folder ID for a collection, or null if not found
 * @param {Object} collection - The collection object from the database
 * @returns {string|null} The folder ID or null if not found
 */
export function getCollectionFolderId(collection) {
  return collection?.googleDriveFolderId || null;
}

/**
 * Get the full path for a file in Google Drive
 * @param {Object} params - The parameters for the file path
 * @param {Object} params.collection - The collection object from the database
 * @param {string} params.folderName - The folder name
 * @param {string} params.sku - The SKU
 * @param {string} [params.label] - Optional label
 * @returns {Object} Object containing the folder IDs and file name
 */
export function getDrivePath({ collection, folderName, sku, label }) {
  const collectionFolderId = getCollectionFolderId(collection);
  
  return {
    collectionFolderId,
    fileName: label ? `${sku}-${label}` : sku,
    // Add more path information as needed
  };
} 