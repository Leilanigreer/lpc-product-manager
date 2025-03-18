import React, { useCallback } from 'react';
import { InlineStack, Box, Text } from "@shopify/polaris";
import ImageDropZone from './ImageDropZone';
import { uploadToCloudinary } from '../lib/utils/cloudinary';

const AdditionalViews = ({ 
  formState,
  handleChange,
  onImageUpload,
  productData
}) => {
  const handleDrop = useCallback(async (files, label) => {
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const baseSKU = formState.baseSKU;
      
      // Create the public ID using the same folder structure as variants
      const publicId = `${productData.cloudinaryFolder}/${baseSKU}-${label.toLowerCase().replace(/\s+/g, '-')}`;

      // Upload to Cloudinary
      const result = await uploadToCloudinary(file, publicId);
      
      console.log('Additional view uploaded:', {
        baseSKU,
        label,
        publicId,
        url: result.url,
        folder: productData.cloudinaryFolder
      });

      // Update the form state with the new image URL
      if (onImageUpload) {
        onImageUpload(label, result.url);
      }
    } catch (error) {
      console.error('Error uploading additional view:', error);
    }
  }, [formState.baseSKU, onImageUpload, productData.cloudinaryFolder]);

  const handleDropAccepted = useCallback((files) => {
    console.log('Files accepted:', files);
  }, []);

  const handleDropRejected = useCallback((files) => {
    console.log('Files rejected:', files);
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
          onDrop={(files) => handleDrop(files, 'Back')}
          onDropAccepted={handleDropAccepted}
          onDropRejected={handleDropRejected}
        />
      </Box>
      <Box>
        <ImageDropZone
          size="additional"
          label="Inside View"
          onDrop={(files) => handleDrop(files, 'Inside')}
          onDropAccepted={handleDropAccepted}
          onDropRejected={handleDropRejected}
        />
      </Box>
    </InlineStack>
  );
};

export default React.memo(AdditionalViews); 