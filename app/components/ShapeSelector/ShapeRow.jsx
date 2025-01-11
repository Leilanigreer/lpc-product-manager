// app/components/ShapeSelector/ShapeRow.jsx
import React, { useMemo } from 'react';
import { InlineStack, Box } from "@shopify/polaris";
import ShapeSelection from './fields/ShapeSelection';
import StyleField from './fields/StyleField';
import EmbroideryField from './fields/EmbroideryField';
import QClassicField from './fields/QClassicField';
import ErrorBoundary from '../ErrorBoundary';

const ShapeRow = ({
  shape,
  embroideryThreadColors,
  formState,
  handleChange,
  showStyleFields,
  showEmbroideryFields,
  showQClassic
}) => {
  const fieldProps = useMemo(() => ({
    shape,
    formState,
    handleChange
  }), [shape, formState, handleChange]);

  const embroideryFieldProps = useMemo(() => ({
    ...fieldProps,
    embroideryThreadColors,
  }), [fieldProps, embroideryThreadColors]);

  return (
    <InlineStack wrap={false} gap="400" align="start">
      <Box width="250px">
        <ErrorBoundary errorMessage="Failed to load shape selection">
          <ShapeSelection 
            {...fieldProps} 
          />
        </ErrorBoundary>
      </Box>
  
      {showStyleFields && (
        <Box width="200px">
          <ErrorBoundary errorMessage={`Failed to load style options for ${shape.label}`}>
            <StyleField 
              {...fieldProps}
            />
          </ErrorBoundary>
        </Box>
      )}
  
      {showEmbroideryFields && (
        <Box width="200px">
          <ErrorBoundary errorMessage={`Failed to load embroidery options for ${shape.label}`}>
            <EmbroideryField
              { ...embroideryFieldProps }
            />
          </ErrorBoundary>
        </Box>
      )}
  
      {showQClassic && (
        <Box width="200px">
          <ErrorBoundary errorMessage={`Failed to load quilted leather options for ${shape.label}`}>
            <QClassicField
              {...fieldProps}
            />
          </ErrorBoundary>
        </Box>
      )}
    </InlineStack>
  );
};

export default React.memo(ShapeRow);