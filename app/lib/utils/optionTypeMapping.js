/**
 * Mapping of database option types to their display names
 */
export const OPTION_TYPE_DISPLAY_NAMES = {
  FILE_UPLOAD: 'File Upload',
  CHECKBOX: 'Checkbox',
  DROPDOWN: 'Dropdown',
  IMAGE_SWATCH: 'Image Swatch',
  COLOR_SWATCH: 'Color Swatch',
  RADIO_BUTTON: 'Radio Button',
  BUTTON: 'Button',
  TEXT_BOX: 'Text Box',
  NUMBER_FIELD: 'Number Field',
  DATE_PICKER: 'Date Picker'
};

/**
 * Convert a database option type to its display name
 * @param {string} dbType - The database option type (e.g., 'CHECKBOX')
 * @returns {string} The display name (e.g., 'Checkbox')
 */
export const getOptionTypeDisplayName = (dbType) => {
  return OPTION_TYPE_DISPLAY_NAMES[dbType] || dbType;
};

/**
 * Convert a display name back to its database type
 * @param {string} displayName - The display name (e.g., 'Checkbox')
 * @returns {string} The database type (e.g., 'CHECKBOX')
 */
export const getOptionTypeFromDisplayName = (displayName) => {
  const entry = Object.entries(OPTION_TYPE_DISPLAY_NAMES)
    .find(([_, value]) => value === displayName);
  return entry ? entry[0] : displayName.toUpperCase();
};

/**
 * Get all option types as an array of {value, label} objects
 * @returns {Array<{value: string, label: string}>} Array of option types
 */
export const getOptionTypeChoices = () => {
  return Object.entries(OPTION_TYPE_DISPLAY_NAMES).map(([dbType, displayName]) => ({
    value: dbType,         // The enum value (e.g., 'CHECKBOX')
    label: displayName     // The display name (e.g., 'Checkbox')
  }));
}; 