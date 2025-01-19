// app/components/ShapeSelector/ShapeRow.jsx
import React, { useMemo } from 'react';
import { InlineStack, Box } from "@shopify/polaris";
import ShapeSelection from './fields/ShapeSelection';
import StyleField from './fields/StyleField';
import EmbroideryField from './fields/EmbroideryField';
import ColorDesignation from './fields/ColorDesignation';
import ErrorBoundary from '../ErrorBoundary';

const ShapeRow = ({
  gridColumns,
  shape,
  shapes,
  embroideryThreadColors,
  formState,
  handleChange,
  showStyleFields,
  showEmbroideryFields,
  showColorDesignation
}) => {
  const fieldProps = useMemo(() => ({
    shape,
    shapes,
    formState,
    handleChange
  }), [shape, shapes, formState, handleChange]);

  const embroideryFieldProps = useMemo(() => ({
    ...fieldProps,
    embroideryThreadColors,
  }), [fieldProps, embroideryThreadColors]);

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
            case 'style':
              return showStyleFields ? (
                <Box key={key} width={column.width}>
                  <ErrorBoundary errorMessage={`Failed to load style options for ${shape.label}`}>
                    <StyleField {...fieldProps} />
                  </ErrorBoundary>  
                </Box>
              ) : <Box key={key} width={column.width} />;
            case 'embroidery':
              return showEmbroideryFields ? (
                <Box key={key} width={column.width}>
                  <ErrorBoundary errorMessage={`Failed to load embroidery options for ${shape.label}`}>
                    <EmbroideryField {...embroideryFieldProps} />
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