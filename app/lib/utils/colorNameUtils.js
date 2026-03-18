// Format name for live typing (preserve all spaces, title case)
export function formatNameLive(str) {
  return str.replace(/\S+/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Format name on blur/submit (trim, title case)
export function formatNameOnBlur(str) {
  return str.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Normalize for matching (trim and title case)
export function normalizeName(str) {
  return formatNameOnBlur(str);
}

// Validate name uniqueness in a list (case-insensitive, title-cased)
// Optionally exclude an id (for update forms)
export function validateNameUnique(list, input, field = 'label', excludeId = null) {
  const normalizedInput = normalizeName(input);
  return !list.some(item => {
    if (excludeId && (item.id === excludeId)) return false;
    return normalizeName(item[field] || item.name || '') === normalizedInput;
  });
}

// Abbreviation for Leather (no suffix, collision avoidance)
export function generateLeatherAbbreviation(name, existingAbbrs) {
  const normalized = (existingAbbrs || [])
    .map((a) => (a != null ? String(a).trim() : ""))
    .filter(Boolean);
  if (!name || typeof name !== "string") return "";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const abbr = words.map((w) => w[0].toUpperCase()).join("");
  if (!normalized.includes(abbr)) return abbr;
  const maxLen = Math.max(...words.map((w) => w.length), 1);
  const makeAbbr = (words, i) =>
    words.map((w) => w[0].toUpperCase() + (w[i] ? w[i].toLowerCase() : "")).join("");
  for (let i = 1; i <= maxLen; i++) {
    const nextAbbr = makeAbbr(words, i);
    if (!normalized.includes(nextAbbr)) return nextAbbr;
  }
  let n = 2;
  while (normalized.includes(abbr + n)) n++;
  return abbr + n;
}

// Utility: Generate unique abbreviation (like leather, but always ends with 'E')
export function generateEmbAbbreviation(name, embroideryAbbrsRaw) {
  if (!name) return "";
  const existingAbbrs = (embroideryAbbrsRaw || []).map(abbr => abbr.endsWith('E') ? abbr : abbr + 'E');
  const words = name.split(" ").filter(Boolean);
  const maxLen = Math.max(...words.map(w => w.length));
  for (let i = 1; i <= maxLen; i++) {
    const abbr = words.map(w => w.slice(0, i)).join("") + 'E';
    if (!existingAbbrs.includes(abbr)) return abbr;
  }
  let n = 2;
  while (true) {
    for (let i = 1; i <= maxLen; i++) {
      const abbr = words.map(w => w.slice(0, i)).join("") + 'E' + n;
      if (!existingAbbrs.includes(abbr)) return abbr;
    }
    n++;
  }
}

// Utility: Generate unique abbreviation for stitching (always ends with 'S')
export function generateStitchAbbreviation(name, stitchingAbbrsRaw) {
  if (!name) return "";
  const existingAbbrs = (stitchingAbbrsRaw || []).map(abbr => abbr.endsWith('S') ? abbr : abbr + 'S');
  const words = name.split(" ").filter(Boolean);
  const maxLen = Math.max(...words.map(w => w.length));
  for (let i = 1; i <= maxLen; i++) {
    const abbr = words.map(w => w.slice(0, i)).join("") + 'S';
    if (!existingAbbrs.includes(abbr)) return abbr;
  }
  let n = 2;
  while (true) {
    for (let i = 1; i <= maxLen; i++) {
      const abbr = words.map(w => w.slice(0, i)).join("") + 'S' + n;
      if (!existingAbbrs.includes(abbr)) return abbr;
    }
    n++;
  }
}