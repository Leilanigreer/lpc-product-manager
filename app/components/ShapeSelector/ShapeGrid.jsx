// app/components/ShapeSelector/ShapeGrid.jsx

import React, { useMemo } from 'react';
import { BlockStack, Box, Divider } from "@shopify/polaris";
import {  } from '../../lib/utils/styleUtils';
import { getEffectiveRequirements, isPutter, isWoodType, findMatchingWoodStyles } from '../../lib/utils';
import ShapeRow from './ShapeRow';
import ShapeGridHeader from './ShapeGridHeader';
import { COLUMN_WIDTHS } from './constants';

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

  // Find matching wood styles 
  const matchingWoodStyles = useMemo(() => {
    return formState.styleMode === 'independent' 
      ? findMatchingWoodStyles(shapes, formState.selectedShapes)
      : {};
  }, [shapes, formState.selectedShapes, formState.styleMode]);

  // Calculate visibility flags for all shapes at once
  const visibilityFlags = useMemo(() => {
    const { collection, styleMode, threadMode, selectedShapes } = formState;
    const requirements = getEffectiveRequirements(formState);
    
    // Create a map of shape IDs to their visibility flags
    return sortedShapes.reduce((acc, shape) => {
      const isSelected = selectedShapes?.[shape.value]?.weight !== undefined;

      // Check if shape is part of a matching wood style group
      const isInMatchingWoodGroup = Object.values(matchingWoodStyles)
        .some(group => group.includes(shape.value));

      // Determine if color designation should be shown
      const showColorDesignation = isSelected && !isPutter(shape) && (
        // Show if in global mode and requirements indicate it
        (styleMode === 'global' && requirements.needsColorDesignation) ||
        // Show if in independent mode and collection requires it
        (styleMode === 'independent' && collection.needsColorDesignation) ||
        // Show if in independent mode, shape is wood type, and part of matching style group
        (styleMode === 'independent' && 
         isWoodType(shape) && 
         isInMatchingWoodGroup)
      );

      acc[shape.value] = {
        isSelected,
        showStyleFields: isSelected && collection.needsStyle && !isPutter(shape) && styleMode === 'independent',
        showEmbroideryFields: isSelected && collection.needsStyle && !isPutter(shape) && threadMode.embroidery === 'perShape',
        showColorDesignation
      };
      return acc;
    }, {});
  }, [formState, sortedShapes, matchingWoodStyles]);

  // Determine which columns to show in the header
  const headerVisibility = useMemo(() => {
    const anyShapeHasFields = {
      showStyleFields: Object.values(visibilityFlags).some(flags => flags.showStyleFields),
      showEmbroideryFields: Object.values(visibilityFlags).some(flags => flags.showEmbroideryFields),
      showColorDesignation: Object.values(visibilityFlags).some(flags => flags.showColorDesignation)
    };

    return {
      ...anyShapeHasFields,
      headerText: formState.collection?.label?.toLowerCase().includes('quilted')
        ? 'Quilted Leather'
        : 'Named Leather'
    };
  }, [visibilityFlags, formState.collection]);

  const gridColumns = useMemo(() => {
    const anyShape = Object.values(visibilityFlags).some(flags => flags.showStyleFields);
    const anyEmbroidery = Object.values(visibilityFlags).some(flags => flags.showEmbroideryFields);
    const anyColorDesignation = Object.values(visibilityFlags).some(flags => flags.showColorDesignation);

    // Determine active columns and their order
    const columns = [
      { id: 'shape', width: COLUMN_WIDTHS.shapeColumn, always: true },
    ];

    if (anyShape) {
      columns.push({ id: 'style', width: COLUMN_WIDTHS.styleColumn });
    }
    if (anyEmbroidery) {
      columns.push({ id: 'embroidery', width: COLUMN_WIDTHS.embroideryColumn });
    }
    if (anyColorDesignation) {
      columns.push({ id: 'colorDesignation', width: COLUMN_WIDTHS.colorDesignationColumn });
    }

    return columns;
  }, [visibilityFlags]);

  if (!sortedShapes.length) {
    return null;
  }

  return (
    <BlockStack gap="400">
      <ShapeGridHeader 
        {...headerVisibility} 
        gridColumns = { gridColumns }
      />
      
      {sortedShapes.map((shape, index) => (
        <Box key={shape.value} paddingBlockEnd="400">
          <ShapeRow 
            shape={shape}
            embroideryThreadColors={embroideryThreadColors}
            formState={formState}
            handleChange={handleChange}
            {...visibilityFlags[shape.value]}
            gridColumns = { gridColumns }
          />
          {index < sortedShapes.length - 1 && <Divider />}
        </Box>
      ))}
    </BlockStack>
  );
};

export default React.memo(ShapeGrid);