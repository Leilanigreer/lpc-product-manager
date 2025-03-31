import React, { useCallback } from 'react';
import { InlineStack, Text } from "@shopify/polaris";
import ImageDropZone from './ImageDropZone';
// import { uploadToCloudinary } from '../lib/utils/cloudinary';
import { uploadToGoogleDrive } from '../lib/utils/googleDrive';
import { getGoogleDriveUrl } from '../lib/utils/urlUtils';

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
      
      console.log('Starting additional view upload:', {
        baseSKU,
        label,
        folderName: productData.productPictureFolder,
        productType: productData.productType
      });
      
      // Upload to Google Drive
      let driveData = null;
      try {
        driveData = await uploadToGoogleDrive(file, {
          collection: productData.productType,
          folderName: productData.productPictureFolder,
          sku: baseSKU,
          label: label.toLowerCase().replace(/\s+/g, '-')
        });
      } catch (driveError) {
        console.error('Google Drive upload failed:', driveError);
        throw driveError; // Re-throw to handle the error
      }

      console.log('Additional view uploaded successfully:', {
        baseSKU,
        label,
        collection: productData.productType,
        folderName: productData.productPictureFolder,
        driveData
      });

      // Update the form state with the Google Drive URL
      if (onImageUpload) {
        onImageUpload(label, getGoogleDriveUrl(driveData.fileId), driveData);
      }
    } catch (error) {
      console.error('Error uploading additional view:', error);
    }
  }, [formState.baseSKU, onImageUpload, productData.productPictureFolder, productData.productType]);

  const handleDropAccepted = useCallback((files) => {
    console.log('Files accepted:', files);
  }, []);

  const handleDropRejected = useCallback((files) => {
    console.log('Files rejected:', files);
  }, []);

  // Get the uploaded image URL for a specific label
  const getUploadedImageUrl = useCallback((label) => {
    if (!productData.additionalViews) return null;
    const image = productData.additionalViews.find(img => img.label === label);
    return image?.url || null;
  }, [productData.additionalViews]);

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
    <InlineStack gap="600" align="start">
      <ImageDropZone
        size="additional"
        label="Back View"
        onDrop={(files) => handleDrop(files, 'Back')}
        onDropAccepted={handleDropAccepted}
        onDropRejected={handleDropRejected}
        uploadedImageUrl={getUploadedImageUrl('Back')}
      />
      <ImageDropZone
        size="additional"
        label="Inside View"
        onDrop={(files) => handleDrop(files, 'Inside')}
        onDropAccepted={handleDropAccepted}
        onDropRejected={handleDropRejected}
        uploadedImageUrl={getUploadedImageUrl('Inside')}
      />
    </InlineStack>
  );
};

export default React.memo(AdditionalViews); 