// app/components/ShapeSelector/index.jsx

import React, { useMemo } from 'react';
import { Card, BlockStack, Text, Divider } from "@shopify/polaris";
import ShapeGrid from './ShapeGrid';
import { preventWheelChange } from './styles';
import ErrorBoundary from '../ErrorBoundary';
import { isPutter } from '../../lib/utils/shapeUtils';

/**
 * Shape configuration component managing shape selection and properties
 * Handles shape selection and additional fields based on
 * collection requirements and shape types.
 *
 * @param {Object} props
 * @param {Array<Object>} props.shapes - Available shapes
 * @param {Object} props.formState - Current form state containing allShapes and configurations
 * @param {Function} props.handleChange - Form state update callback
 */
const ShapeSelector = ({
  shapes,
  formState,
  handleChange
}) => {
  const visibleShapes = useMemo(
    () => shapes.filter((shape) => shape.isActive !== false),
    [shapes]
  );

  const { putterShapes, nonPutterShapes } = useMemo(() => {
    return visibleShapes.reduce((acc, shape) => {
      if (isPutter(shape)) {
        acc.putterShapes.push(shape);
      } else {
        acc.nonPutterShapes.push(shape);
      }
      return acc;
    }, { putterShapes: [], nonPutterShapes: [] });
  }, [visibleShapes]);

  const gridProps = useMemo(() => ({
    formState,
    handleChange
  }), [formState, handleChange]);

  return (
    <ErrorBoundary errorMessage="Error in shape configuration">
      <BlockStack gap="400">
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
