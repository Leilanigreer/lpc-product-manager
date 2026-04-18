# Plan: Remove global style selection (always independent)

This document lists **what must change** in the codebase if you **remove “global style for all shapes”** and **always use independent (per-shape) style selection** when `collection.needsStyle` is true.

**Scope:** Current patterns as of the repo state that includes `styleMode` / `globalStyle` (see `app/lib/forms/formState.js`, `app/components/CollectionSelector.jsx`).

---

## 1. Product and data behavior (read this first)

### 1.1 `getEffectiveRequirements` today

**File:** `app/lib/utils/requirementsUtils.js`

- **Global mode:** `resolveRequirements(collection, globalStyle)` — **`StyleCollection` overrides** on the chosen global style (e.g. `overrideSecondaryLeather`, `overrideStitchingColor`) **apply** to `finalRequirements`.
- **Independent mode:** `resolveRequirements(collection, null)` — only **`ShopifyCollection`** defaults apply; **per-shape style overrides are not merged** into `finalRequirements`.

So **if you delete global mode and do not add new logic**, requirement flags (`needsSecondaryLeather`, `needsStitchingColor`, `needsColorDesignation`) will **always follow the collection row only**, not any style’s overrides. That may be **incorrect** if you still store meaningful overrides on `StyleCollection` for independent flows.

**Decision needed:** Keep collection-level truth only, **or** implement merging from per-shape styles (e.g. union/max of requirements, or “primary” shape), **or** duplicate override semantics into collection metafields.

### 1.2 `calculateFinalRequirements` templates today

**Same file:** In **global** mode, title/SEO/handle/validation/SKU pattern can come from **`globalStyle`** with fallback to collection. In **non-global** mode, **`finalRequirements`** uses **collection `titleFormat` / `defaultStyleNamePattern` / `skuPattern`** and fixed defaults (`leatherPhrase: 'leather as'`, `useOppositeLeather: false`).

Independent per-shape styles still carry **`titleTemplate`**, **`leatherPhrase`**, etc. on each **style object** in the shape grid, but those fields are **not** what populate **`formState.finalRequirements`** in the current independent branch—variants/generators use **`finalRequirements`** for some things and **per-shape `shape.style`** for others. Removing global **does not by itself** unify that; audit call sites (see §4).

---

## 2. UI changes

| Area | Current behavior | Change |
|------|------------------|--------|
| **`app/components/CollectionSelector.jsx`** | When `needsStyle`, shows **Style mode** select (global vs independent) and, if global, **Global style** select. | Remove **Style mode** control and **Global style** control. Optionally show a short static hint: “Style is selected per shape below.” |
| **`app/components/ShapeSelector/ShapeGrid.jsx`** | `showStyleFields` requires `styleMode === 'independent'`. | Set to **independent whenever** `collection.needsStyle && !putter` (drop `styleMode` check), **or** assume `styleMode` is always `'independent'` when `needsStyle`. |

No other components in `ShapeSelector/` reference `styleMode` in the grep set; **`StyleField`** is shown only when `showStyleFields` is true.

---

## 3. Form state and reducer (`useFormState`)

**File:** `app/hooks/useFormState.js`

| Topic | Action |
|-------|--------|
| **Initial / reset** | `UPDATE_COLLECTION` currently sets `styleMode: ''`, `globalStyle: null`. If the collection needs styles, set **`styleMode: 'independent'`** (and keep `globalStyle: null`) so validation and branches that still check `styleMode` keep working until you remove them. |
| **`UPDATE_STYLE_MODE`** | Can be **removed** if the UI never dispatches it; or keep as a no-op for a deprecation period. |
| **`UPDATE_GLOBAL_STYLE`** | Can be **removed** once nothing calls `onChange('globalStyle', ...)`. |
| **`handleChange` `actionMap`** | Remove **`styleMode`** and **`globalStyle`** entries if actions are deleted. |
| **`UPDATE_STYLE_MODE` body** | Today clears per-shape `style` when switching to **global**. If only independent exists, **delete** the global branch and only keep logic relevant to independent (e.g. color designation recompute). |
| **`UPDATE_GLOBAL_STYLE` case** | Remove entirely if unused. |
| **Shape selection / fields** | Logic that keys off `styleMode === 'independent'` (e.g. `UPDATE_SHAPE`, `UPDATE_SHAPE_FIELD` for `needsColorDesignation`) can be simplified to assume independent when `needsStyle`. |

---

## 4. Requirements and generators

**File:** `app/lib/utils/requirementsUtils.js`

- **`getEffectiveRequirements`:** Remove the branch `if (formState.styleMode === 'global' && formState.globalStyle)`. Either always call `resolveRequirements(collection, null)` or implement a new rule (see §1.1).
- **`calculateFinalRequirements`:** Remove the `if (formState.styleMode === 'global' && formState.globalStyle) { ... }` template block; **only** the “collection-level templates” branch remains unless you add per-shape template merging.

**Files:** `app/lib/generators/variants/createCustom.js`

- **`getVariantName` / color designation:** Uses `formState.styleMode === 'global' ? globalStyle : shapeData.style`. → Always use **`shapeData.style`** (and guard nulls).
- **`shouldCollapseWoodVariants`:** Compares `globalStyle` vs per-shape style. → Compare **`currentShape.style`** vs **`processedShape.style`** only (same as independent branches today).

**Files:** `app/lib/generators/titleGenerator.js`

- **`generateSEOTitle` / `generateMainHandle`:** Use `formState.globalStyle?.overrides?.seoTemplate` / `handleTemplate` with fallback to **`formState.collection?.titleFormat`**. After removing global style, **drop `globalStyle`** references; rely on **`collection.titleFormat`** (and fix **`overrides`** if that property does not exist on your in-memory style objects—today’s mapping may use flat `seoTemplate` on style).

**Files:** `app/lib/generators/index.js`

- **`productData`** still passes `styleMode` and `globalStyle`. → Set **`styleMode: 'independent'`** (or remove fields if consumers updated) and **`globalStyle: null`**.

**Files:** `app/lib/generators/variants/createRegular.js` — **no `styleMode`** in variant creation; embroidery uses `threadMode` only.

---

## 5. Validation

**File:** `app/lib/utils/validations/styleValidations.js`

- **`validateStyles`:** Today requires `styleMode` set, then validates global **or** shape styles. → Require **`styleMode === 'independent'`** only (or drop mode check and only run **`validateShapeStyles`** when `needsStyle`).
- **`validateGlobalStyle`:** Can be **removed** or left unused.

**File:** `app/lib/utils/validations/index.js`

- Replace branches like `formState.styleMode === 'global'` vs `independent` with a **single** shape-style validation path when `needsStyle`.

---

## 6. SKU and DB persistence

**File:** `app/lib/utils/skuUtils.js`

- Custom SKU path uses `shapeData.style?.abbreviation || formState.globalStyle?.abbreviation`. → Rely on **`shapeData.style`**; remove **`globalStyle`** fallback once global is gone.

**File:** `app/lib/server/productOperations.server.js`

- When saving variants, connects **Style** via `productData.styleMode === 'global' ? globalStyle : regular.style`. → **Always** use **`regular.style`** (per-variant) when `needsStyle`.

---

## 7. Form defaults and docs

**File:** `app/lib/forms/formState.js`

- Update comments and defaults: e.g. **`styleMode: 'independent'`** or remove `styleMode` if you delete the concept entirely.

**File:** `docs/form-state.md` (and **`docs/needs-stitching-color-mapping.md`** if it mentions global style)

- Update descriptions of **`getEffectiveRequirements`** and **`finalRequirements`** so they match the new rules.

---

## 8. Embroidery / thread UX (orthogonal but easy to confuse)

**File:** `app/components/ThreadColorSelector.jsx`

- **Embroidery** “global vs per shape” is controlled by **`threadMode.embroidery`** (`global` vs `perShape`), **not** by **`styleMode`**. No change required for **removing global style** unless you intentionally want to align naming—do not mix the two concepts.

---

## 9. Suggested implementation order

1. **Decide** override semantics for `finalRequirements` vs `StyleCollection` (§1.1).
2. **UI:** `CollectionSelector` + `ShapeGrid` (`showStyleFields`).
3. **`requirementsUtils`** + **`titleGenerator`** (template sources).
4. **Generators:** `createCustom.js` + `index.js` product payload.
5. **`useFormState`** cleanup and collection init (`styleMode` default).
6. **Validation** + **`productOperations`** + **`skuUtils`**.
7. **Docs** and any **tests** that assert global style.

---

## 10. Files to touch (checklist)

| File | Likely edits |
|------|----------------|
| `app/components/CollectionSelector.jsx` | Remove mode + global style UI |
| `app/components/ShapeSelector/ShapeGrid.jsx` | `showStyleFields` condition |
| `app/hooks/useFormState.js` | Collection init; simplify/remove style mode & global style actions |
| `app/lib/forms/formState.js` | Defaults / comments |
| `app/lib/utils/requirementsUtils.js` | `getEffectiveRequirements`, `calculateFinalRequirements` |
| `app/lib/generators/variants/createCustom.js` | Global branches |
| `app/lib/generators/titleGenerator.js` | `globalStyle` references |
| `app/lib/generators/index.js` | `productData` shape |
| `app/lib/utils/validations/styleValidations.js` | `validateStyles` / remove `validateGlobalStyle` |
| `app/lib/utils/validations/index.js` | Product form validation branches |
| `app/lib/utils/skuUtils.js` | `globalStyle` abbreviation fallback |
| `app/lib/server/productOperations.server.js` | Style connect branch |
| `docs/form-state.md` | Documentation |
| `docs/needs-stitching-color-mapping.md` | If it references global style resolution |

---

*This is a planning document only; no runtime behavior was changed when adding this file.*
