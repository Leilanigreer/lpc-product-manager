# SKU Format System

## Core Structure

### 1. Base SKU Components
- Base Pattern: Defined by formState.finalRequirements.skuPattern
- Color Components:
  - Primary Leather (Always included)
  - Secondary Leather (When required by collection)
  - Thread Color:
    - Embroidery Thread (When threadType is EMBROIDERY)
    - Stitching Thread (When threadType is STITCHING)
- Version: Added if SKU base exists (-V2, -V3, etc.)

### 2. Shape & Custom Suffixes

#### Regular Variants
- Base + Shape Abbreviation
  - Example: `quilted-BLK-WHT-DR` (Quilted, Black, White, Driver)

#### Custom Variants

Special handling for different shape types and features:

1. Wood Type Handling:
   ```javascript
   // For shapes where shapeType === "WOOD" and is Custom
   // Always use "Fairway" abbreviation regardless of actual shape
   `${versionedBaseSKU}-Fairway-Custom`
   ```

2. Color Designation Handling:
   ```javascript
   // When needsColorDesignation is true
   `${versionedBaseSKU}-${shape.abbreviation}-${allShapes.[shape-value].colorDesignation.abbreviation}-${allShapes.[shape-value].style.abbreviation}-Custom`
   ```

3. Standard Custom:
   ```javascript
   // Basic custom variant
   `${versionedBaseSKU}-${shape.abbreviation}-Custom`
   ```

4. Styled Custom:
   ```javascript
   // When style is present but no color designation
   `${versionedBaseSKU}-${shape.abbreviation}-${allShapes.[shape-value].style.abbreviation}-Custom`
   ```

## Template Variables

Available in skuPattern and final SKU construction:
- `{finalRequirements.skuPattern}` - Base pattern defined at collection level
- `{leatherColors.primary.abbreviation}` - Primary leather color code
- `{leatherColors.secondary.abbreviation}` - Secondary leather color code (when applicable)
- `{formState.stitchingThreads?.['thread-value'].abbreviation}` - Stitching thread code
- `{formState.globalEmbroideryThread.abbreviation}` - Embroidery thread code
- `{allShapes.[shape-value].abbreviation}` - Shape code
- `{allShapes.[shape-value].style.abbreviation}` - Style code (when applicable)
- `{version}` - Version number if SKU exists
- `{custom}` - "Custom" suffix for custom variants

## Shape-Specific Features

### Wood Type Handling
- Controlled by `shapeType` enum in shape definition
- When `shapeType === "WOOD"`:
  - All wood-type shapes use "Fairway" abbreviation in SKU
  - Applies to custom variants
  - Ensures consistent SKU format across wood-type products

### Color Designation
- Controlled by `needsColorDesignation` boolean in `allShapes.[shape-value]`
- Can be applied to any shape in collections that require styles
- Independent of collection type
- Affects SKU generation when true
- For custom variants, includes both color designation and style abbreviation

## Examples

### Basic Collection Pattern
```json
{
  "skuPattern": "classic-{leatherColors.primary.abbreviation}",
  "regularExample": "classic-BLK",
  "customExample": "classic-BLK-Custom"
}
```

### Pattern with Secondary Leather
```json
{
  "skuPattern": "qclassic-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}",
  "regularExample": "qclassic-BLK-WHT",
  "customExample": "qclassic-BLK-WHT-Custom",
}
```

### Wood Type Examples
```json
{
  "skuPattern": "classic-{leatherColors.primary.abbreviation}",
  "shapeType": "WOOD",
  "regularExample": "classic-BLK-3Wood",
  "customExample": "classic-BLK-Fairway-Custom"
}
```

### Color Designation Examples
```json
{
  "skuPattern": "qclassic-{leatherColors.primary.abbreviation}",
  "needsColorDesignation": true,
  "regularExample": "qclassic-BLK-DR",
  "customExample": "qclassic-BLK-DR-BLU-50-Custom"
}
```

### Thread Color Pattern
```json
{
  "threadType": "EMBROIDERY",
  "skuPattern": "quilted-{leatherColors.primary.abbreviation}-{formState.globalEmbroideryThread.abbreviation}",
  "regularExample": "quilted-BLK-IS",
  "customExample": "quilted-BLK-IS-Custom"
}
```

## SKU Generation Order

1. Start with base pattern from finalRequirements.skuPattern
2. Add version number if needed (-V2, -V3, etc.)
3. For regular variants:
   - Add shape abbreviation 
4. For custom variants:
   - Check shapeType for wood handling (use "Fairway" for wood types)
   - Check needsColorDesignation for additional components
   - Add appropriate suffixes based on conditions
   - Always end with "Custom" suffix

## Implementation Notes

1. Version Handling:
   - Query existing products before SKU generation
   - Insert version number if base SKU exists
   - Version appears before shape and style suffixes

2. Thread Type Processing:
   - Check threadType enum (EMBROIDERY, STITCHING, NONE)
   - Use appropriate thread abbreviation based on type
   - Include in SKU only if threadType is not NONE

3. Shape-Specific Features:
   - Check shapeType for wood handling
   - Check needsColorDesignation per shape
   - Include designated leather and style if true
   - Apply regardless of collection type

4. Validation Requirements:
   - All required variables must be present in formState
   - Generated SKUs must be unique
   - Pattern must handle all variant types
   - Shape-specific features must be properly reflected
