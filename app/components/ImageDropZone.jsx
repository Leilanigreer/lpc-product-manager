import React, { useState, useCallback } from 'react';
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
    width: "160px",
    height: "90px",
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
    width: width,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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

  // Create a ref for the hidden file input
  const fileInputRef = React.useRef(null);

  // Handler for clicking the image or button
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const renderUploadedImage = () => (
    <Box 
      style={{ position: 'relative', height: '100%' }}
      onClick={handleClick}
    >
      <Image
        source={uploadedImageUrl}
        alt={`Uploaded ${label} image`}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      />
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleDrop(e.target.files);
          }
          // Reset the input value so the same file can be selected again
          e.target.value = '';
        }}
      />
    </Box>
  );

  return (
    <BlockStack gap="100">
      {sizeConfig.showLabel && (
        <Text variant="bodyMd" as="p">{label}</Text>
      )}
      <Box width={width} height={height}>
        {isUploading ? (
          <Box padding="200" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spinner accessibilityLabel="Uploading image" size="small" />
          </Box>
        ) : uploadedImageUrl ? (
          renderUploadedImage()
        ) : (
          <DropZone
            accept="image/*"
            type="image"
            onDrop={handleDrop}
            allowMultiple={false}
            label={sizeConfig.showLabel ? undefined : label}
            labelHidden={!sizeConfig.showLabel}
            outline={sizeConfig.outline}
          >
            <DropZone.FileUpload actionHint="" />
          </DropZone>
        )}
      </Box>
    </BlockStack>
  );
};

export default React.memo(ImageDropZone); 