// app/styles/shared/inputs.js

/**
 * CSS to prevent unwanted wheel behavior on number inputs
 * Can be imported and used across any component that needs it
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

/**
 * Apply this class to any parent element that contains number inputs
 * where you want to prevent wheel scrolling
 */
export const preventWheelClass = {
  '& input[type="number"]': {
    mozAppearance: 'textfield',
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
      display: 'none'
    },
    scrollBehavior: 'auto',
    overflow: 'hidden'
  }
};