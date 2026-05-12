// app/lib/utils/styleAbbreviationUtils.js
/**
 * Generate a Style metaobject abbreviation from its `style` name, `collection_category`,
 * and `shape_group`.
 *
 * Rule:
 *   abbreviation = prefix(collection_category) + core(style_name - dropWords) + suffix(shape_group)
 *
 * Where:
 *   - prefix: based on collection_category choice list
 *   - suffix: based on shape_group choice list
 *   - dropWords: words removed from the core because they're already encoded
 *                in the prefix/suffix (Quilted, Mallet, Blade). Everything
 *                else — including descriptor words like Stripes and Diagonal —
 *                goes through the standard per-word rule.
 *   - core word abbreviation:
 *       * digit ("2", "3") → keep as digit
 *       * ≤ 3 letters       → keep whole word, capitalized
 *       * ≥ 4 letters       → first 3 letters, capitalized
 *   - compound core: apply per-word, concatenate (e.g. "Fat Middle" → "FatMid")
 *
 * Per-word overrides (e.g. teardrop → "Tear") win over the generated value, so
 * we don't have to encode unusual historical decisions into the rule itself.
 *
 * Uniqueness: style abbreviations now appear in BOTH regular and custom variant
 * SKUs (see `formatSKU` in `app/lib/utils/skuUtils.js`), so a colliding
 * abbreviation produces a colliding SKU. Two styles that can apply to the same
 * shape on the same product must therefore have distinct abbreviations.
 * This generator is a best-effort starting point — the form is responsible for
 * surfacing collisions against existing styles and Karl is expected to override
 * the field when the generated value clashes.
 *
 * The single legitimate exception is a style whose abbreviation would be
 * redundant with the prefix/suffix alone (e.g. the lone "Quilted" style on the
 * Quilted collection generates `QMal`/`QBl`). Those styles set
 * `include_abbreviation_in_sku = false` so the segment is dropped from SKUs
 * entirely — see styleShopify.server.js and the formatSKU note in skuUtils.js.
 */

/** Collection-category → prefix. Unknown categories fall back to no prefix. */
const PREFIX_BY_COLLECTION_CATEGORY = {
  quilted: "Q",
  quilted_classic_exotic: "Q",
  classic_exotic: "",
  argyle: "",
};

/** Shape-group → suffix. Unknown groups fall back to no suffix. */
const SUFFIX_BY_SHAPE_GROUP = {
  mallets: "Mal",
  blades: "Bl",
  drivers_woods_hybrids: "",
};

/**
 * Words to remove from the core before per-word abbreviation. Case-insensitive.
 *
 * The ONLY reason to drop a word is that it's already encoded in the prefix or
 * suffix table above — keeping it would produce a redundant segment (e.g.
 * `Quilted Meridian Mallet` → without dropping: `QuiMerMalMal`, with: `QMerMal`).
 *
 * Resist the urge to drop "filler" descriptor words (Stripes, Diagonal, etc.)
 * just because they feel low-signal: those words help keep distinct styles
 * distinct in the SKU (e.g. `Diagonal` vs `Diagonal Stripes`), and dropping
 * them used to leave styles with empty cores. Let them run through the standard
 * per-word rule like everything else.
 */
const DROP_WORDS = new Set([
  "quilted",
  "mallet",
  "mallets",
  "blade",
  "blades",
]);

/**
 * Per-word overrides applied inside the core abbreviator. Keyed by lower-case
 * word, value is the exact replacement. Used when the default "first 3 letters"
 * rule produces an unreadable result (e.g. `Teardrop` → `Tea`, when `Tear` is
 * the established abbreviation).
 *
 * Keep this list short — every entry is a deliberate decision to deviate from
 * the rule.
 */
const CORE_WORD_OVERRIDES = {
  teardrop: "Tear",
};

function normalizeToken(value) {
  return value == null ? "" : String(value).trim();
}

function abbreviateCoreWord(word) {
  const trimmed = normalizeToken(word);
  if (!trimmed) return "";
  const override = CORE_WORD_OVERRIDES[trimmed.toLowerCase()];
  if (typeof override === "string" && override) return override;
  if (/^\d+$/.test(trimmed)) return trimmed;
  if (trimmed.length <= 3) {
    return trimmed[0].toUpperCase() + trimmed.slice(1).toLowerCase();
  }
  return trimmed[0].toUpperCase() + trimmed.slice(1, 3).toLowerCase();
}

/**
 * Generate a style abbreviation from the three driver inputs.
 *
 * @param {Object} args
 * @param {string} args.styleName           e.g. "Quilted Meridian Mallet"
 * @param {string} args.collectionCategory  e.g. "quilted_classic_exotic"
 * @param {string} args.shapeGroup          e.g. "mallets"
 * @returns {string} Generated abbreviation, or "" when there's nothing to work with.
 */
export function generateStyleAbbreviation({
  styleName,
  collectionCategory,
  shapeGroup,
} = {}) {
  const nameTrimmed = normalizeToken(styleName);
  if (!nameTrimmed) return "";

  const prefix = PREFIX_BY_COLLECTION_CATEGORY[normalizeToken(collectionCategory)] ?? "";
  const suffix = SUFFIX_BY_SHAPE_GROUP[normalizeToken(shapeGroup)] ?? "";

  const words = nameTrimmed
    .split(/[\s/_-]+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .filter((w) => !DROP_WORDS.has(w.toLowerCase()));

  const core = words.map(abbreviateCoreWord).join("");

  return `${prefix}${core}${suffix}`;
}

export const __test__ = {
  PREFIX_BY_COLLECTION_CATEGORY,
  SUFFIX_BY_SHAPE_GROUP,
  DROP_WORDS,
  CORE_WORD_OVERRIDES,
  abbreviateCoreWord,
};

function normalizeAbbrevForCompare(value) {
  return value == null ? "" : String(value).trim().toLowerCase();
}

/**
 * Find any existing style that would collide with the given style on SKU
 * generation. Two styles collide when:
 *
 *   - both have `includeAbbreviationInSku !== false` (an exempt style cannot
 *     collide because its abbreviation never reaches the SKU)
 *   - they share the same `collection_category`
 *   - they share the same `shape_group`
 *   - their `abbreviation` matches case-insensitively
 *
 * Same shape_group + same collection_category is the strictest accurate
 * scope: those are the only styles that can ever land on the same shape
 * variant of the same product, so a SKU clash is only possible there.
 *
 * Pass `excludeId` when checking the form for an existing style being edited
 * (currently unused — the form is create-only — but reserved for the eventual
 * edit flow).
 *
 * @param {Object} args
 * @param {string} args.abbreviation
 * @param {string} args.collectionCategory
 * @param {string} args.shapeGroup
 * @param {boolean} args.includeAbbreviationInSku
 * @param {Array<Object>} args.existingStyles - Mapped style rows (output of mapStyleMetaobjectNodeToFormStyle)
 * @param {string} [args.excludeId]
 * @returns {Object|null} The first conflicting existing style, or null.
 */
export function findStyleAbbreviationConflict({
  abbreviation,
  collectionCategory,
  shapeGroup,
  includeAbbreviationInSku,
  existingStyles,
  excludeId = null,
} = {}) {
  if (includeAbbreviationInSku === false) return null;

  const targetAbbrev = normalizeAbbrevForCompare(abbreviation);
  if (!targetAbbrev) return null;
  const targetCollection = normalizeAbbrevForCompare(collectionCategory);
  const targetShape = normalizeAbbrevForCompare(shapeGroup);
  if (!targetCollection || !targetShape) return null;

  for (const style of existingStyles || []) {
    if (!style) continue;
    if (excludeId && style.id === excludeId) continue;
    if (style.includeAbbreviationInSku === false) continue;
    if (normalizeAbbrevForCompare(style.abbreviation) !== targetAbbrev) continue;
    if (normalizeAbbrevForCompare(style.collectionCategory) !== targetCollection) continue;
    if (normalizeAbbrevForCompare(style.shapeGroup) !== targetShape) continue;
    return style;
  }
  return null;
}
