// app/components/ShapeSelector/index.jsx

import React, { useMemo } from 'react';
import { Card, BlockStack, Text } from "@shopify/polaris";
import ShapeGrid from './ShapeGrid';
import { preventWheelChange } from '../../../styles/shared/inputs';
import ErrorBoundary from '../ErrorBoundary';

/**
 * Shape configuration component managing shape selection and properties
 * Handles shape selection, weight input, and additional fields based on 
 * collection requirements and shape types.
 * 
 * @param {Object} props
 * @param {Array<Object>} props.shapes - Available shapes
 *   @param {string} props.shapes[].value - Shape identifier
 *   @param {string} props.shapes[].label - Display name
 *   @param {string} props.shapes[].abbreviation - Shape code
 *   @param {string} props.shapes[].shapeType - WOOD, PUTTER, or OTHER
 *   @param {number} [props.shapes[].displayOrder] - Optional display order
 * @param {Array<Object>} props.embroideryThreadColors - Available thread colors and their numbers
 * @param {Object} props.formState - Current form state containing allShapes and configurations
 * @param {Function} props.handleChange - Form state update callback
 */
const ShapeSelector = ({ 
  shapes,
  embroideryThreadColors,
  formState, 
  handleChange
}) => {
  // Memoize props for ShapeGrid
  const gridProps = useMemo(() => ({
    shapes,
    embroideryThreadColors,
    formState,
    handleChange
  }), [shapes, embroideryThreadColors, formState, handleChange]);

  return (
    <ErrorBoundary errorMessage="Error in shape configuration">
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Shape Configuration</Text>
          <style>{preventWheelChange}</style>
          <ShapeGrid {...gridProps} />
        </BlockStack>
      </Card>
    </ErrorBoundary>
  );
};

export default React.memo(ShapeSelector);