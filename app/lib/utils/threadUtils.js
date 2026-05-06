// app/lib/utils/threadUtils.js

/** `STITCHING` collections collect primary + supporting Amann separately (still one Shopify metafield list). */
export const isSingleStitchingMode = (formState) =>
  formState?.collection?.threadType === "STITCHING";

const validStitchingThreadEntries = (stitchingThreads, formState) => {
  const requireSupportingAmann = isSingleStitchingMode(formState);

  return Object.values(stitchingThreads || {}).filter((t) => {
    if (!t?.isThread || !t?.value || !t?.amannNumbers?.[0]?.value) return false;
    if (requireSupportingAmann && !t?.amannNumbers?.[1]?.value) return false;
    return true;
  });
};

/**
 * Sorted list of selected stitching thread rows (Amann picks). Same order used for [0] in title/SKU.
 * @param {Record<string, object>} stitchingThreads
 * @param {object} [formState] When collection.threadType is STITCHING, only rows with primary + at least one supporting Amann are included (SKU/metafields/persistence). Omit for UI lists that should show rows missing supporting yet.
 * @returns {object[]}
 */
export const sortedStitchingThreadsList = (stitchingThreads, formState) =>
  [...validStitchingThreadEntries(stitchingThreads, formState)].sort((a, b) =>
    String(a.amannNumbers[0].label || "").localeCompare(
      String(b.amannNumbers[0].label || "")
    )
  );

/**
 * First stitching row after stable sort (canonical for variants / aliases).
 * @param {Record<string, object>} stitchingThreads
 * @param {object} [formState]
 * @returns {object | null}
 */
export const firstCanonicalStitchingThread = (stitchingThreads, formState) =>
  sortedStitchingThreadsList(stitchingThreads, formState)[0] ?? null;

/**
 * Rows for product metafields / Shopify: one entry per selected Amann, ordered primary then supporting per thread.
 * @param {Record<string, object>} threads
 * @param {object} formState
 * @returns {{ threadValue: string, amannNumberValue: string }[]}
 */
export const mapStitchingThreads = (threads, formState) =>
  sortedStitchingThreadsList(threads || {}, formState).flatMap((thread) =>
    (thread.amannNumbers || [])
      .filter((n) => n?.value)
      .map((n) => ({
        threadValue: thread.value,
        amannNumberValue: n.value,
      }))
  );

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
