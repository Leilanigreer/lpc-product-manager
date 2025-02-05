# Variant Naming Conventions

## Core Cases

### 1. Putter Shapes
Simplest case - no style variations
- Base Pattern: `{shape.label}`
- Custom Pattern: `Customize {shape.label} +$15`
- Note: Currently no style variations

### 2. Non-Styled Collections
Applies when:
- Collection doesn't need style (Quilted/Argyle) OR
- Collection needs style BUT using global style mode AND not colorDesignation

Patterns:
- Regular Shapes:
  - Base: `{shape.label}`
  - Custom: `Customize {shape.label} +$15`
- Wood Shapes:
  - Base: `{shape.label}` (retains original labels: 3-Wood, 5-Wood, etc.)
  - Custom: Single variant `Customize Fairway +$15`
  - Note: For customs, all wood types consolidate to one 'Fairway' variant to avoid redundancy


### 3. Styled Collections (Non-ColorDesignation)
Applies when:
- Collection needs style AND
- Using independent style mode AND
- Not colordesignation

Patterns:
- Regular Shapes:
  - Base Pattern: `{shape.label} - {selectedStyle.label}`
  - Custom Pattern: `Customize {shape.label} - {selectedStyle.label} +$15`
- Wood Shapes:
  - Base Pattern: `{shape.label} - {selectedStyle.label}` (retains original labels)
  - Custom Pattern: `Customize Fairway - {selectedStyle.label} +$15`
  - Note: For customs, all wood types use 'Fairway' to allow customer freedom in wood selection


### 4. ColorDesignation Collections

#### Database Pattern System
ColorDesignation collections use a database-driven naming system with these patterns:
```prisma
enum StyleNamePattern {
  STANDARD        // "{leather.label} {style.leatherPhrase} {style.label}"
  STYLE_FIRST     // "{style.label} with {leather.label} {style.leatherPhrase}"
  CUSTOM          // Uses customNamePattern field
}
```

Available template variables:
- `{style.label}` - Style name
- `{style.leatherPhrase}` - Style's leather phrase (e.g., "leather as", "leather on left")
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
  - STANDARD: `Customize {shape.label} - {leather.label} {style.leatherPhrase} {style.label} +$15`
  - STYLE_FIRST: `Customize {shape.label} - {style.label} with {leather.label} {style.leatherPhrase} +$15`
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

### Create Own Set Variant
Always appears as: `Create my own set`

### Custom Variant Rules
1. Always prefixed with "Customize"
2. Always suffixed with "+$15"
3. Wood shapes always use "Fairway" in custom variants
4. Maintains consistent pattern structure with base variants

## ColorDesignation Pattern Examples

### Standard Pattern Example
```typescript
{
  name: "Fat Middle",
  namePattern: "STANDARD",
  leatherPhrase: "leather as",
  // Base: "Driver"
  // Custom: "Customize Driver - Black leather as Fat Middle +$15"
}
```

### Style-First Pattern Example
```typescript
{
  name: "50/50",
  namePattern: "STYLE_FIRST",
  leatherPhrase: "leather on left",
  // Base: "Driver"
  // Custom: "Customize Driver - 50/50 with Black leather on left +$15"
}
```

### Custom Pattern Example
```typescript
{
  name: "Special",
  namePattern: "CUSTOM",
  customNamePattern: "{shape.label} in {style.label} with {leather.label}",
  // Base: "Driver in Special with Black"
  // Custom: "Customize Driver in Special with Black +$15"
}
```