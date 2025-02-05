// app/lib/utils/optionSanitizer.js
export const sanitizeSelectOptions = (options) => {
  return options.map(({ value, label, abbreviation, url_id }) => ({
    value,
    label,
    abbreviation,
    url_id
  }));
};
