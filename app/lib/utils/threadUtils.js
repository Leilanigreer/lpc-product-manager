// app/lib/utils/threadUtils.js

const validStitchingThreadEntries = (stitchingThreads) =>
  Object.values(stitchingThreads || {}).filter(
    (t) => t?.isThread && t?.value && t?.amannNumbers?.[0]?.value
  );

/**
 * Sorted list of selected stitching thread rows (Amann picks). Same order used for [0] in title/SKU.
 * @param {Record<string, object>} stitchingThreads
 * @returns {object[]}
 */
export const sortedStitchingThreadsList = (stitchingThreads) =>
  [...validStitchingThreadEntries(stitchingThreads)].sort((a, b) =>
    String(a.amannNumbers[0].label || "").localeCompare(
      String(b.amannNumbers[0].label || "")
    )
  );

/**
 * First stitching row after stable sort (canonical for variants / aliases).
 * @param {Record<string, object>} stitchingThreads
 * @returns {object | null}
 */
export const firstCanonicalStitchingThread = (stitchingThreads) =>
  sortedStitchingThreadsList(stitchingThreads)[0] ?? null;

/**
 * Rows for product metafields / generators: one row per selected Amann (product-level).
 * @param {Record<string, object>} threads
 * @returns {{ threadValue: string, amannNumberValue: string }[]}
 */
export const mapStitchingThreads = (threads) =>
  sortedStitchingThreadsList(threads || {}).map((thread) => ({
    threadValue: thread.value,
    amannNumberValue: thread.amannNumbers[0].value,
  }));

/** @param {object} formState */
export const isSingleEmbroideryMode = (formState) =>
  formState?.collection?.threadType === "EMBROIDERY";

const validEmbroideryThreadEntries = (embroideryThreads) =>
  Object.values(embroideryThreads || {}).filter(
    (t) => t?.isThread && t?.value && t?.isacordNumbers?.[0]?.value
  );

/**
 * Sorted list of selected embroidery thread rows (Isacord picks). Same order used for [0] in title/SKU.
 * @param {Record<string, object>} embroideryThreads
 * @returns {object[]}
 */
export const sortedEmbroideryThreadsList = (embroideryThreads) =>
  [...validEmbroideryThreadEntries(embroideryThreads)].sort((a, b) =>
    String(a.isacordNumbers[0].label || "").localeCompare(
      String(b.isacordNumbers[0].label || "")
    )
  );

/**
 * First embroidery row after stable sort (canonical for variants / aliases).
 * @param {Record<string, object>} embroideryThreads
 * @returns {object | null}
 */
export const firstCanonicalEmbroideryThread = (embroideryThreads) =>
  sortedEmbroideryThreadsList(embroideryThreads)[0] ?? null;

/**
 * Rows for product metafields / generators: one row per selected Isacord (product-level only).
 * @param {object} formState
 * @returns {{ embroideryThreadValue: string, isacordNumberValue: string }[]}
 */
export const mapEmbroideryThreads = (formState) =>
  sortedEmbroideryThreadsList(formState.embroideryThreads).map((thread) => ({
    embroideryThreadValue: thread.value,
    isacordNumberValue: thread.isacordNumbers[0].value,
  }));
