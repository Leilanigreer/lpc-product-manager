// app/components/ShapeSelector/ShapeGrid.jsx

import React, { useMemo } from 'react';
import { BlockStack, Box, Divider } from "@shopify/polaris";
import {
  isPutter,
  getShapeGroup,
  styleCategoryMatchesShapeGroup,
  getVariantViewLabels,
} from '../../lib/utils';
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
  formState,
  handleChange,
  lockedShapeValues,
  pendingVariantImages,
  onSetPendingImage,
}) => {
  const sortedShapes = useMemo(() =>
    sortShapes(shapes),
    [shapes]
  );

  const visibilityFlags = useMemo(() => {
    const { collection, allShapes } = formState;
    const collectionStyles = collection?.styles ?? [];

    return sortedShapes.reduce((acc, shape) => {
      const shapeState = allShapes[shape.value];
      const isSelected = shapeState?.isSelected;
      const isPutterShape = isPutter(shape);

      const group = getShapeGroup(shape);
      const matchingStyleCount =
        group == null
          ? null
          : collectionStyles.filter((s) =>
              styleCategoryMatchesShapeGroup(s.shapeGroup, group)
            ).length;

      const needsStyleForThisShape =
        matchingStyleCount == null
          ? Boolean(collection?.needsStyle && !isPutterShape)
          : matchingStyleCount > 1;

      const hasViewLabels = getVariantViewLabels(shape).length > 0;

      acc[shape.value] = {
        isSelected,
        showStyleFields: isSelected && needsStyleForThisShape,
        showColorDesignation: isSelected && shapeState?.needsColorDesignation,
        showImages: isSelected && hasViewLabels,
        isPutterShape,
      };
      return acc;
    }, {});
  }, [formState, sortedShapes]);

  const gridColumns = useMemo(() => {
    const anyShapeHas = {
      images: Object.values(visibilityFlags).some(flags => flags.showImages),
      style: Object.values(visibilityFlags).some(flags => flags.showStyleFields),
      colorDesignation: Object.values(visibilityFlags).some(flags => flags.showColorDesignation)
    };

    const columns = [
      { id: 'shape', width: COLUMN_WIDTHS.shapeColumn }
    ];

    if (anyShapeHas.images) {
      columns.push({ id: 'images', width: COLUMN_WIDTHS.imagesColumn });
    }
    if (anyShapeHas.style) {
      columns.push({ id: 'style', width: COLUMN_WIDTHS.styleColumn });
    }
    if (anyShapeHas.colorDesignation) {
      columns.push({ id: 'colorDesignation', width: COLUMN_WIDTHS.colorDesignationColumn });
    }

    return columns;
  }, [visibilityFlags]);

  const headerText = 'Named Leather';

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
              formState={formState}
              handleChange={handleChange}
              lockedShapeValues={lockedShapeValues}
              gridColumns={gridColumns}
              pendingVariantImages={pendingVariantImages}
              onSetPendingImage={onSetPendingImage}
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
