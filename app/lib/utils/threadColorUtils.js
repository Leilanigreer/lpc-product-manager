// Utility: Title Case
export function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Utility: Generate unique abbreviation (embroidery: always ends with '_E')
export function generateEmbAbbreviation(name, embroideryAbbrsRaw) {
  if (!name) return "";
  const SUFFIX = "_E";
  const existingAbbrs = (embroideryAbbrsRaw || [])
    .map((a) => String(a ?? "").trim())
    .filter(Boolean);
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const maxLen = Math.max(...words.map((w) => w.length), 1);
  for (let i = 1; i <= maxLen; i++) {
    const abbr = words.map((w) => w.slice(0, i)).join("") + SUFFIX;
    if (!existingAbbrs.includes(abbr)) return abbr;
  }
  let n = 2;
  while (true) {
    for (let i = 1; i <= maxLen; i++) {
      const abbr = words.map((w) => w.slice(0, i)).join("") + SUFFIX + n;
      if (!existingAbbrs.includes(abbr)) return abbr;
    }
    n++;
  }
} 