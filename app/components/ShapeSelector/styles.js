// app/components/ShapeSelector/styles.js

/**
 * CSS to prevent unwanted wheel behavior on number inputs
 * Shared across shape selector components
 */
export const preventWheelChange = `
  input[type="number"] {
    -moz-appearance: textfield !important;
  }
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none !important;
    margin: 0 !important;
    display: none !important;
  }
  
  input[type="number"] {
    scroll-behavior: auto !important;
    overflow: hidden !important;
  }
`;