// app/components/ShapeSelector/ShapeRow.jsx
import React, { useMemo } from 'react';
import { InlineStack, BlockStack, Box } from "@shopify/polaris";
import ShapeSelection from './fields/ShapeSelection';
import StyleField from './fields/StyleField';
import ColorDesignation from './fields/ColorDesignation';
import LeatherPhrase from './fields/LeatherPhrase';
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
  isPutterGrid,
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
      case 'leatherPhrase':
        /** Reserved width even when this shape has no phrase, so Named Leather stays anchored. */
        return showColorDesignation ? (
          <Box key={key} width={column.width}>
            <ErrorBoundary errorMessage={`Failed to load leather phrase for ${shape.label}`}>
              <LeatherPhrase {...fieldProps} />
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
   * Putter rows are extra wide because they carry three image dropzones. To make better use of
   * the vertical space the image dropzones occupy, putter rows render Style / Phrase /
   * Named Leather as a vertical stack to the right of the Images column instead of as
   * additional horizontal columns. Drivers/Woods/Hybrids keep the single-row column layout
   * since they only have two image dropzones and comfortably fit Style + Named Leather alongside.
   */
  const useStackedDetailsLayout =
    Boolean(isPutterGrid) &&
    Boolean(isPutterShape) &&
    showImages &&
    (showStyleFields || showColorDesignation);

  if (useStackedDetailsLayout) {
    const shapeColumn = gridColumns.find((c) => c.id === 'shape');
    const imagesColumn = gridColumns.find((c) => c.id === 'images');

    return (
      <ErrorBoundary errorMessage={`Error in shape row: ${shape.label}`}>
        <InlineStack wrap={false} gap="400" align="start">
          {shapeColumn && renderColumn(shapeColumn)}
          {imagesColumn && renderColumn(imagesColumn)}
          <Box width={COLUMN_WIDTHS.styleColumn}>
            <BlockStack gap="200">
              {showStyleFields && (
                <ErrorBoundary errorMessage={`Failed to load style options for ${shape.label}`}>
                  <StyleField {...fieldProps} />
                </ErrorBoundary>
              )}
              {showColorDesignation && (
                <ErrorBoundary errorMessage={`Failed to load leather phrase for ${shape.label}`}>
                  <LeatherPhrase {...fieldProps} />
                </ErrorBoundary>
              )}
              {showColorDesignation && (
                <ErrorBoundary errorMessage={`Failed to load leather options for ${shape.label}`}>
                  <ColorDesignation {...fieldProps} />
                </ErrorBoundary>
              )}
            </BlockStack>
          </Box>
        </InlineStack>
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
