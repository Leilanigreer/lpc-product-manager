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

/**
 * When rows render Style / Phrase / Named Leather as a vertical stack inside each row (see
 * `ShapeRow.useStackedDetailsLayout`), the header drops those individual labels and instead shows
 * a single "Style Details" label above the stack. Only Shape and Images survive as their own
 * column headers.
 */
const STACKED_HEADER_COLUMN_IDS = new Set(['shape', 'images']);

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
    /** leatherPhrase + colorDesignation are paired: same visibility flag, never one without the other. */
    if (anyShapeHas.colorDesignation) {
      columns.push({ id: 'leatherPhrase', width: COLUMN_WIDTHS.leatherPhraseColumn });
      columns.push({ id: 'colorDesignation', width: COLUMN_WIDTHS.colorDesignationColumn });
    }

    return columns;
  }, [visibilityFlags]);

  const headerColumns = useMemo(() => {
    const hasStackedFields = gridColumns.some(
      (c) =>
        c.id === 'style' ||
        c.id === 'leatherPhrase' ||
        c.id === 'colorDesignation'
    );
    if (!hasStackedFields) return gridColumns;
    /** Replace style / leatherPhrase / colorDesignation column headers with a single
     *  "Style Details" label that sits above the stacked content rendered inside each row. */
    const base = gridColumns.filter((c) => STACKED_HEADER_COLUMN_IDS.has(c.id));
    base.push({ id: 'styleDetails', width: COLUMN_WIDTHS.styleColumn });
    return base;
  }, [gridColumns]);

  const headerText = 'Named Leather';

  if (!sortedShapes.length) {
    return null;
  }

  return (
    <BlockStack gap="400">
      <ErrorBoundary errorMessage="Error loading shape configuration">
        <ShapeGridHeader
          gridColumns={headerColumns}
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
