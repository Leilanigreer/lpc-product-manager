# `needsColorDesignation` — usage map

This document describes how **`needsColorDesignation`** is used: at the **collection / resolved requirements** layer and at the **per-shape** layer. The same phrase appears in both places but means slightly different things.

---

## 1. Two layers (do not confuse)

| Layer | Where it lives | Role |
|--------|----------------|------|
| **Collection + style overrides** | Prisma `ShopifyCollection.needsColorDesignation`, optional `StyleCollection.overrideColorDesignation` | Default rule: “this collection (or this style-in-collection) expects **color designation** for applicable shapes.” |
| **Resolved flag** | `formState.finalRequirements.needsColorDesignation` | Output of **`resolveRequirements(collection, selectedStyle)`** in `app/lib/utils/requirementsUtils.js` (same pattern as `needsSecondaryLeather` / `needsStitchingColor` when global style is used). |
| **Per-shape flag** | `formState.allShapes[shapeId].needsColorDesignation` | Whether **this** selected shape must show the color-designation UI and satisfy validation for **`colorDesignation`**. |

---

## 2. How `finalRequirements.needsColorDesignation` is computed

**File:** `app/lib/utils/requirementsUtils.js`

```text
needsColorDesignation =
  selectedStyle?.overrideColorDesignation ?? collection.needsColorDesignation ?? false
```

- With **global style mode** and a selected global style, **style overrides** can apply.
- Otherwise, only the **collection** boolean applies (see `getEffectiveRequirements`).

---

## 3. How per-shape `needsColorDesignation` is set

**File:** `app/hooks/useFormState.js`

For each shape, the boolean is set when:

- The shape becomes **selected**, or
- **Style** changes in **independent** mode (recalculation across selected shapes).

For **non-putter** shapes, `needsColorDesignation` is **true** when:

- **`finalRequirements.needsColorDesignation`** is **true**, or
- **Wood-type** logic applies (`findMatchingWoodStyles`, etc.): certain multi-shape combinations require designation even when the collection flag alone is false.

**Putters** are excluded (`!isPutter(shape)`): they do not get the color-designation column for this flow.

---

## 4. Data loading

**File:** `app/lib/utils/dataFetchers.js`

- **`getShopifyCollections`:** Maps **`needsColorDesignation`** onto each collection object passed to the client.
- Each embedded style includes **`overrideColorDesignation`** from `StyleCollection`.
- **`getStyles`:** Exposes a derived **`needsColorDesignation`** per style–collection: `overrideColorDesignation ?? collection.needsColorDesignation`.

---

## 5. UI: when the designation field appears

**File:** `app/components/ShapeSelector/ShapeGrid.jsx`

- **`showColorDesignation`** = `isSelected && shapeState?.needsColorDesignation` (per-shape flag).

**File:** `app/components/ShapeSelector/fields/ColorDesignation.jsx`

- Renders a **Select** listing the product **primary** and **secondary** leather colors (`formState.leatherColors`).
- Stores **`colorDesignation`** on the shape (the chosen leather object used for naming/SKU rules).

So **per-shape `needsColorDesignation`** means: “user must choose **which** leather (primary vs secondary) is the designated color for this shape.”

---

## 6. Validation

**File:** `app/lib/utils/validations/colorValidations.js`

- **`validateShapeColorDesignations`:** For every **selected** shape with **`needsColorDesignation === true`**, **`colorDesignation`** must pass **`validateColorDesignation`** (non-empty `value` / `label`, valid `colorTags` if present).

**File:** `app/lib/utils/validations/requirementValidations.js`

- **`finalRequirements.needsColorDesignation`** must be a **boolean** (part of the overall `finalRequirements` shape check).

**File:** `app/lib/utils/validations/index.js`

- **`validateProductForm`** calls **`validateShapeColorDesignations`** and surfaces failures as “Invalid color designations for shapes.”

---

## 7. SKU and custom variant naming

**File:** `app/lib/utils/skuUtils.js`

- Custom SKU path can append the **color designation abbreviation** when **`shapeData.needsColorDesignation`** and **`shapeData.colorDesignation?.abbreviation`** are set.

**File:** `app/lib/generators/variants/createCustom.js`

- **`getVariantName`:** Uses **`needsColorDesignation`** and the chosen **leather** (`colorDesignation`) for longer custom names (e.g. QClassic-style patterns using `namePattern` / `leatherPhrase`).
- **`shouldCollapseWoodVariants`:** Uses **`needsColorDesignation`** when comparing whether two wood variants should collapse.

---

## 8. Form state defaults

**File:** `app/lib/forms/formState.js`

- **`finalRequirements.needsColorDesignation`** defaults to **`false`** in initial state.

---

## 9. File index

| Path | Role |
|------|------|
| `prisma/schema.prisma` | `ShopifyCollection.needsColorDesignation`; `StyleCollection.overrideColorDesignation` |
| `app/lib/utils/requirementsUtils.js` | Resolution into `finalRequirements.needsColorDesignation` |
| `app/lib/utils/dataFetchers.js` | Collection + style mapping |
| `app/hooks/useFormState.js` | Per-shape `needsColorDesignation` and recalculation |
| `app/components/ShapeSelector/ShapeGrid.jsx` | `showColorDesignation` |
| `app/components/ShapeSelector/fields/ColorDesignation.jsx` | Primary/secondary leather select → `colorDesignation` |
| `app/lib/utils/validations/colorValidations.js` | `validateShapeColorDesignations`, `validateColorDesignation` |
| `app/lib/utils/validations/requirementValidations.js` | Boolean on `finalRequirements` |
| `app/lib/utils/validations/index.js` | Wires product form validation |
| `app/lib/utils/skuUtils.js` | SKU segments when designation present |
| `app/lib/generators/variants/createCustom.js` | Custom names + wood collapse |
| `docs/form-state.md` | Notes on shape state (may drift; prefer this file + code) |
| `docs/sku-format-doc.md` | SKU documentation for designation |

---

## 10. Plain-language summary

**Color designation** answers: *for this shape, which of the two leathers (primary or secondary) is the “designated” one for titles/SKUs/custom copy?*  

**`needsColorDesignation`** at the **shape** level means that choice is **required** for that row. **Collection / style** flags feed **`finalRequirements`**, which combine with **shape type** (putter vs wood, etc.) to decide which rows need the field.

---

*Generated from the current codebase layout; re-grep `needsColorDesignation` after large refactors.*
