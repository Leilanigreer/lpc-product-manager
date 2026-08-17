// app/lib/utils/validations/styleValidations.js

import { isPutter, getShapeGroup, styleCategoryMatchesShapeGroup } from "../shapeUtils";

/**
 * Enum for valid style name patterns
 * @enum {string}
 */
const StyleNamePattern = {
  STYLE_WITH_COLOR_PHRASE: 'STYLE_WITH_COLOR_PHRASE', // "{style.label} w/ {leather.label} {style.leatherPhrase}"
  STYLE_PHRASE_COLOR: 'STYLE_PHRASE_COLOR', // "{style.label} {style.leatherPhrase} {leather.label}"
};

/**
 * Validates style object (used for both global and per-shape styles)
 * @param {Object} style - Style object to validate
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid
 */
const validateStyle = (style, debug = false) => {
  if (!style || typeof style !== 'object') {
    if (debug) console.warn('Invalid style object:', style);
    return false;
  }

  // Required string fields
  const requiredStringFields = {
    value: 'string',
    label: 'string',
    abbreviation: 'string'
  };

  const hasRequiredStrings = Object.entries(requiredStringFields).every(([field, type]) => {
    const value = style[field];
    const isValid = value !== undefined && 
                   value !== null && 
                   typeof value === type && 
                   value.length > 0;

    if (!isValid && debug) {
      console.warn(`Invalid ${field} in style:`, { expected: type, got: typeof value, value });
    }
    return isValid;
  });

  if (!hasRequiredStrings) return false;

  // Validate namePattern enum
  const hasValidNamePattern = Object.values(StyleNamePattern).includes(style.namePattern);
  if (!hasValidNamePattern) {
    if (debug) console.warn('Invalid namePattern:', style.namePattern);
    return false;
  }

  // Validate useOppositeLeather boolean
  if (typeof style.useOppositeLeather !== 'boolean') {
    if (debug) console.warn('Invalid useOppositeLeather:', style.useOppositeLeather);
    return false;
  }

  // Validate leatherPhrase exists (can be null)
  if (!('leatherPhrase' in style)) {
    if (debug) console.warn('Missing leatherPhrase field');
    return false;
  }

  if (typeof style.needsColorDesignation !== 'boolean') {
    if (debug) console.warn('Invalid needsColorDesignation:', style.needsColorDesignation);
    return false;
  }

  return true;
};

/**
 * Validates styles for all shapes that need them
 * @param {Object} formState - Form state containing allShapes
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if all required styles are valid
 */
export const validateShapeStyles = (formState, debug = false) => {
  if (!formState?.allShapes || typeof formState.allShapes !== 'object') {
    if (debug) console.warn('Invalid allShapes object:', formState?.allShapes);
    return false;
  }

  const collectionStyles = formState.collection?.styles ?? [];

  // Get selected shapes that actually need a style selection.
  // In the new Shopify model, this is determined per shape_group within the current collection_category.
  const shapesNeedingStyles = Object.values(formState.allShapes)
    .filter((shape) => shape.isSelected)
    .filter((shape) => {
      const group = getShapeGroup(shape);

      // Legacy fallback when shape_group is not available:
      // only non-putters could previously select styles.
      if (group == null) {
        return Boolean(formState.collection?.needsStyle && !isPutter(shape));
      }

      const matchCount = collectionStyles.filter((s) =>
        styleCategoryMatchesShapeGroup(s.shapeGroup, group)
      ).length;

      return matchCount > 1;
    });

  if (shapesNeedingStyles.length === 0) {
    return true;
  }

  // Check that every applicable shape has a valid style
  return shapesNeedingStyles.every(shape => {
    const isValid = validateStyle(shape.style, debug);
    if (!isValid && debug) {
      console.warn(`Invalid style for shape ${shape.label}:`, shape.style);
    }
    return isValid;
  });
};

/**
 * Validates all style-related requirements
 * @param {Object} formState - Current form state
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if all style validations pass
 */
export const validateStyles = (formState, debug = false) => {
  if (!formState?.collection?.needsStyle) {
    return true;
  }

  return validateShapeStyles(formState, debug);
};

/** Collection category whose Style names must start with "Quilted". */
export const QUILTED_PREFIX_COLLECTION_CATEGORY = "quilted_classic_exotic";

const QUILTED_WORD = "Quilted";

/** Shape group → last word of the Style name. */
export const SHAPE_GROUP_TITLE_SUFFIX = {
  mallets: "Mallet",
  blades: "Blade",
};

const SHAPE_TITLE_SUFFIX_WORDS = new Set(["mallet", "mallets", "blade", "blades"]);

function stripShapeTitleSuffix(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const last = parts[parts.length - 1].toLowerCase();
  if (SHAPE_TITLE_SUFFIX_WORDS.has(last)) parts.pop();
  return parts.join(" ");
}

/**
 * Canonical Style name for writing to Shopify.
 *
 * - `quilted_classic_exotic`: first word is "Quilted".
 * - `mallets` / `blades`: last word is "Mallet" / "Blade".
 *
 * @param {string} styleName
 * @param {string} collectionCategory
 * @param {string} [shapeGroup]
 * @returns {string}
 */
export function canonicalizeStyleName(styleName, collectionCategory, shapeGroup) {
  let name = String(styleName ?? "").trim().replace(/\s+/g, " ");
  if (!name) return "";

  if (collectionCategory === QUILTED_PREFIX_COLLECTION_CATEGORY) {
    if (/^quilted(\s|$)/i.test(name)) {
      name = name.replace(/^quilted/i, QUILTED_WORD);
    } else {
      name = `${QUILTED_WORD} ${name}`;
    }
  }

  const groupKey = String(shapeGroup ?? "").trim().toLowerCase();
  const suffix = SHAPE_GROUP_TITLE_SUFFIX[groupKey];
  if (suffix) {
    const core = stripShapeTitleSuffix(name);
    name = core ? `${core} ${suffix}` : suffix;
  } else if (groupKey) {
    const stripped = stripShapeTitleSuffix(name);
    if (stripped) name = stripped;
  }

  return name;
}

/**
 * Server-side Quilted prefix check. Returns an error message, or null when valid.
 *
 * @param {string} styleName
 * @param {string} collectionCategory
 * @returns {string|null}
 */
export function quiltedStyleNamePrefixError(styleName, collectionCategory) {
  if (collectionCategory !== QUILTED_PREFIX_COLLECTION_CATEGORY) return null;
  const trimmed = String(styleName ?? "").trim();
  if (!trimmed) return "Style name is required.";
  const firstWord = trimmed.split(/\s+/)[0];
  if (firstWord !== QUILTED_WORD) {
    return 'Style names for quilted_classic_exotic must start with "Quilted".';
  }
  return null;
}

/**
 * Server-side Mallet/Blade suffix check. Returns an error message, or null when valid.
 *
 * @param {string} styleName
 * @param {string} shapeGroup
 * @returns {string|null}
 */
export function styleNameShapeSuffixError(styleName, shapeGroup) {
  const groupKey = String(shapeGroup ?? "").trim().toLowerCase();
  const suffix = SHAPE_GROUP_TITLE_SUFFIX[groupKey];
  if (!suffix) return null;
  const trimmed = String(styleName ?? "").trim();
  if (!trimmed) return "Style name is required.";
  const lastWord = trimmed.split(/\s+/).pop();
  if (lastWord !== suffix) {
    return `Style names for ${groupKey} must end with "${suffix}".`;
  }
  return null;
}