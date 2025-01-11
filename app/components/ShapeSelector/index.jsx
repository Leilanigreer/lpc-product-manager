// app/components/ShapeSelector/index.jsx

import React, { useMemo } from 'react';
import { Card, BlockStack, Text } from "@shopify/polaris";
import ShapeGrid from './ShapeGrid';
import { preventWheelChange } from './styles';

/**
 * @typedef {Object} Shape
 * @property {string} value - Shape identifier
 * @property {string} label - Display name
 * @property {string} abbreviation - Short code
 * @property {string} shapeType - Shape type (PUTTER, WOOD, OTHER)
 */

/**
 * Shape configuration component managing shape selection and properties
 * Handles layout based on collection requirements and shape types
 * @param {Object} props
 * @param {Shape[]} props.shapes - Available shapes to select from
 * @param {Array} props.embroideryThreadColors - Available thread colors
 * @param {Object} props.formState - Current form state
 * @param {Function} props.handleChange - Form state update callback
 * @returns {React.ReactElement} Rendered shape selector
 */
const ShapeSelector = ({ 
  shapes,
  embroideryThreadColors,
  formState, 
  handleChange
}) => {
  // Memoize props for ShapeGrid to prevent unnecessary re-renders
  const gridProps = useMemo(() => ({
    shapes,
    embroideryThreadColors,
    formState,
    handleChange
  }), [shapes, embroideryThreadColors, formState, handleChange]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Shape Configuration</Text>
        <style>{preventWheelChange}</style>
        <ShapeGrid {...gridProps} />
      </BlockStack>
    </Card>
  );
};

export default React.memo(ShapeSelector);