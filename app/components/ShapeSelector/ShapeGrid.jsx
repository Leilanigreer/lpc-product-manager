// app/components/ShapeSelector/ShapeGrid.jsx

import React, { useMemo } from 'react';
import { BlockStack, Box, Divider } from "@shopify/polaris";
import ShapeRow from './ShapeRow';
import { ShapeGridHeader } from './ShapeGridHeader';

/**
 * Sort shapes by display order or name
 * @param {Array} shapes - Available shapes 
 * @returns {Array} Sorted shapes
 */
const sortShapes = (shapes) => {
  if (!shapes?.length) return [];

  return [...shapes].sort((a, b) => {
    if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
      return a.displayOrder - b.displayOrder;
    }
    return a.name.localeCompare(b.name);
  });
};

/**
 * Grid component for shape selection and configuration
 * Handles layout and coordinates visualization between header and rows
 * based on collection requirements:
 * - Basic: Just shape and weight (needsStyle = false)
 * - Standard: Shape, style, embroidery, weight (needsStyle = true)
 * - Full: Shape, style, embroidery, Q-classic, weight (needsStyle = true & needsQClassicField = true)
 */
const ShapeGrid = ({
  shapes,
  styles,
  leatherColors,
  embroideryThreadColors,
  formState,
  handleChange
}) => {
  // Get collection requirements 
  const { needsStyle, needsQClassicField } = formState.collection || {};

  // Sort shapes while maintaining all types
  const sortedShapes = useMemo(() => 
    sortShapes(shapes),
    [shapes]
  );

  // Memoize common row props
  const rowProps = useMemo(() => ({
    styles,
    leatherColors,
    embroideryThreadColors,
    formState,
    handleChange,
    needsStyle,
    needsQClassicField
  }), [
    styles, 
    leatherColors, 
    embroideryThreadColors, 
    formState, 
    handleChange, 
    needsStyle,
    needsQClassicField
  ]);

  if (!sortedShapes.length) {
    return null;
  }

  return (
    <BlockStack gap="400">
      <ShapeGridHeader 
        needsStyle={needsStyle}
        needsQClassicField={needsQClassicField}
      />
      
      {sortedShapes.map((shape, index) => (
        <Box key={shape.id} paddingBlockEnd="400">
          <ShapeRow 
            shape={shape}
            {...rowProps}
          />
          {index < sortedShapes.length - 1 && <Divider />}
        </Box>
      ))}
    </BlockStack>
  );
};

export default React.memo(ShapeGrid);