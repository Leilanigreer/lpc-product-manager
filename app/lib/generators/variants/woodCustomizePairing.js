// app/lib/generators/variants/woodCustomizePairing.js

import {
  shouldCollapseWoodVariants,
  woodCollapseColorDesignationsMatch,
} from "./createCustom";

/**
 * Same iteration order as `createCustomVariants` wood `reduce` (Object.values(allShapes), wood only).
 * Maps each selected wood shape’s metaobject id → representative shape id whose Customize row is used.
 *
 * Mirrors `shouldCollapseWoodVariants` + `!needsStyle` collapse-to-first-wood behavior:
 * - Ex1: different styles, needsStyle → separate reps (1:1 base ↔ customize).
 * - Ex2: same style (e.g. Quilted) → one rep; all bases point to that customize variant.
 * - Ex3: different styles (no shared style) → color not applied; separate reps.
 * - Ex3/4: when two+ woods share a style, `colorDesignation` (from the style) splits groups.
 */
export function buildWoodBaseToRepresentativeShapeValueMap(formState) {
  const map = new Map();
  const woods = Object.values(formState.allShapes ?? {}).filter(
    (s) => s.isSelected && s.shapeType === "WOOD"
  );
  const processed = [];

  for (const shape of woods) {
    if (shouldCollapseWoodVariants(shape, processed, formState)) {
      let rep;
      if (!formState.collection?.needsStyle) {
        rep = processed[0];
      } else {
        rep = processed.find((ps) => {
          const stylesMatch = shape.style?.value === ps.style?.value;
          if (!stylesMatch) return false;
          return woodCollapseColorDesignationsMatch(shape, ps, formState);
        });
      }
      if (rep) map.set(shape.value, rep.value);
    } else {
      processed.push(shape);
      map.set(shape.value, shape.value);
    }
  }

  return map;
}
