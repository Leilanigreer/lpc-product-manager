# Variant Naming Conventions

## Core Cases

### 1. Putter Shapes
Putters follow the same style/colorDesignation rules as any other shape; the choice of pattern below depends on the collection and the row's style/colorDesignation flags. (Historically putters had no style variations — that constraint has been removed.)

### 2. Non-Styled Collections
Applies when:
- Collection doesn't need style (Quilted is the only collection in this group today; set the style metaobject's `include_abbreviation_in_sku = false` to suppress the SKU segment while keeping the abbreviation populated) OR
- Collection needs style BUT using global style mode AND not colorDesignation

Patterns:
- Regular Shapes:
  - Base: `{shape.label}`
  - Custom: `Customized {shape.label} +$15`
- Wood Shapes:
  - Base: `{shape.label}` (retains original labels: 3-Wood, 5-Wood, etc.)
  - Custom: Single variant `Customized Fairway +$15`
  - Note: For customs, all wood types consolidate to one 'Fairway' variant to avoid redundancy


### 3. Styled Collections (Non-ColorDesignation)
Applies when:
- Collection needs style AND
- Using independent style mode AND
- Not colordesignation

Patterns:
- Regular Shapes:
  - Base Pattern: `{shape.label} - {selectedStyle.label}`
  - Custom Pattern: `Customized {shape.label} - {selectedStyle.label} +$15`
- Wood Shapes:
  - Base Pattern: `{shape.label} - {selectedStyle.label}` (retains original labels)
  - Custom Pattern: `Customized Fairway - {selectedStyle.label} +$15`
  - Note: For customs, all wood types use 'Fairway' to allow customer freedom in wood selection


### 4. ColorDesignation Collections

#### Database Pattern System
ColorDesignation collections use a database-driven naming system with these patterns:
```prisma
enum StyleNamePattern {
  STANDARD        // Custom names use style + leather phrase + designated color (see createCustom.js)
  STYLE_FIRST     // "{style.label} with {leather.label} {style.leatherPhrase}"
  CUSTOM          // Uses customNamePattern field
}
```

Available template variables:
- `{style.label}` - Style name
- `{style.leatherPhrase}` - Style's leather phrase (e.g. "leather as", "is", "leather on left")
- `{leather.label}` - Leather color name
- `{shape.label}` - Shape name (replaced with "Fairway" for wood customs)

#### A. Global Style Mode
Applies when:
- Collection needs style AND
- Using global style mode AND
- ColorDesignation enabled

Regular Shapes:
- Base Pattern: `{shape.label}`
- Custom Pattern:
  - STANDARD: `Customized {shape.label} - {style.label} {style.leatherPhrase} {designated leather label} +$15` (e.g. `Customized Driver - Fat Middle is Black +$15`)
  - STYLE_FIRST: `Customized {shape.label} - {style.label} with {leather.label} {style.leatherPhrase} +$15`
  - CUSTOM: Customized version of customNamePattern

Wood Shapes:
- Base: Same as Regular Shapes with original shape labels
- Custom: Same patterns but replaces shape.label with "Fairway"

#### B. Independent Style Mode
Applies when:
- Collection needs style AND
- Using independent style mode AND
- ColorDesignation enabled on the collection level or by 2 fairways having the same style.  

Uses identical patterns to Global Style Mode, following the same StyleNamePattern system.

## Special Cases

### Custom Variant Rules
1. Always prefixed with "Customized" (legacy Shopify rows may still show "Customize"; the update flow normalizes to "Customized".)
2. Always suffixed with "+$15"
3. Wood shapes always use "Fairway" in custom variants
4. Maintains consistent pattern structure with base variants

## ColorDesignation Pattern Examples

### Standard Pattern Example
```typescript
{
  name: "Fat Middle",
  namePattern: "STANDARD",
  leatherPhrase: "is",
  // Base: "Driver"
  // Custom: "Customized Driver - Fat Middle is Black +$15"
}
```

### Style-First Pattern Example
```typescript
{
  name: "50/50",
  namePattern: "STYLE_FIRST",
  leatherPhrase: "leather on left",
  // Base: "Driver"
  // Custom: "Customized Driver - 50/50 with Black leather on left +$15"
}
```

### Custom Pattern Example
```typescript
{
  name: "Special",
  namePattern: "CUSTOM",
  customNamePattern: "{shape.label} in {style.label} with {leather.label}",
  // Base: "Driver in Special with Black"
  // Custom: "Customized Driver in Special with Black +$15"
}
```