import React, { useCallback } from 'react';
import { InlineStack, Text } from "@shopify/polaris";
import ImageDropZone from './ImageDropZone';
import { uploadToCloudinary } from '../lib/utils/cloudinary';
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
        throw driveError;
      }

      // Upload to Cloudinary
      let cloudinaryData = null;
      try {
        const publicId = `${productData.productType}/${productData.productPictureFolder}/${baseSKU}-${label.toLowerCase().replace(/\s+/g, '-')}`;
        cloudinaryData = await uploadToCloudinary(file, publicId, productData.productType, productData.productPictureFolder);
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed:', cloudinaryError);
        // Don't throw here, as we still have Google Drive data
      }

      // Update the form state with both URLs if available
      if (onImageUpload) {
        onImageUpload(label, cloudinaryData?.url || getGoogleDriveUrl(driveData.fileId), {
          ...driveData,
          cloudinaryUrl: cloudinaryData?.url,
          cloudinaryId: cloudinaryData?.publicId
        });
      }
    } catch (error) {
      console.error('Error uploading additional view:', error);
    }
  }, [formState.baseSKU, onImageUpload, productData.productPictureFolder, productData.productType]);

  const handleDropAccepted = useCallback((files) => {
    // No need for console logs here
  }, []);

  const handleDropRejected = useCallback((files) => {
    // No need for console logs here
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