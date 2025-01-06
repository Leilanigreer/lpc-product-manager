// app/components/ShapeSelector/index.jsx

import React, { useMemo } from 'react';
import { Card, BlockStack, Text } from "@shopify/polaris";
import ShapeGrid from './ShapeGrid';
import { preventWheelChange } from './styles';

/**
 * @typedef {Object} Shape
 * @property {string} id - Shape identifier
 * @property {string} name - Display name
 * @property {string} abbreviation - Short code
 * @property {boolean} [isPutter] - Whether shape is a putter type
 */

/**
 * @typedef {Object} Style
 * @property {string} id - Style identifier
 * @property {string} name - Style name
 * @property {string} abbreviation - Style code
 * @property {string} [image_url] - Optional style image
 * @property {Object} overrides - Style-specific overrides
 */

/**
 * Shape configuration component managing shape selection and properties
 * @param {Object} props
 * @param {Shape[]} props.shapes - Available shapes to select from
 * @param {Style[]} props.styles - Available styles if needed
 * @param {Array} props.leatherColors - Available leather colors for Q-Classic
 * @param {Array} props.embroideryThreadColors - Available thread colors
 * @param {Object} props.formState - Current form state
 * @param {Function} props.handleChange - Form state update callback
 * @returns {React.ReactElement} Rendered shape selector
 */
const ShapeSelector = ({ 
  shapes, 
  styles, 
  leatherColors,
  embroideryThreadColors,
  formState, 
  handleChange
}) => {
  // Memoize props for ShapeGrid to prevent unnecessary re-renders
  const memoizedProps = useMemo(() => ({
    shapes,
    styles,
    leatherColors,
    embroideryThreadColors,
    formState,
    handleChange
  }), [shapes, styles, leatherColors, embroideryThreadColors, formState, handleChange]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Shape Configuration</Text>
        <style>{preventWheelChange}</style>
        <ShapeGrid {...memoizedProps} />
      </BlockStack>
    </Card>
  );
};

export default React.memo(ShapeSelector);