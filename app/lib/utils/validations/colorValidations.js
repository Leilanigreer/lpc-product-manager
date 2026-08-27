/**
 * Validates leather color selections
 */
export const validateLeatherColors = (formState, needsSecondaryColor, debug = false) => {
  const { leatherColors } = formState;

  if (!leatherColors) {
    if (debug) console.warn("No leatherColors found in formState");
    return false;
  }

  const hasPrimary =
    leatherColors.primary?.value &&
    leatherColors.primary?.label &&
    leatherColors.primary?.abbreviation;

  if (!hasPrimary) {
    if (debug) console.warn("Primary leather validation failed", leatherColors.primary);
    return false;
  }

  if (!needsSecondaryColor) return true;

  const isValid = !!(
    leatherColors.secondary?.value &&
    leatherColors.secondary?.label &&
    leatherColors.secondary?.abbreviation
  );

  if (!isValid && debug) {
    console.warn("Secondary leather validation failed", leatherColors.secondary);
  }

  return isValid;
};

/**
 * Validates color designation object if present
 * @param {Object} designation - Color designation object to validate
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid
 */
export const validateColorDesignation = (designation, debug = false) => {
  if (!designation || typeof designation !== "object") {
    if (debug) console.warn("Invalid color designation object:", designation);
    return false;
  }

  // Required fields that must be non-empty strings
  const requiredStringFields = ["value", "label"];
  const hasRequiredFields = requiredStringFields.every((field) => {
    const isValid =
      typeof designation[field] === "string" && designation[field].length > 0;
    if (!isValid && debug) {
      console.warn(`Invalid ${field} in color designation:`, designation[field]);
    }
    return isValid;
  });

  return hasRequiredFields;
};

/**
 * Human-readable reason a designation object fails validation.
 * @param {Object|null|undefined} designation
 * @returns {string}
 */
export function describeColorDesignationProblem(designation) {
  if (designation == null) {
    return "Named Leather is empty (not set)";
  }
  if (typeof designation !== "object") {
    return `Named Leather is invalid type (${typeof designation})`;
  }
  const missing = [];
  if (typeof designation.value !== "string" || !designation.value.length) {
    missing.push("value (leather id)");
  }
  if (typeof designation.label !== "string" || !designation.label.length) {
    missing.push("label");
  }
  if (missing.length) {
    return `Named Leather missing ${missing.join(" and ")} (got value=${JSON.stringify(designation.value)}, label=${JSON.stringify(designation.label)})`;
  }
  return "Named Leather failed validation";
}

function shapeDisplayName(shape) {
  return (
    String(shape?.cardDisplayName || shape?.label || shape?.value || "unknown").trim() ||
    "unknown"
  );
}

/**
 * Validates color designations for all shapes that need them.
 * Returns a boolean-compatible result object so callers can show per-shape details.
 *
 * @param {Object} formState - Form state containing allShapes
 * @param {boolean} debug - Whether to log debug messages
 * @returns {{ isValid: boolean, error?: string, issues?: object[] }}
 */
export const validateShapeColorDesignations = (formState, debug = false) => {
  if (!formState?.allShapes || typeof formState.allShapes !== "object") {
    if (debug) console.warn("Invalid allShapes object:", formState?.allShapes);
    return {
      isValid: false,
      error: "Invalid color designations for shapes: form has no shape rows (allShapes missing).",
      issues: [],
    };
  }

  const primaryId = String(formState.leatherColors?.primary?.value || "").trim();
  const secondaryId = String(formState.leatherColors?.secondary?.value || "").trim();
  const productLeatherIds = new Set([primaryId, secondaryId].filter(Boolean));

  const shapesNeedingDesignation = Object.values(formState.allShapes).filter(
    (shape) => shape.isSelected && shape.needsColorDesignation
  );

  if (shapesNeedingDesignation.length === 0) {
    return { isValid: true };
  }

  const issues = [];

  for (const shape of shapesNeedingDesignation) {
    const designation = shape.colorDesignation;
    const ok = validateColorDesignation(designation, debug);
    if (ok) {
      const designationId = String(designation.value || "").trim();
      if (productLeatherIds.size > 0 && !productLeatherIds.has(designationId)) {
        // Valid object, but not one of the current product leathers — note for debugging;
        // still counts as valid for validateColorDesignation (SKU/metafield can use any leather gid).
        if (debug) {
          console.warn(
            `Shape ${shapeDisplayName(shape)} Named Leather is not primary/secondary:`,
            designationId
          );
        }
      }
      continue;
    }

    const name = shapeDisplayName(shape);
    const styleLabel = shape.style?.label || shape.style?.value || "(no style)";
    const hiddenFromUi = shape.isActive === false;
    const reason = describeColorDesignationProblem(designation);

    issues.push({
      shapeValue: shape.value,
      shapeLabel: name,
      styleLabel: String(styleLabel),
      hiddenFromUi,
      reason,
      colorDesignation: designation ?? null,
    });
  }

  if (issues.length === 0) {
    return { isValid: true };
  }

  const lines = issues.map((issue) => {
    const visibility = issue.hiddenFromUi
      ? " [hidden non-representative row — not shown in shape list]"
      : "";
    return `• ${issue.shapeLabel}${visibility}: ${issue.reason} (style: ${issue.styleLabel})`;
  });

  const error = [
    "Invalid color designations for shapes:",
    ...lines,
    "Each selected shape whose style needs Named Leather must have a leather chosen in that row.",
  ].join("\n");

  console.warn("[validateShapeColorDesignations]", error, issues);

  if (debug) {
    for (const issue of issues) {
      console.warn(`Invalid color designation for shape ${issue.shapeLabel}:`, issue);
    }
  }

  return { isValid: false, error, issues };
};
