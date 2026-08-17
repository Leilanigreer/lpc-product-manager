import React, { useCallback } from 'react';
import { InlineStack, Text } from "@shopify/polaris";
import ImageDropZone from './ImageDropZone';
import { uploadToGoogleDrive, updateToGoogleDrive } from '../lib/utils/googleDrive';
import { uploadToR2 } from '../lib/utils/r2';
import { getGoogleDriveUrl } from '../lib/utils/urlUtils';
import { isDevelopment } from '../lib/config/environment';

function prefixFromObjectUrl(url) {
  const u = String(url || "").replace(/\/+$/, "");
  const idx = u.lastIndexOf("/");
  return idx > 0 ? u.slice(0, idx) : "";
}

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
      const slugLabel = label.toLowerCase().replace(/\s+/g, '-');
      
      let driveData = null;
      try {
        const existingImage = productData.additionalViews?.find(img => img.label === label);
        
        if (existingImage?.driveData?.fileId) {
          driveData = await updateToGoogleDrive(file, existingImage.driveData.fileId);
        } else {
          driveData = await uploadToGoogleDrive(file, {
            collection: productData.productType,
            folderName: productData.productPictureFolder,
            sku: baseSKU,
            originalsFolderName: productData.originalsFolderName,
            label: slugLabel
          });
        }
      } catch (driveError) {
        if (isDevelopment) {
          console.error('Google Drive upload failed:', driveError);
        }
        throw driveError;
      }

      let r2Data = null;
      try {
        const existingKey = productData.additionalViews?.find(img => img.label === label)?.r2Data?.key;
        r2Data = await uploadToR2(file, {
          collection: productData.productType,
          folder: productData.productPictureFolder,
          sku: baseSKU,
          label: slugLabel,
          key: existingKey,
        });
      } catch (r2Error) {
        if (isDevelopment) console.error('R2 upload failed:', r2Error);
      }

      if (onImageUpload) {
        const displayUrl = r2Data?.url || getGoogleDriveUrl(driveData.fileId);
        
        onImageUpload(
          baseSKU,
          label,
          displayUrl,
          {
            driveData,
            r2Data,
            r2PrefixUrl: prefixFromObjectUrl(r2Data?.url),
          }
        );
      }
    } catch (error) {
      if (isDevelopment) {
        console.error('Error uploading additional view:', error);
      }
    }
  }, [formState.baseSKU, onImageUpload, productData.productPictureFolder, productData.productType, productData.additionalViews, productData.originalsFolderName]);

  const handleDropAccepted = useCallback((files) => {
    // No need for console logs here
  }, []);

  const handleDropRejected = useCallback((files) => {
    // No need for console logs here
  }, []);

  const getUploadedImageUrl = useCallback((label) => {
    if (!productData.additionalViews) return null;
    const image = productData.additionalViews.find(img => img.label === label);
    return image?.displayUrl || null;
  }, [productData.additionalViews]);

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
        onDrop={(files) => handleDrop(files, 'Back View')}
        onDropAccepted={handleDropAccepted}
        onDropRejected={handleDropRejected}
        uploadedImageUrl={getUploadedImageUrl('Back View')}
      />
      <ImageDropZone
        size="additional"
        label="Inside View"
        onDrop={(files) => handleDrop(files, 'Inside View')}
        onDropAccepted={handleDropAccepted}
        onDropRejected={handleDropRejected}
        uploadedImageUrl={getUploadedImageUrl('Inside View')}
      />
    </InlineStack>
  );
};

export default React.memo(AdditionalViews);
