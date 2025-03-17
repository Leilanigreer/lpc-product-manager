import React, { useCallback, useState } from 'react';
import { InlineStack, Box, Card } from "@shopify/polaris";
import ImageDropZone from './ImageDropZone';

const getViewLabels = (shapeLabel) => {
  if (shapeLabel === 'Mallet') {
    return ['Front', 'Back', 'Open Back'];
  } else if (shapeLabel === 'Blade') {
    return ['Top', 'Side Back', 'Side Front'];
  }
  return ['Default'];
};

const getFolderName = (shapeLabel, viewLabel) => {
  return `putters/${shapeLabel.toLowerCase()}/${viewLabel.toLowerCase().replace(/\s+/g, '-')}`;
};

const ShapeImages = ({ shape, isSelected }) => {
  const [uploadStatus, setUploadStatus] = useState({});

  const handleDrop = useCallback(async (files, viewLabel) => {
    const file = files[0];
    if (!file) return;

    const folderName = getFolderName(shape.label, viewLabel);
    
    try {
      // Upload to both Google Drive and Cloudinary
      const [driveResult, cloudinaryResult] = await Promise.all([
        fetch('/api/upload/google-drive', {
          method: 'POST',
          body: JSON.stringify({ file, folderName }),
        }).then(res => res.json()),
        
        fetch('/api/upload/cloudinary', {
          method: 'POST',
          body: JSON.stringify({ file, folderName }),
        }).then(res => res.json()),
      ]);

      setUploadStatus(prev => ({
        ...prev,
        [viewLabel]: {
          success: true,
          driveLink: driveResult.webViewLink,
          cloudinaryUrl: cloudinaryResult.url,
        }
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(prev => ({
        ...prev,
        [viewLabel]: {
          success: false,
          error: error.message,
        }
      }));
    }
  }, [shape.label]);

  if (!isSelected) return null;

  const viewLabels = getViewLabels(shape.label);
  
  // For non-putter shapes, show single view
  if (!(shape.label === 'Mallet' || shape.label === 'Blade')) {
    return (
      <Box width="40px" height="40px" >
        <ImageDropZone
          size="small"
          label="Default"
          onDrop={(files) => handleDrop(files, 'Default')}
        />
      </Box>
    );
  }

  // Putter views
  return (
    <Box width="484px">
      <Card padding="200">
        <InlineStack gap="200" align="start">
          {viewLabels.map((label) => (
            <ImageDropZone
              key={label}
              label={label}
              onDrop={(files) => handleDrop(files, label)}
            />
          ))}
        </InlineStack>
      </Card>
    </Box>
  );
};

export default React.memo(ShapeImages); 