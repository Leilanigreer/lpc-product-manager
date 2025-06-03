// Utility: Title Case
export function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Utility: Generate unique abbreviation (like leather, but always ends with 'E')
export function generateEmbAbbreviation(name, embroideryAbbrsRaw) {
  if (!name) return "";
  // All existing abbreviations should be compared with 'E' at the end
  const existingAbbrs = (embroideryAbbrsRaw || []).map(abbr => abbr.endsWith('E') ? abbr : abbr + 'E');
  const words = name.split(" ").filter(Boolean);
  // Try 1 to max word length for each word
  const maxLen = Math.max(...words.map(w => w.length));
  for (let i = 1; i <= maxLen; i++) {
    const abbr = words.map(w => w.slice(0, i)).join("") + 'E';
    if (!existingAbbrs.includes(abbr)) return abbr;
  }
  // If all combinations are taken, append a number
  let n = 2;
  while (true) {
    for (let i = 1; i <= maxLen; i++) {
      const abbr = words.map(w => w.slice(0, i)).join("") + 'E' + n;
      if (!existingAbbrs.includes(abbr)) return abbr;
    }
    n++;
  }
} 