// app/components/ShapeSelector/ShapeGrid.jsx

import React, { useMemo } from 'react';
import { BlockStack, Box, Divider } from "@shopify/polaris";
import ShapeRow from './ShapeRow';
import ShapeGridHeader from './ShapeGridHeader';

const sortShapes = (shapes) => {
  if (!shapes?.length) return [];
  return [...shapes].sort((a, b) => {
    if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
      return a.displayOrder - b.displayOrder;
    }
    return a.name.localeCompare(b.name);
  });
};

const ShapeGrid = ({
  shapes,
  embroideryThreadColors,
  formState,
  handleChange
}) => {
  // Sort shapes
  const sortedShapes = useMemo(() => 
    sortShapes(shapes),
    [shapes]
  );

  // Calculate visibility flags for all shapes at once
  const visibilityFlags = useMemo(() => {
    const { collection, styleMode, threadMode, globalStyle } = formState;
    
    // Create a map of shape IDs to their visibility flags
    return sortedShapes.reduce((acc, shape) => {
      const isNotPutter = shape.shapeType !== 'PUTTER';
      const isSelected = formState.selectedShapes?.[shape.value]?.weight !== undefined;

      acc[shape.value] = {
        isSelected,
        showStyleFields: isSelected && collection.needsStyle && isNotPutter && styleMode === 'independent',
        showEmbroideryFields: isSelected && collection.needsStyle && isNotPutter && threadMode.embroidery === 'perShape',
        showColorDesignation: isSelected && isNotPutter && (
          styleMode === 'global'
            ? globalStyle?.requirements.needsColorDesignation
            : collection.needsColorDesignation
        )
      };
      return acc;
    }, {});
  }, [formState, sortedShapes]);

  // Determine which columns to show in the header
  const headerVisibility = useMemo(() => {
    const anyShape = Object.values(visibilityFlags)[0] || {};
    return {
      showStyleFields: anyShape.showStyleFields,
      showEmbroideryFields: anyShape.showEmbroideryFields,
      showColorDesignation: anyShape.showColorDesignation
    };
  }, [visibilityFlags]);

  if (!sortedShapes.length) {
    return null;
  }

  return (
    <BlockStack gap="400">
      <ShapeGridHeader {...headerVisibility} />
      
      {sortedShapes.map((shape, index) => (
        <Box key={shape.value} paddingBlockEnd="400">
          <ShapeRow 
            shape={shape}
            embroideryThreadColors={embroideryThreadColors}
            formState={formState}
            handleChange={handleChange}
            {...visibilityFlags[shape.value]}
          />
          {index < sortedShapes.length - 1 && <Divider />}
        </Box>
      ))}
    </BlockStack>
  );
};

export default React.memo(ShapeGrid);