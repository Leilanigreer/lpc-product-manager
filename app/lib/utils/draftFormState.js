// app/lib/utils/draftFormState.js

import { initialFormState, createInitialShapeState } from "../forms/formState";
import { computeShapeNeedsColorDesignation } from "./shapeUtils";

const STRIP_KEYS = new Set(["shapes", "finalRequirements", "existingProducts"]);

/**
 * Strip loader-derived / computed fields before persisting a draft.
 * @param {object} formState
 */
export function serializeFormStateForDraft(formState) {
  if (!formState || typeof formState !== "object") {
    return { ...initialFormState, collection: { value: "", label: "", threadType: "NONE" } };
  }

  const out = {};
  for (const [key, value] of Object.entries(formState)) {
    if (STRIP_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Build a human-readable draft label from current form selections.
 * @param {object} formState
 */
export function buildDraftLabel(formState) {
  const collectionLabel =
    typeof formState?.collection?.label === "string"
      ? formState.collection.label.trim()
      : "";
  const primary =
    typeof formState?.leatherColors?.primary?.label === "string"
      ? formState.leatherColors.primary.label.trim()
      : "";
  const secondary =
    typeof formState?.leatherColors?.secondary?.label === "string"
      ? formState.leatherColors.secondary.label.trim()
      : "";

  const leatherPart = [primary, secondary].filter(Boolean).join(" / ");
  if (collectionLabel && leatherPart) {
    return `${collectionLabel} — ${leatherPart}`;
  }
  if (collectionLabel) return collectionLabel;
  if (leatherPart) return leatherPart;
  return "Untitled draft";
}

/**
 * Merge a saved draft snapshot into a fresh initial state using current loader data.
 * @param {object} savedFormState
 * @param {{ shapes: object[], shopifyCollections: object[] }} catalog
 */
export function mergeDraftIntoInitialState(savedFormState, { shapes, shopifyCollections }) {
  const saved = savedFormState && typeof savedFormState === "object" ? savedFormState : {};
  const savedAllShapes = saved.allShapes && typeof saved.allShapes === "object" ? saved.allShapes : {};

  const allShapes = (shapes || []).reduce((acc, shape) => {
    const base = createInitialShapeState(shape);
    const savedRow = savedAllShapes[shape.value];
    if (!savedRow) {
      acc[shape.value] = base;
      return acc;
    }

    acc[shape.value] = {
      ...base,
      isSelected: !!savedRow.isSelected,
      style: savedRow.style ?? null,
      colorDesignation: savedRow.colorDesignation ?? null,
    };
    return acc;
  }, {});

  for (const shape of shapes || []) {
    const row = allShapes[shape.value];
    if (!row?.isSelected) continue;
    allShapes[shape.value] = {
      ...row,
      needsColorDesignation: computeShapeNeedsColorDesignation(
        shape,
        row,
        shapes,
        allShapes
      ),
    };
  }

  const collectionId = saved.collection?.value;
  const collection =
    (shopifyCollections || []).find((c) => c.value === collectionId) ||
    saved.collection ||
    initialFormState.collection;

  const existingProducts = collection?.versioningSkus?.existingProducts ?? [];

  return {
    ...initialFormState,
    ...saved,
    shapes: shapes || [],
    allShapes,
    collection,
    existingProducts,
    leatherColors: saved.leatherColors ?? initialFormState.leatherColors,
    stitchingThreads: saved.stitchingThreads ?? {},
    embroideryThreads: saved.embroideryThreads ?? {},
    selectedFont: saved.selectedFont ?? "",
    selectedOfferingType: saved.selectedOfferingType ?? "",
    limitedEditionQuantity: saved.limitedEditionQuantity ?? "",
  };
}

/**
 * Collect warnings when saved GIDs no longer exist in current catalog lists.
 * @param {object} savedFormState
 * @param {{ leatherColors?: object[], stitchingThreadColors?: object[], embroideryThreadColors?: object[], fonts?: object[], shopifyCollections?: object[] }} catalog
 */
export function collectDraftLoadWarnings(savedFormState, catalog) {
  const warnings = [];
  if (!savedFormState) return warnings;

  const leatherIds = new Set((catalog.leatherColors || []).map((x) => x.value));
  const fontIds = new Set((catalog.fonts || []).map((x) => x.value));
  const collectionIds = new Set((catalog.shopifyCollections || []).map((x) => x.value));

  const primary = savedFormState.leatherColors?.primary?.value;
  if (primary && !leatherIds.has(primary)) {
    const label = savedFormState.leatherColors?.primary?.label || primary;
    warnings.push(`Primary leather "${label}" is no longer available.`);
  }
  const secondary = savedFormState.leatherColors?.secondary?.value;
  if (secondary && !leatherIds.has(secondary)) {
    const label = savedFormState.leatherColors?.secondary?.label || secondary;
    warnings.push(`Secondary leather "${label}" is no longer available.`);
  }

  const collectionId = savedFormState.collection?.value;
  if (collectionId && !collectionIds.has(collectionId)) {
    const label = savedFormState.collection?.label || collectionId;
    warnings.push(`Collection "${label}" is no longer available in the create dropdown.`);
  }

  const fontId = savedFormState.selectedFont;
  if (fontId && !fontIds.has(fontId)) {
    warnings.push("The saved font is no longer available.");
  }

  const stitchingIds = new Set();
  for (const row of catalog.stitchingThreadColors || []) {
    stitchingIds.add(row.value);
    for (const n of row.amannNumbers || []) {
      if (n?.value) stitchingIds.add(n.value);
    }
  }
  for (const thread of Object.values(savedFormState.stitchingThreads || {})) {
    if (thread?.value && !stitchingIds.has(thread.value)) {
      warnings.push(`Stitching thread "${thread.label || thread.value}" is no longer available.`);
    }
    for (const n of thread?.amannNumbers || []) {
      if (n?.value && !stitchingIds.has(n.value)) {
        warnings.push(`Amann number "${n.label || n.value}" is no longer available.`);
      }
    }
  }

  const embroideryIds = new Set();
  for (const row of catalog.embroideryThreadColors || []) {
    embroideryIds.add(row.value);
    for (const n of row.isacordNumbers || []) {
      if (n?.value) embroideryIds.add(n.value);
    }
  }
  for (const thread of Object.values(savedFormState.embroideryThreads || {})) {
    if (thread?.value && !embroideryIds.has(thread.value)) {
      warnings.push(`Embroidery thread "${thread.label || thread.value}" is no longer available.`);
    }
    for (const n of thread?.isacordNumbers || []) {
      if (n?.value && !embroideryIds.has(n.value)) {
        warnings.push(`Isacord number "${n.label || n.value}" is no longer available.`);
      }
    }
  }

  return warnings;
}
