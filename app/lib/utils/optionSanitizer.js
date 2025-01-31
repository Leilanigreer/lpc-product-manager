// app/lib/utils/optionSanitizer.js
export const sanitizeSelectOptions = (options) => {
  return options.map(({ value, label, abbreviation, url_id }) => ({
    value,
    label,
    abbreviation,
    url_id
  }));
};

export const sanitizeCollectionOptions = (collections) => {
  if (!Array.isArray(collections)) return [];
  
  return collections.filter(c => c.showInDropdown).map(({ 
    value, 
    label,
    needsStyle,
    styles 
  }) => ({
    value,
    label,
    needsStyle,
    styles: styles?.map(({ value, label, name }) => ({
      value: value || name,
      label: label || name
    }))
  }));
};