# Form State Documentation

## Overview
This document outlines the structure and usage of the form state in the LPC Product Management application. The form state manages all data required for product creation, including collection details, styles, threads, and shape-specific configurations.

## Base Structure
```javascript
export const initialFormState = {
  // Collection Information  
  collection: {
    // Basic Collection Info
    value: "",           // Collection ID
    shopifyId: "",       // Shopify's internal collection ID
    admin_graphql_api_id: "", // Shopify GraphQL API ID
    label: "",           // Display name of the collection
    handle: "",          // Shopify handle
    skuPattern: "",       // SKU pattern for base skumgeneration
    
    // Collection Type Configuration
    threadType: "NONE",  // NONE | EMBROIDERY | STITCHING
    description: "",     // Collection description
    commonDescription: true, // Whether to include common description
    defaultStyleNamePattern: "", // STANDARD | STYLE_FIRST | CUSTOM - applies to ColorDesignation only
    stylePerCollection: true,   // Whether styles vary per collection - review chat to confirm use
    
    // Feature Requirements
    needsSecondaryLeather: false,
    needsStitchingColor: false,
    needsColorDesignation: false,
    needsStyle: false,
    showInDropdown: true,
    
    // Styles Configuration
    styles: [
      {
        value: "",       // Style ID
        label: "",       // Style name
        abbreviation: "", // Style code
        url_id: "",      // URL identifier
        stylePerShape: true, // Whether style varies per shape
        useOppositeLeather: false, // For opposite leather color logic
        leatherPhrase: "", // Custom leather description phrase
        namePattern: "", // STANDARD | STYLE_FIRST | CUSTOM
        customNamePattern: "", // Custom naming template
        
        // Style-specific Overrides
        overrideSecondaryLeather: null,
        overrideStitchingColor: null,
        overrideColorDesignation: null,
        overrideNamePattern: null,  // Override collection default - STANDARD | STYLE_FIRST | CUSTOM
        overrideCustomNamePattern: null,  // Used with CUSTOM pattern
        
        // Style-specific Templates
        skuPattern: "",
        titleTemplate: "",
        seoTemplate: "",
        handleTemplate: "",
        validation: {} // JSON validation rules
      }
    ],
    
    // Collection-level Formatting
    titleFormat: {
      titleTemplate: "", // Product title format
      seoTemplate: "",   // SEO title format
      handleTemplate: "", // URL handle format
      validation: {}     // JSON validation rules
    },
    
    // Pricing Configuration
    priceTiers: [
      {
        value: "",              // PriceTier ID
        name: "",              // Name of the tier (e.g., "Classic Base")
        shopifyPrice: 0,       // Base Shopify price
        marketplacePrice: 0,   // Base marketplace price
        adjustments: [         // Price adjustments by shape type
          {
            shapeType: "",     // DRIVER, WOOD, HYBRID, PUTTER
            shopifyAdjustment: 0,
            marketAdjustment: 0,
            isBasePrice: false
          }
        ]
      }
    ]
  },

  existingProducts: [
    {
      baseSku: "",
      collecetion: {}
    },
    {
      baseSku: "",
      collecetion: {}
    }
  ]

  // Basic Product Information
  selectedOfferingType: "customizable", // 'customizable' | 'limitedEdition'
  limitedEditionQuantity: "",
    
  selectedFont: {
    value: "",
    label: "",
    url_id: ""
  },
  

  // Leather Colors
  leatherColors: {
    primary: {
      value: "",
      label: "",
      abbreviation: "",
      url_id: "",
      colorTags: [
        { value: "", label: "" }
      ]
    },
    secondary: {
      value: "",
      label: "",
      abbreviation: "",
      url_id: "",
      colorTags: [
        { value: "", label: "" }
      ]
    }
  },

  // Style Configuration
  styleMode: 'global', // 'global' | 'independent'
  globalStyle: {
    value: '',
    label: '',
    abbreviation: '',
    url_id: '',
    namePattern: '',
    customNamePattern: '',
    overrideSecondaryLeather: null,
    overrideStitchingColor: null,
    overrideColorDesignation: null,
    overrideNamePattern: null,
    overrideCustomNamePattern: null,
    titleTemplate: null,
    seoTemplate: null,
    handleTemplate: null,
    validation: null,
  },

  finalRequirements: { 
    needsSecondaryLeather: false,
    needsStitchingColor: false,
    needsColorDesignation: false,
    titleTemplate: null, 
    seoTemplate: null, 
    handleTemplate: null,
    validation: null,
    NamePattern: null,
    customNamePattern: null,
    overrideCustomNamePattern: null,
    useOppositeLeather: false,
    leatherPhrase: 'leather as'
  }

  // Thread Configuration
  threadMode: {
    embroidery: 'global', // 'global' | 'perShape'
  },

  // Global Embroidery Thread
  globalEmbroideryThread: {
    value: '',
    label: '',
    abbreviation: '',
    colorTags: [{ value: "", label: "" }],
    isacordNumbers: [{
      value: "",
      label: ""
    }]
  },
  
  // Stitching Threads
  stitchingThreads: {
    'thread-value': {
      value: '',
      label: '',
      abbreviation: '',
      colorTags: [{ value: "", label: "" }],
      amannNumbers: [{
        value: "",
        label: ""
      }]
    }
  },


  // Shape Configuration that contains all shapes in the beginning and we use isSelected to identify which we are using 
  allShapes: {
    'shape-value': {
      // Base shape data && basefields
      value: 'shape-value',
      label: 'Driver',
      displayOrder: 1,
      abbreviation: 'DR',
      shapeType: 'WOOD',
      isSelected: false
      weight: '5.2',
      needsColorDesignation: false, // should be default but updated based on finalRequirements.needsColorDesignation || other shape/style logic 


      // Only completed if in collection.needsStyle === true && styleMode.independent === true
      style: {
        value: '',
        label: '',
        abbreviation: '',
        useOppositeLeather: //Boolean,
        leatherPhrase: "",
        namePattern: "",
        customNamePattern: null,
      },

      // Only completed if in collection.needsStyle === true && threadMode.embroidery.perShape === true 
      embroideryThread: {
        value: '',
        label: '',
        abbreviation: '',
        colorTags: [{ value: "", label: "" }],
        isacordNumbers: [{
          value: "",
          label: ""
        }]
      },

      // Only completed if 'needsColorDesignation' within the shape data. 
      colorDesignation: {
        value: '',
        label: '',
        abbreviation: '',
        url_id: ''
      }
    }
  },
};

```

## Usage Guidelines

### Collection
- Collection data includes additional fields for style naming patterns and collection-level style configuration
- `defaultStyleNamePattern` determines the default naming convention for styles
- `stylePerCollection` indicates whether styles can vary between collections

### Styles
The style system now includes naming patterns and custom templates:
- `namePattern`: Determines how style names are formatted (STANDARD | STYLE_FIRST | CUSTOM)
- `customNamePattern`: Template for custom style naming
- `url_id`: URL-friendly identifier for styles
- Style overrides now include naming pattern overrides

### Variant Naming
The form state supports three naming patterns for variants:
1. STANDARD: "{leather.label} {style.leatherPhrase} {style.label}"
2. STYLE_FIRST: "{style.label} with {leather.label} {style.leatherPhrase}"
3. CUSTOM: Uses customNamePattern field

Available template variables:
- `{style.label}` - Style name
- `{style.leatherPhrase}` - Style's leather phrase
- `{leather.label}` - Leather color name
- `{shape.label}` - Shape name

### Thread Configuration
Thread handling now includes additional metadata:
- Stitching threads include Amann numbers
- Embroidery threads include Isacord numbers
- Both thread types include color tags for matching

### Color Tags
Color tags are now consistently structured across all color-related entities:
- Leather colors (primary and secondary)
- Thread colors (stitching and embroidery)
- Used for color matching and filtering features

## Data Flow Examples

### Setting Collection Style Pattern
```javascript
handleChange('collection', {
  ...collection,
  defaultStyleNamePattern: 'STANDARD',
  stylePerCollection: true
});
```

### Setting Style with Custom Pattern
```javascript
handleChange('globalStyle', {
  value: 'style-123',
  label: 'Three Stripe',
  abbreviation: '3S',
  namePattern: 'CUSTOM',
  customNamePattern: '{shape.label} in {style.label} with {leather.label}',
  overrides: {/*...*/}
});
```

### Setting Thread Colors with Numbers
```javascript
// Stitching thread with Amann number
handleChange('stitchingThreads', {
  'thread-123': {
    value: 'thread-123',
    label: 'Burgundy',
    abbreviation: 'BUR',
    colorTags: [{/*...*/}],
    amannNumbers: [{
      value: 'amann-456',
      label: '1234'
    }]
  }
});
```