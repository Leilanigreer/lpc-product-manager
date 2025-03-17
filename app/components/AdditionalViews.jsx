import React, { useCallback } from 'react';
import { InlineStack, Box, Text } from "@shopify/polaris";
import ImageDropZone from './ImageDropZone';

const AdditionalViews = ({ 
  formState,
  handleChange
}) => {
  const handleDrop = useCallback((files) => {
    // Handle dropped files here
  }, []);

  const handleDropAccepted = useCallback((files) => {
    // Handle accepted files here
  }, []);

  const handleDropRejected = useCallback((files) => {
    // Handle rejected files here
  }, []);

  // Check if any non-putter shapes are selected
  const hasSelectedNonPutters = Object.entries(formState.allShapes).some(
    ([_, shapeState]) => shapeState?.isSelected && !shapeState?.isPutter
  );

  if (!hasSelectedNonPutters) {
    return (
      <Text variant="bodyMd" color="subdued">
        Select a non-putter shape to upload additional views
      </Text>
    );
  }

  return (
    <InlineStack gap="400" align="start">
      <Box>
        <ImageDropZone
          size="additional"
          label="Back View"
          onDrop={handleDrop}
          onDropAccepted={handleDropAccepted}
          onDropRejected={handleDropRejected}
        />
      </Box>
      <Box>
        <ImageDropZone
          size="additional"
          label="Inside View"
          onDrop={handleDrop}
          onDropAccepted={handleDropAccepted}
          onDropRejected={handleDropRejected}
        />
      </Box>
    </InlineStack>
  );
};

export default React.memo(AdditionalViews); 