//app/lib/forms/formState.js

export const createInitialShapeState = (shape) => ({
  // Base properties from shape
  value: shape.value,
  label: shape.label,
  cardDisplayName: shape.cardDisplayName ?? shape.label,
  abbreviation: shape.abbreviation,
  shapeType: shape.shapeType,
  /** Shopify `shape_group` choice list; null when from Postgres or unset. */
  shapeGroup: shape.shapeGroup ?? null,
  sizingGuideGroup: shape.sizingGuideGroup ?? null,
  displayOrder: shape.displayOrder,
  isActive: shape.isActive,

  // Weight capture disabled in UI for now; generators use a placeholder for API/DB.
  // weight: '',

  // Selection state
  isSelected: false,

  // Requirement flags
  needsColorDesignation: false,

  // Input values
  // weight: '',
  style: null,
  embroideryThread: null,
  colorDesignation: null,
});

export const initialFormState = {
  // Required Base Fields
  collection: {
    value: "",
    label: "",
    threadType: "NONE", // NONE | EMBROIDERY | STITCHING
  },

  selectedFont: "",
  selectedOfferingType: "",
  limitedEditionQuantity: "",

  // Primary Leather (Always Required)
  leatherColors: {
    primary: {
      value: "",
      label: "",
      abbreviation: "",
      // image_url: "",
    },
    // Optional: Only used when collection.needsSecondaryLeather
    secondary: null
  },

  // Thread Selections (based on collection.threadType)
  stitchingThreads: {}, // Can be multiple unless collection.threadType === 'STITCHING'
  /** Product-level Isacord rows (keyed by Isacord metaobject GID). EMBROIDERY: at most one entry. */
  embroideryThreads: {},

  finalRequirements: {
    needsSecondaryLeather: false,
    titleTemplate: null,
    seoTemplate: null,
    handleTemplate: null,
    validation: null,
    namePattern: null,
    skuPattern: null
  },
  
  // Shape Configuration
  allShapes: {}, // Holds complete state for ALL shapes
  shapes: []
};