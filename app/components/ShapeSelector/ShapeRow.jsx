// app/components/ShapeSelector/ShapeRow.jsx
import React, { useMemo } from 'react';
import { InlineStack, Box } from "@shopify/polaris";
import ShapeSelection from './fields/ShapeSelection';
import StyleField from './fields/StyleField';
import ColorDesignation from './fields/ColorDesignation';
import ShapeImageCapture from './fields/ShapeImageCapture';
import ErrorBoundary from '../ErrorBoundary';

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

  return (
    <ErrorBoundary errorMessage={`Error in shape row: ${shape.label}`}>
      <InlineStack wrap={false} gap="400" align="start">
        {gridColumns.map(column => {
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
        })}
      </InlineStack>
    </ErrorBoundary>
  );
};

export default React.memo(ShapeRow);
