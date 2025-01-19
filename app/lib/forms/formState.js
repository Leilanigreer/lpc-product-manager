//app/lib/forms/formState.js

export const createInitialShapeState = (shape) => ({
  // Base properties from shape
  value: shape.value,
  label: shape.label,
  abbreviation: shape.abbreviation,
  shapeType: shape.shapeType,
  
  // Selection state
  isSelected: false,
  
  // Requirement flags
  needsColorDesignation: false,
  
  // Input values
  weight: '',
  style: null,
  embroideryThread: null,
  colorDesignation: null,
});

export const initialFormState = {
  // Required Base Fields
  collection: {
    value: "",
    label: "",
    handle: "",
    skuPrefix: "",
    threadType: "NONE", // NONE | EMBROIDERY | STITCHING
    description: "",
    commonDescription: true,
    needsSecondaryLeather: false,
    needsStitchingColor: false,
    needsColorDesignation: false,
    needsStyle: false,
    showInDropdown: true,
    admin_graphql_api_id: ""
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
      colorTags: []
    },
    // Optional: Only used when collection.needsSecondaryLeather or style override requires it
    secondary: null
  },

  // Style Configuration
  styleMode: 'independent', // 'global' | 'independent'
  globalStyle: null, // Only used when styleMode is 'global'
  
  // Thread Configuration
  threadMode: {
    embroidery: "", // 'global' | 'perShape'
  },
  
  // Thread Selections (based on collection.threadType)
  stitchingThreads: {}, // Can be multiple unless collection.threadType === 'STITCHING'
  globalEmbroideryThread: null, // Used when threadMode.embroidery === 'global'

  finalRequirements: {
    needsSecondaryLeather: false,
    needsStitchingColor: false,
    needsColorDesignation: false,
    titleTemplate: null,
    seoTemplate: null,
    handleTemplate: null,
    validation: null,
    namePattern: null,
    skuPattern: null
  },
  
  // Shape Configuration
  allShapes: {}, // Holds complete state for ALL shapes
};