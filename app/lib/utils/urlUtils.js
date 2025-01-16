// app/lib/utils/urlUtils.js

// https://lh3.google.com/u/0/d/IMAGE_ID

const GOOGLE_DRIVE_BASE_URL = 'https://lh3.google.com/u/0/d/';

/**
 * Constructs a full Google Drive URL from a file ID
 * @param {string} urlId - The Google Drive file ID
 * @returns {string|null} The full URL or null if no ID provided
 */
export const getGoogleDriveUrl = (urlId) => {
  if (!urlId) return null;
  return `${GOOGLE_DRIVE_BASE_URL}${urlId}`;
};