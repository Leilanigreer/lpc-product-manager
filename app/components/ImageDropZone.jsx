import React from 'react';
import { DropZone, BlockStack, Text, Box } from "@shopify/polaris";

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
}) => {
  const sizeConfig = SIZES[size] || SIZES.medium;
  const width = customWidth || sizeConfig.width;
  const height = customHeight || sizeConfig.height;

  const dropZoneStyle = {
    minHeight: height,
    height: height,
    width: width
  };

  return (
    <Box width={width} height={height} {...sizeConfig.style}>
      <DropZone
        accept="image/*"
        type="image"
        onDrop={onDrop}
        onDropAccepted={onDropAccepted}
        onDropRejected={onDropRejected}
        allowMultiple={false}
        label={sizeConfig.showLabel ? label : undefined}
        labelHidden={!sizeConfig.showLabel}
        outline={sizeConfig.outline}
        style={dropZoneStyle}
      >
        <BlockStack gap="100">
          <DropZone.FileUpload actionHint="" />
        </BlockStack>
      </DropZone>
    </Box>
  );
};

export default React.memo(ImageDropZone); 