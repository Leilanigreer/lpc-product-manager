// app/components/ShapeSelector/ShapeGrid.jsx

import React, { useMemo } from 'react';
import { BlockStack, Box, Divider, DropZone } from "@shopify/polaris";
import { isPutter } from '../../lib/utils';
import ShapeRow from './ShapeRow';
import ShapeGridHeader from './ShapeGridHeader';
import { COLUMN_WIDTHS } from './constants';
import ErrorBoundary from '../ErrorBoundary';

const sortShapes = (shapes) => {
  if (!shapes?.length) return [];
  return [...shapes].sort((a, b) => {
    if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
      return a.displayOrder - b.displayOrder;
    }
    return a.label.localeCompare(b.label);
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
    const { collection, styleMode, threadMode, allShapes } = formState;
    
    return sortedShapes.reduce((acc, shape) => {
      const shapeState = allShapes[shape.value];
      const isSelected = shapeState?.isSelected;
      const isPutterShape = isPutter(shape);
  
      acc[shape.value] = {
        isSelected,
        showStyleFields: isSelected && collection.needsStyle && !isPutterShape && styleMode === 'independent',
        showEmbroideryFields: isSelected && collection.needsStyle && !isPutterShape && threadMode.embroidery === 'perShape',
        showColorDesignation: isSelected && shapeState?.needsColorDesignation,
        isPutterShape
      };
      return acc;
    }, {});
  }, [formState, sortedShapes]);

  // Determine which columns to show
  const gridColumns = useMemo(() => {
    const anyShapeHas = {
      style: Object.values(visibilityFlags).some(flags => flags.showStyleFields),
      embroidery: Object.values(visibilityFlags).some(flags => flags.showEmbroideryFields),
      colorDesignation: Object.values(visibilityFlags).some(flags => flags.showColorDesignation)
    };

    const columns = [
      { id: 'shape', width: COLUMN_WIDTHS.shapeColumn }
    ];
    
    if (anyShapeHas.style) {
      columns.push({ id: 'style', width: COLUMN_WIDTHS.styleColumn });
    }
    if (anyShapeHas.embroidery) {
      columns.push({ id: 'embroidery', width: COLUMN_WIDTHS.embroideryColumn });
    }
    if (anyShapeHas.colorDesignation) {
      columns.push({ id: 'colorDesignation', width: COLUMN_WIDTHS.colorDesignationColumn });
    }

    return columns;
  }, [visibilityFlags]);

  // Header text for color designation column
  const headerText = formState.collection?.label?.toLowerCase().includes('quilted')
    ? 'Quilted Leather'
    : 'Named Leather';

  if (!sortedShapes.length) {
    return null;
  }

  return (
    <BlockStack gap="400">
      <ErrorBoundary errorMessage="Error loading shape configuration">
        <ShapeGridHeader 
          gridColumns={gridColumns}
          headerText={headerText}
        />
        
        {sortedShapes.map((shape, index) => (
          <Box key={shape.value} paddingBlockEnd="400">
            <ShapeRow 
              shape={shape}
              shapes={shapes}
              embroideryThreadColors={embroideryThreadColors}
              formState={formState}
              handleChange={handleChange}
              gridColumns={gridColumns}
              {...visibilityFlags[shape.value]}
            />
            {index < sortedShapes.length - 1 && <Divider />}
          </Box>
        ))}
      </ErrorBoundary>
    </BlockStack>
  );
};

export default React.memo(ShapeGrid);