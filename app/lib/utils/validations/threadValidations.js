// app/lib/utils/validations/threadValidations.js

import { isSingleEmbroideryMode, isSingleStitchingMode } from "../threadUtils";

/**
 * Generic thread structure validator that works for both stitching and embroidery threads
 * @param {Object} thread - Thread object to validate
 * @param {string} threadType - Either 'stitching' or 'embroidery'
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid
 */
export const validateThreadStructure = (thread, threadType, debug = false) => {
  if (!thread || typeof thread !== "object") {
    if (debug) console.warn(`Invalid ${threadType} thread object:`, thread);
    return false;
  }

  if (threadType === "embroidery" && thread.type === "none") {
    return true;
  }

  if (!thread.isThread) {
    if (debug) console.warn(`Thread object not marked as isThread:`, thread);
    return false;
  }

  const baseFields = ["value", "label", "abbreviation"];
  const hasBaseFields = baseFields.every((field) => {
    const isValid = typeof thread[field] === "string" && thread[field].length > 0;
    if (!isValid && debug) {
      console.warn(`Missing or invalid ${field} in thread:`, thread[field]);
    }
    return isValid;
  });

  if (!hasBaseFields) return false;

  const numberArrayKey = threadType === "stitching" ? "amannNumbers" : "isacordNumbers";
  const numbers = thread[numberArrayKey];

  if (!Array.isArray(numbers) || numbers.length === 0) {
    if (debug) console.warn(`Invalid or empty ${numberArrayKey} array:`, numbers);
    return false;
  }

  return numbers.every((number) => {
    const isValid =
      number &&
      typeof number === "object" &&
      typeof number.value === "string" &&
      typeof number.label === "string";
    if (!isValid && debug) {
      console.warn(`Invalid ${threadType} number:`, number);
    }
    return isValid;
  });
};

/**
 * Validates stitching thread color(s)
 */
export const validateStitchingThreads = (formState, debug = false) => {
  const { stitchingThreads } = formState;

  if (!stitchingThreads || typeof stitchingThreads !== "object") {
    if (debug) console.warn("No stitchingThreads found in formState or invalid type");
    return false;
  }

  const threadEntries = Object.entries(stitchingThreads);
  if (threadEntries.length === 0) {
    if (debug) console.warn("stitchingThreads is empty");
    return false;
  }

  const needsSupportingAmann = isSingleStitchingMode(formState);

  return threadEntries.every(([_, thread]) => {
    if (!validateThreadStructure(thread, "stitching", debug)) return false;
    if (needsSupportingAmann) {
      const nums = thread.amannNumbers;
      if (!Array.isArray(nums) || nums.length < 2) {
        if (debug) {
          console.warn(
            "STITCHING threadType requires a primary and supporting Amann number"
          );
        }
        return false;
      }
      const supporting = nums[1];
      if (
        !supporting ||
        typeof supporting.value !== "string" ||
        supporting.value.length === 0 ||
        typeof supporting.label !== "string"
      ) {
        if (debug) console.warn("Invalid supporting Amann number:", supporting);
        return false;
      }
    }
    return true;
  });
};

/**
 * Product-level embroidery: all picks live in `embroideryThreads` (keyed by Isacord GID).
 * EMBROIDERY collection type requires exactly one valid row; NONE / STITCHING allow one or more.
 */
export const validateEmbroiderySelection = (formState, debug = false) => {
  const entries = Object.values(formState.embroideryThreads || {}).filter(Boolean);
  if (entries.length === 0) {
    if (debug) console.warn("embroideryThreads is empty");
    return false;
  }

  if (isSingleEmbroideryMode(formState) && entries.length !== 1) {
    if (debug) {
      console.warn(
        "EMBROIDERY threadType requires exactly one Isacord selection; got",
        entries.length
      );
    }
    return false;
  }

  return entries.every((t) => validateThreadStructure(t, "embroidery", debug));
};

/**
 * Validates all thread-related requirements
 */
export const validateThreads = (formState, debug = false) => {
  if (!validateStitchingThreads(formState, debug)) {
    if (debug) console.warn("Stitching threads validation failed");
    return false;
  }

  if (!validateEmbroiderySelection(formState, debug)) {
    if (debug) console.warn("Embroidery selection validation failed");
    return false;
  }

  return true;
};
