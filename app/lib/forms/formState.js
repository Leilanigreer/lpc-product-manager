//app/lib/forms/formState.js

export const initialFormState = {
  // Required Base Fields
  collection: {
    id: "",
    title: "",
    handle: "",
    skuPrefix: "",
    threadType: "NONE", // NONE | EMBROIDERY | STITCHING
    description: "",
    commonDescription: true,
    needsSecondaryLeather: false,
    needsStitchingColor: false,
    needsQClassicField: false,
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
      id: "",
      name: "",
      abbreviation: "",
      image_url: "",
      colorTags: []
    },
    // Optional: Only used when collection.needsSecondaryLeather or style override requires it
    secondary: null
  },

  // Style Configuration
  styleMode: 'global', // 'global' | 'independent'
  globalStyle: null, // Only used when styleMode is 'global'
  selectedStyles: {}, // Only used when styleMode is 'independent'

  // Thread Configuration
  threadMode: {
    embroidery: 'global', // 'global' | 'perShape'
  },
  
  // Thread Selections (based on collection.threadType)
  stitchingThreads: {}, // Can be multiple unless collection.threadType === 'STITCHING'
  globalEmbroideryThread: null, // Used when threadMode.embroidery === 'global'
  shapeEmbroideryThreads: {}, // Used when threadMode.embroidery === 'perShape'

  // Shape Configuration
  weights: {}, // Required for selected shapes

  // Optional Configurations
  qClassicLeathers: {} // Only used when collection.needsQClassicField is true
};