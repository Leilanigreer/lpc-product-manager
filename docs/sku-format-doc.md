# SKU Format System

## Core Structure

### 1. Base SKU Components
- Base Pattern: Defined by `formState.finalRequirements.skuPattern` (from the collection's `custom.sku_pattern` metafield).
- Color / thread components:
  - Primary Leather (always included)
  - Secondary Leather (when required by collection)
  - Thread Color:
    - Embroidery Thread (when `threadType` is `EMBROIDERY`)
    - Stitching Thread (when `threadType` is `STITCHING`)
- Version: Added when a product with the same base already exists in Shopify (`-V2`, `-V3`, …).

### 2. Shape, Color Designation, Style, and Custom Suffixes

Regular and custom variants now share the same suffix layout:

```
{versionedBaseSKU}-{shape}[-{colorDesignation}][-{style}][-Custom]
```

Slots are dropped automatically when their underlying field is null/empty/falsy, so collections that don't use a given slot just leave the corresponding field blank (e.g. Quilted leaves `style.abbreviation` blank).

Behaviour per slot:

| Slot | Source | Included when… | Notes |
|---|---|---|---|
| `{shape}` | `formState.allShapes[shape].abbreviation` | Always (when a shape is selected) | Custom-only swap: `shapeType === 'WOOD'` becomes `Fairway` for custom variants. Regular wood variants keep their specific label (`3W`, `5W`, …). |
| `{colorDesignation}` | `formState.allShapes[shape].colorDesignation.abbreviation` | `needsColorDesignation === true` AND a value is set | The chosen leather color's abbreviation (always one of `primary` / `secondary` because the dropdown in `ColorDesignation.jsx` only offers those). |
| `{style}` | `formState.allShapes[shape].style.abbreviation` | A style is assigned to the shape AND its `abbreviation` is non-empty AND the style's `include_abbreviation_in_sku` flag is not explicitly `false` | Putters now also carry styles. To suppress the segment for a specific style (e.g. the lone "Quilted" style on the Quilted collection) while keeping its abbreviation populated for uniqueness/standardization, set `include_abbreviation_in_sku = false` on the style metaobject. Missing/blank field defaults to `true`. |
| `Custom` | n/a | `options.isCustom === true` | Always the final segment for custom variants. |

#### Examples

Regular Driver, no color designation, no style:

```text
classic-BLK-DR
```

Regular Driver with style (Classic with style "Triple Stripe", abbreviation `TS`):

```text
classic-BLK-DR-TS
```

Regular Driver with color designation + style (QClassic with "50/50" / Black designated):

```text
QClassic-BLK-WHT-DR-BLK-50
```

Custom Driver (same QClassic example): just appends `-Custom`:

```text
QClassic-BLK-WHT-DR-BLK-50-Custom
```

Custom 3-Wood (WOOD shape): regular keeps `3W`, custom swaps to `Fairway`:

```text
QClassic-BLK-WHT-3W-WHT-FM         (regular)
QClassic-BLK-WHT-Fairway-WHT-FM-Custom  (custom)
```

Quilted (no style):

```text
Quilted-BLK-IS-DR             (regular)
Quilted-BLK-IS-DR-Custom      (custom)
```

## Template Variables

Available in `skuPattern` (evaluated once per product by `evaluatePattern` in `app/lib/utils/versionUtils.js`):
- `{leatherColors.primary.abbreviation}` – Primary leather color code
- `{leatherColors.secondary.abbreviation}` – Secondary leather color code (when applicable)
- `{stitchingThreads[0].abbreviation}` – Stitching thread code (Argyle uses this)
- `{embroideryThreads[0].abbreviation}` – Embroidery thread code (Quilted uses this). Equivalent alias: `{embroideryThreadColor.abbreviation}` (first canonical Isacord row from `sortedEmbroideryThreadsList`).

Used at variant generation time by `formatSKU` (`app/lib/utils/skuUtils.js`), not in `skuPattern`:
- `{allShapes[shape-value].abbreviation}` – Shape code (replaced with `Fairway` for wood customs)
- `{allShapes[shape-value].colorDesignation.abbreviation}` – Color designation code (when `needsColorDesignation`)
- `{allShapes[shape-value].style.abbreviation}` – Style code (when present)

## Shape-Specific Features

### Wood Type Handling
- Controlled by `shapeType` enum in the shape definition.
- When `shapeType === 'WOOD'`:
  - Regular wood variants keep their specific shape abbreviation (`3W`, `5W`, …) so each wood is its own variant.
  - Custom wood variants collapse to `Fairway` to allow customer freedom in wood selection. See `shouldCollapseWoodVariants` in `app/lib/generators/variants/createCustom.js`.

### Color Designation
- Controlled by `needsColorDesignation` boolean on each row in `formState.allShapes`.
- The value (`colorDesignation`) is one of the product's primary / secondary leathers, selected via the dropdown in `app/components/ShapeSelector/fields/ColorDesignation.jsx`.
- The slot appears in **both regular and custom** SKUs whenever it is set. If `needsColorDesignation` is true but the dropdown is left empty, the segment is omitted.

### Style
- Controlled by the row's `style` selection.
- The slot appears in **both regular and custom** SKUs whenever `style.abbreviation` is truthy AND `style.includeAbbreviationInSku !== false`.
- To suppress the SKU suffix for a particular style (e.g. the "Quilted" style on the Quilted collection), set `include_abbreviation_in_sku = false` on its metaobject. The abbreviation itself can stay populated so the style still satisfies Prisma's unique constraint and any standardization rules.
- The flag is read by `mapStyleMetaobjectNodeToFormStyle` in `app/lib/server/styleShopify.server.js`; missing/blank values default to `true`, so existing styles continue to behave as before.

## SKU Generation Order

1. Start with the base pattern from `finalRequirements.skuPattern` and evaluate placeholders in `generateBaseParts`.
2. Add version number if needed (`-V2`, `-V3`, …) — versioning matches against the base only, not the variant suffix.
3. Append per-variant segments in order:
   1. Shape abbreviation (or `Fairway` for wood customs).
   2. Color designation abbreviation, if `needsColorDesignation` and a value is set.
   3. Style abbreviation, if present.
   4. `Custom`, if the variant is custom.

## Base SKU Derivation (Sync)

`app/lib/server/skuSyncShopify.server.js` infers the versioned base from the first variant's SKU when reconciling `custom.base_sku`:

- **Versioned products**: locate the `-V<n>` segment (case-insensitive). The base is everything up to and including that segment. This is robust regardless of suffix length.
  - `Classic-BRG-V2-Driver-TS` → `Classic-BRG-V2`
  - `QClassic-BLK-WHT-V3-DR-BLK-50` → `QClassic-BLK-WHT-V3`
- **V1 products (no version segment)**: fall back to stripping the last `-` segment. Reliable for legacy `{base}-{shape}` SKUs and single-token suffixes. V1 SKUs with multi-token suffixes can't be inferred precisely; the correctly-written `custom.base_sku` metafield set at creation remains the source of truth.

## Implementation Notes

1. **Version Handling**
   - Existing products are queried (via `custom.base_sku` metafields scanned by `attachVersioningSkusToShopifyCollections`) before SKU generation.
   - Version number is inserted between the base and the variant suffix.

2. **Thread Type Processing**
   - Check the `threadType` enum (`EMBROIDERY`, `STITCHING`, `NONE`).
   - Use the appropriate thread abbreviation in `skuPattern`: `{embroideryThreads[0].abbreviation}` for `EMBROIDERY`, `{stitchingThreads[0].abbreviation}` for `STITCHING`.
   - Legacy `{globalEmbroideryThread.abbreviation}` is no longer supported; update collection `custom.sku_pattern` metafields to the `embroideryThreads[0]` form.

3. **Shape-Specific Features**
   - Check `shapeType` for wood handling (custom-only `Fairway` swap).
   - Check `needsColorDesignation` per shape; include both regular and custom when set.
   - Include style abbreviation whenever present.

4. **Validation Requirements**
   - All required variables must be present in `formState`.
   - Generated SKUs must be unique.
   - Pattern must handle all variant types.
   - Shape-specific features must be properly reflected.
