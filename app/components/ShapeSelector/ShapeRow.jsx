// app/components/ShapeSelector/ShapeRow.jsx
import React, { useMemo } from 'react';
import { InlineStack, BlockStack, Box } from "@shopify/polaris";
import ShapeSelection from './fields/ShapeSelection';
import StyleField from './fields/StyleField';
import ColorDesignation from './fields/ColorDesignation';
import ShapeImageCapture from './fields/ShapeImageCapture';
import ErrorBoundary from '../ErrorBoundary';
import { COLUMN_WIDTHS } from './constants';

const ShapeRow = ({
  gridColumns,
  shape,
  shapes,
  formState,
  handleChange,
  showStyleFields,
  showColorDesignation,
  showImages,
  isPutterShape,
  lockedShapeValues,
  pendingVariantImages,
  onSetPendingImage,
}) => {
  const fieldProps = useMemo(() => ({
    shape,
    shapes,
    formState,
    handleChange,
    isLocked: Boolean(lockedShapeValues?.has(shape.value)),
  }), [shape, shapes, formState, handleChange, lockedShapeValues]);

  const renderColumn = (column) => {
    const key = `${shape.value}-${column.id}`;
    switch(column.id) {
      case 'shape':
        return (
          <Box key={key} width={column.width}>
            <ErrorBoundary errorMessage="Failed to load shape selection">
              <ShapeSelection {...fieldProps} />
            </ErrorBoundary>
          </Box>
        );
      case 'images':
        return showImages ? (
          <Box key={key} width={column.width}>
            <ErrorBoundary errorMessage={`Failed to load image capture for ${shape.label}`}>
              <ShapeImageCapture
                shape={shape}
                formState={formState}
                pendingVariantImages={pendingVariantImages}
                onSetPendingImage={onSetPendingImage}
              />
            </ErrorBoundary>
          </Box>
        ) : <Box key={key} width={column.width} />;
      case 'style':
        return showStyleFields ? (
          <Box key={key} width={column.width}>
            <ErrorBoundary errorMessage={`Failed to load style options for ${shape.label}`}>
              <StyleField {...fieldProps} />
            </ErrorBoundary>
          </Box>
        ) : <Box key={key} width={column.width} />;
      case 'colorDesignation':
        return showColorDesignation ? (
          <Box key={key} width={column.width}>
            <ErrorBoundary errorMessage={`Failed to load leather options for ${shape.label}`}>
              <ColorDesignation {...fieldProps} />
            </ErrorBoundary>
          </Box>
        ) : <Box key={key} width={column.width} />;
      default:
        return null;
    }
  };

  /**
   * Putter rows are extra wide because they carry three image dropzones. To avoid a single very
   * long row that wraps awkwardly, putters use a two-row layout when there is also style and/or
   * named-leather content to show: Shape + Images on top, Style + Named Leather indented under
   * the Images column on the second row. Drivers/Woods/Hybrids stay on a single row since they
   * only have two image dropzones and comfortably fit alongside Style + Named Leather.
   */
  const useTwoRowLayout =
    Boolean(isPutterShape) &&
    showImages &&
    (showStyleFields || showColorDesignation);

  if (useTwoRowLayout) {
    const topColumns = gridColumns.filter(
      (c) => c.id === 'shape' || c.id === 'images'
    );
    const bottomColumns = gridColumns.filter(
      (c) => c.id === 'style' || c.id === 'colorDesignation'
    );

    return (
      <ErrorBoundary errorMessage={`Error in shape row: ${shape.label}`}>
        <BlockStack gap="300">
          <InlineStack wrap={false} gap="400" align="start">
            {topColumns.map(renderColumn)}
          </InlineStack>
          {bottomColumns.length > 0 && (
            <InlineStack wrap={false} gap="400" align="start">
              {/* Spacer under Shape column so Style/Named Leather start aligned with Images. */}
              <Box width={COLUMN_WIDTHS.shapeColumn} />
              {bottomColumns.map(renderColumn)}
            </InlineStack>
          )}
        </BlockStack>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary errorMessage={`Error in shape row: ${shape.label}`}>
      <InlineStack wrap={false} gap="400" align="start">
        {gridColumns.map(renderColumn)}
      </InlineStack>
    </ErrorBoundary>
  );
};

export default React.memo(ShapeRow);
