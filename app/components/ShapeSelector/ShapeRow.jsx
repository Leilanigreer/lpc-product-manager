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
   * Every shape with images + style/leather renders Style / Phrase / Named Leather as a vertical
   * stack to the right of the Images column instead of as additional horizontal columns. Putter
   * rows benefit because three image dropzones make the row tall; DWH rows benefit because the
   * stack fits in less horizontal space than the equivalent four-column horizontal row.
   *
   * `paddingBlockEnd` is applied at the row wrapper so both the Images column and the stacked
   * Named Leather dropdown stay clear of the per-row `<Divider />` rendered by `ShapeGrid`.
   */
  const useStackedDetailsLayout =
    showImages && (showStyleFields || showColorDesignation);

  if (useStackedDetailsLayout) {
    const shapeColumn = gridColumns.find((c) => c.id === 'shape');
    const imagesColumn = gridColumns.find((c) => c.id === 'images');

    return (
      <ErrorBoundary errorMessage={`Error in shape row: ${shape.label}`}>
        <Box paddingBlockEnd="200">
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
        </Box>
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
