# Plan: Remove global style selection (always independent)

This document lists **what must change** in the codebase to remove "global style for all shapes" and always use independent (per-shape) style selection.

**Architecture context:** This plan reflects the locked-in Shopify metafield migration decisions. The source of truth for collection and style data is moving from Postgres (`ShopifyCollection`, `StyleCollection`) to Shopify metafields and metaobjects. Code changes here should be made against the current codebase but must be compatible with that target state.

---

## Locked-in data architecture (reference)

### Collection metafields (read once on collection select)
| Field | Used for |
|-------|----------|
| `threadType` | Drives stitching vs embroidery UI behavior in `ThreadColorSelector` |
| `needsSecondaryLeather` | Shows/hides secondary leather color picker |
| `skuPattern` | Base SKU template for generation |

### Style metaobject fields (read per shape when style is selected)

These are the final confirmed fields on the Shopify Style metaobject as of the current metaobject definition. Shopify field key is shown for reference.

| Shopify field label | Key | Type | Used for |
|---------------------|-----|------|----------|
| `Both: Style` | `style` | Choice list | Storefront filtering + app style selection |
| `Web: Category` | `category` | Choice list | Storefront display grouping |
| `Web: description` | `description` | Single line text | Storefront |
| `Web: preview_image` | `preview_image` | Image | Storefront |
| `Web: Sort Number` | `sort_number` | Integer | Storefront display order |
| `App: Collection Category` | `collection_category` | Choice list (`argyle`, `quilted`, `classic_exotic`, `quilted_classic_exotic`) | App style filtering per collection |
| `App: Shape Group` | `shape_group` | Choice list (`drivers_woods_hybrids`, `blades`, `mallets`) | App style filtering per shape |
| `App: Abbreviation` | `abbreviation` | Single line text | SKU generation |
| `App: Use Opposite Leather` | `use_opposite_leather` | Boolean | Named leather column logic |
| `App: Leather Phrase` | `leather_phrase` | Single line text | Variant name copy |
| `App: Name Pattern` | `name_pattern` | Choice list (`STANDARD`, `STYLE_FIRST`) | Variant name sentence structure |
| `App: Needs Color Designation` | `needs_color_designation` | Boolean | Shows color designation column per shape row |

**Note on `App: Name Pattern`:** The `CUSTOM` value and corresponding `customNamePattern` string field are intentionally omitted. No styles currently use `CUSTOM` and it falls through to `STANDARD` in the generator. Add both only when a concrete use case arises.

**Note on `App: Needs Secondary Leather`:** This field was removed from the Style metaobject. Secondary leather is a collection-level gate only — no style-level override is needed (confirmed by SQL analysis: 0 rows used `overrideSecondaryLeather` in `StyleCollection`).

### Dropped entirely
- `ShopifyCollection.needsColorDesignation` — moves to Style metaobject
- `ShopifyCollection.needsStitchingColor` — derived from `threadType`; never read by thread UI
- `ShopifyCollection.needsStyle` — derived from presence of styles on collection
- `StyleCollection` junction table and all override columns
- `finalRequirements.needsColorDesignation` — no longer a collection-level concept
- `finalRequirements.needsStitchingColor` — never used by UI; driven by `threadType`
- `Style.customNamePattern` — not needed until a concrete use case exists

---

## 1. `finalRequirements` — what stays, what goes

**File:** `app/lib/forms/formState.js`, `app/lib/utils/requirementsUtils.js`

`finalRequirements` after this change carries only collection-level fields:

```js
finalRequirements: {
  needsSecondaryLeather: false,   // keep — drives LeatherColorSelector UI
  threadType: 'NONE',             // keep — drives ThreadColorSelector behavior
  skuPattern: null,               // keep — used by generators
  titleTemplate: null,            // keep — collection titleFormat
  seoTemplate: null,              // keep
  handleTemplate: null,           // keep
  validation: null,               // keep
}
```

**Remove from `finalRequirements`:**
- `needsStitchingColor` — was never read by thread UI; driven by `threadType`
- `needsColorDesignation` — moves to per-shape state, sourced from selected style
- `namePattern` — now per-shape, sourced from selected style
- `leatherPhrase` / `useOppositeLeather` fixed defaults — now per-shape from style

**Remove from `requirementsUtils.js`:**
- `getEffectiveRequirements` global style branch — delete entirely
- `resolveRequirements(collection, selectedStyle)` — simplify to `resolveRequirements(collection)` only; no style overrides at collection level
- All references to `StyleCollection` override fields (`overrideSecondaryLeather`, `overrideStitchingColor`, `overrideColorDesignation`, etc.)

---

## 2. Per-shape `needsColorDesignation` — new source of truth

**Files:** `app/hooks/useFormState.js`, `app/components/ShapeSelector/ShapeGrid.jsx`

`needsColorDesignation` on a shape is now set when a style is selected for that shape, not from `finalRequirements`. The trigger is `UPDATE_SHAPE_FIELD` when `field === 'style'`.

**New logic in `UPDATE_SHAPE_FIELD`:**
```js
if (field === 'style') {
  newAllShapes[shapeValue] = {
    ...shape,
    style: value,
    needsColorDesignation: !isPutter(shape) && (
      value?.needsColorDesignation ||
      (isWoodType(shape) && findMatchingWoodStyles(state.shapes, newAllShapes)[shape.value])
    )
  };
}
```

The wood-matching logic (`findMatchingWoodStyles`) is unchanged — two wood shapes with the same style still trigger color designation. The only change is that the base `needsColorDesignation` flag comes from the style object itself, not from `finalRequirements`.

**`UPDATE_SHAPE` (shape selected/deselected):** Remove the `state.finalRequirements?.needsColorDesignation` reference. On initial shape selection, `needsColorDesignation` defaults to `false` since no style has been picked yet.

**`ShapeGrid.jsx` — `showStyleFields`:** Remove `styleMode === 'independent'` check. Simplify to:
```js
showStyleFields: isSelected && !isPutterShape && !!collection.styles?.length
```

---

## 3. UI changes

### `app/components/CollectionSelector.jsx`
- Remove the **Style mode** select control (`independent` vs `global`)
- Remove the **Global style** select control
- Optionally add a static hint: "Style is selected per shape below" when the collection has styles

### `app/components/ShapeSelector/ShapeGrid.jsx`
- Update `showStyleFields` condition as described in §2
- Remove `styleMode` from the `visibilityFlags` destructure

### No changes needed
- `ThreadColorSelector.jsx` — already driven by `threadType` and `threadMode.embroidery`, not style mode
- `StyleField.jsx` — already operates in independent mode only
- `ColorDesignation.jsx` — reads per-shape `needsColorDesignation`, no change needed

---

## 4. Form state and reducer

**File:** `app/hooks/useFormState.js`

| Item | Action |
|------|--------|
| `ACTION_TYPES.UPDATE_STYLE_MODE` | Remove entirely |
| `ACTION_TYPES.UPDATE_GLOBAL_STYLE` | Remove entirely |
| `styleMode` and `globalStyle` in `handleChange` actionMap | Remove both entries |
| `UPDATE_COLLECTION` case | Remove `styleMode: ''` and `globalStyle: null` resets; they no longer exist |
| `UPDATE_SHAPE` case | Remove `state.styleMode === 'independent'` guard; always compute wood-based designation |
| `UPDATE_SHAPE_FIELD` case | Remove `state.styleMode === 'independent'` guard on color designation recalc; update to read `needsColorDesignation` from style object (see §2) |

**File:** `app/lib/forms/formState.js`

- Remove `styleMode: null` from `initialFormState`
- Remove `globalStyle: null` from `initialFormState`
- Remove `needsStitchingColor`, `needsColorDesignation`, `namePattern` from `finalRequirements` defaults
- Update comments throughout

---

## 5. Generators

### `app/lib/generators/variants/createCustom.js`

**`getVariantName`:** Remove global style branch:
```js
// Before
const styleSource = formState.styleMode === 'global'
  ? formState.globalStyle
  : shapeData.style;

// After
const styleSource = shapeData.style;
```

**`shouldCollapseWoodVariants`:** Remove global style references:
```js
// Before
const currentStyle = styleMode === 'global' ? globalStyle : currentShape.style;
const processedStyle = styleMode === 'global' ? globalStyle : processedShape.style;

// After
const currentStyle = currentShape.style;
const processedStyle = processedShape.style;
```

Also remove the `if (!collection.needsStyle) return true` early-return — derive from `collection.styles?.length` instead.

### `app/lib/generators/titleGenerator.js`
- Remove `formState.globalStyle?.overrides?.seoTemplate` / `handleTemplate` references
- Fall through directly to `formState.collection?.titleFormat` for all template lookups

### `app/lib/generators/index.js`
- Remove `styleMode` and `globalStyle` from the `productData` payload passed to generators

### `app/lib/generators/variants/createRegular.js`
- No changes needed — already uses per-shape style only

---

## 6. Validation

**File:** `app/lib/utils/validations/styleValidations.js`

- **`validateGlobalStyle`** — remove entirely
- **`validateStyles`**: Remove `needsStyle` collection check and `styleMode` check. Simplify to: when the collection has styles (`collection.styles?.length > 0`), run `validateShapeStyles` only
- **`validateShapeStyles`**: Remove `styleMode !== 'independent'` early return; always validate when called

**File:** `app/lib/utils/validations/index.js`
- Remove global style validation branch
- Single path: `validateShapeStyles` when collection has styles

**File:** `app/lib/utils/validations/requirementValidations.js`
- Remove boolean presence checks for `finalRequirements.needsColorDesignation` and `finalRequirements.needsStitchingColor` — those fields no longer exist on `finalRequirements`

---

## 7. SKU and persistence

**File:** `app/lib/utils/skuUtils.js`
- Remove `formState.globalStyle?.abbreviation` fallback
- Always use `shapeData.style?.abbreviation`

**File:** `app/lib/server/productOperations.server.js`
- Remove `styleMode === 'global' ? globalStyle : regular.style` branch
- Always use `regular.style` (per-variant) when connecting Style on save

---

## 8. Thread mode (no change — orthogonal)

`threadMode.embroidery` (`global` vs `perShape`) is a separate concept from style mode and is **not affected by this change**. Do not conflate them. `ThreadColorSelector` behavior remains driven by `collection.threadType` and `threadMode.embroidery` only.

---

## 9. Suggested implementation order

1. **`formState.js`** — remove `styleMode`, `globalStyle`, and dead `finalRequirements` fields from defaults
2. **`requirementsUtils.js`** — simplify `getEffectiveRequirements` and `calculateFinalRequirements`
3. **`useFormState.js`** — remove `UPDATE_STYLE_MODE`, `UPDATE_GLOBAL_STYLE`; update `UPDATE_SHAPE` and `UPDATE_SHAPE_FIELD` for new `needsColorDesignation` source
4. **`CollectionSelector.jsx`** + **`ShapeGrid.jsx`** — remove UI controls and update `showStyleFields`
5. **Generators** — `createCustom.js`, `titleGenerator.js`, `index.js`
6. **Validation** — `styleValidations.js`, `index.js`, `requirementValidations.js`
7. **`skuUtils.js`** + **`productOperations.server.js`**
8. **Docs** — update `form-state.md`, remove or archive `needs-stitching-color-mapping.md`

---

## 10. Files to touch (checklist)

| File | Change |
|------|--------|
| `app/lib/forms/formState.js` | Remove `styleMode`, `globalStyle`, dead `finalRequirements` fields |
| `app/lib/utils/requirementsUtils.js` | Remove global style branch; simplify resolution |
| `app/hooks/useFormState.js` | Remove style mode actions; update shape field handler |
| `app/components/CollectionSelector.jsx` | Remove style mode + global style UI |
| `app/components/ShapeSelector/ShapeGrid.jsx` | Update `showStyleFields` condition |
| `app/lib/generators/variants/createCustom.js` | Remove global style branches |
| `app/lib/generators/titleGenerator.js` | Remove `globalStyle` template references |
| `app/lib/generators/index.js` | Remove `styleMode` / `globalStyle` from payload |
| `app/lib/utils/validations/styleValidations.js` | Remove `validateGlobalStyle`; simplify `validateStyles` |
| `app/lib/utils/validations/index.js` | Single shape-style validation path |
| `app/lib/utils/validations/requirementValidations.js` | Remove dead `finalRequirements` field checks |
| `app/lib/utils/skuUtils.js` | Remove `globalStyle` abbreviation fallback |
| `app/lib/server/productOperations.server.js` | Always use per-variant style on save |
| `docs/form-state.md` | Update to reflect new defaults |
| `docs/needs-stitching-color-mapping.md` | Archive or remove |

---

*Reflects locked-in Shopify metafield architecture decisions. `StyleCollection` junction table and all collection-level override columns are being dropped. `needsColorDesignation`, `leatherPhrase`, `useOppositeLeather`, `namePattern`, `abbreviation`, `collectionCategory`, and `shapeGroup` live on the Style metaobject. `customNamePattern` and `needsSecondaryLeather` are intentionally excluded from Style — the former has no current use case, the latter is collection-only.*
