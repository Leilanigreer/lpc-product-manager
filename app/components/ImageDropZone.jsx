import React, { useState } from 'react';
import { DropZone, BlockStack, Text, Box, Image, Spinner } from "@shopify/polaris";

const SIZES = {
  small: {
    width: "48px",
    height: "48px",
    showLabel: false,
    outline: true,
    style: {}
  },
  medium: {
    width: "150px",
    height: "84.375px",
    showLabel: false,
    outline: true,
    style: {}
  },
  large: {
    width: "100%",
    height: "auto",
    showLabel: true,
    outline: true,
    style: {}
  },
  additional: {
    width: "200px",
    height: "112.5px",
    showLabel: true,
    outline: true,
    style: {}
  }
};

const ImageDropZone = ({
  size = "medium",
  label,
  onDrop,
  onDropAccepted,
  onDropRejected,
  customWidth,
  customHeight,
  uploadedImageUrl,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const sizeConfig = SIZES[size] || SIZES.medium;
  const width = customWidth || sizeConfig.width;
  const height = customHeight || sizeConfig.height;

  const dropZoneStyle = {
    minHeight: height,
    height: height,
    width: width
  };

  const handleDrop = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      await onDrop(files);
      if (onDropAccepted) onDropAccepted(files);
    } catch (error) {
      if (onDropRejected) onDropRejected(files);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <BlockStack gap="200">
      {sizeConfig.showLabel && (
        <Text variant="bodyMd" as="p">{label}</Text>
      )}
      <Box width={width} height={height} {...sizeConfig.style}>
        {isUploading ? (
          <Box padding="400" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spinner accessibilityLabel="Uploading image" size="small" />
          </Box>
        ) : uploadedImageUrl ? (
          <Box style={{ position: 'relative', height: '100%' }}>
            <Image
              source={uploadedImageUrl}
              alt={`Uploaded ${label} image`}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                borderRadius: '4px'
              }}
            />
            <Box style={{ 
              position: 'absolute', 
              top: '4px', 
              right: '4px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text variant="bodySm" color="base-inverse">✓</Text>
            </Box>
          </Box>
        ) : (
          <DropZone
            accept="image/*"
            type="image"
            onDrop={handleDrop}
            allowMultiple={false}
            label={sizeConfig.showLabel ? undefined : label}
            labelHidden={!sizeConfig.showLabel}
            outline={sizeConfig.outline}
            style={dropZoneStyle}
          >
            <BlockStack gap="100">
              <DropZone.FileUpload actionHint="" />
            </BlockStack>
          </DropZone>
        )}
      </Box>
    </BlockStack>
  );
};

export default React.memo(ImageDropZone); 