// app/components/ShapeSelector/index.jsx

import React, { useMemo } from 'react';
import { Card, BlockStack, Text, Divider } from "@shopify/polaris";
import ShapeGrid from './ShapeGrid';
import AdditionalViews from '../AdditionalViews';
import { preventWheelChange } from './styles';
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
  // Split shapes into putter and non-putter groups
  const { putterShapes, nonPutterShapes } = useMemo(() => {
    return shapes.reduce((acc, shape) => {
      if (shape.shapeType === 'PUTTER' || shape.shapeType === 'LAB_PUTTER') {
        acc.putterShapes.push(shape);
      } else {
        acc.nonPutterShapes.push(shape);
      }
      return acc;
    }, { putterShapes: [], nonPutterShapes: [] });
  }, [shapes]);

  // Memoize props for each grid
  const gridProps = useMemo(() => ({
    embroideryThreadColors,
    formState,
    handleChange
  }), [embroideryThreadColors, formState, handleChange]);

  return (
    <ErrorBoundary errorMessage="Error in shape configuration">
      <BlockStack gap="400">
        {/* Box 1: Non-Putter Shapes */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">Driver, Fairways & Hybrid</Text>
            <Divider borderColor="border-inverse" />
            <style>{preventWheelChange}</style>
            <ShapeGrid 
              {...gridProps} 
              shapes={nonPutterShapes}
            />
          </BlockStack>
        </Card>

        {/* Box 2: Putter Shapes */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">Putters</Text>
            <Divider borderColor="border-inverse" />
            <style>{preventWheelChange}</style>
            <ShapeGrid 
              {...gridProps} 
              shapes={putterShapes}
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </ErrorBoundary>
  );
};

export default React.memo(ShapeSelector);