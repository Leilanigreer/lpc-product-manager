import React, { useMemo } from 'react';
import { Card, Select, InlineStack, Box, BlockStack } from "@shopify/polaris";

const ThreadColorSelector = ({ 
  stitchingThreadColors,
  embroideryThreadColors,
  selectedEmbroideryColor, 
  selectedStitchingColor, 
  matchingAmannNumber,
  matchingIsacordNumber,
  onChange 
}) => {
  // First, sanitize the color arrays
  const sanitizedEmbroideryColors = useMemo(() => 
    embroideryThreadColors.map(({ label, value }) => ({
      label: String(label),
      value: String(value)
    })),
    [embroideryThreadColors]
  );
  
  const sanitizedStitchingColors = useMemo(() => 
    stitchingThreadColors.map(({ label, value }) => ({
      label: String(label),
      value: String(value)
    })),
    [stitchingThreadColors]
  );

  // Then find selected threads
  const selectedEmbroideryThread = useMemo(() => 
    embroideryThreadColors.find(thread => thread.value === selectedEmbroideryColor),
    [embroideryThreadColors, selectedEmbroideryColor]
  );

  const selectedStitchingThread = useMemo(() => 
    stitchingThreadColors.find(thread => thread.value === selectedStitchingColor),
    [stitchingThreadColors, selectedStitchingColor]
  );

  // Now sanitize the number arrays using the selected threads
  const sanitizedAmannNumbers = useMemo(() => 
    selectedStitchingThread?.amannNumbers?.map(({ label, value }) => ({
      label: String(label),
      value: String(value)
    })) || [],
    [selectedStitchingThread]
  );

  const sanitizedIsacordNumbers = useMemo(() => 
    selectedEmbroideryThread?.isacordNumbers?.map(({ label, value }) => ({
      label: String(label),
      value: String(value)
    })) || [],
    [selectedEmbroideryThread]
  );

  // Memoize the multiple numbers check
  const hasMultipleIsacordNumbers = useMemo(() => 
    selectedEmbroideryThread?.isacordNumbers?.length > 1,
    [selectedEmbroideryThread]
  );

  const hasMultipleAmannNumbers = useMemo(() => 
    selectedStitchingThread?.amannNumbers?.length > 1,
    [selectedStitchingThread]
  );

  const handleEmbroideryChange = (value) => {
    onChange('selectedEmbroideryColor', value);
    
    // Find the selected thread
    const selectedThread = embroideryThreadColors.find(thread => thread.value === value);
    
    if (selectedThread?.isacordNumbers?.length === 1) {
      // If there's exactly one number, set it automatically
      onChange('matchingIsacordNumber', selectedThread.isacordNumbers[0].value);
    } else {
      // Reset if there are multiple options or no options
      onChange('matchingIsacordNumber', '');
    }
  };
  
  const handleStitchingChange = (value) => {
    onChange('selectedStitchingColor', value);
    
    // Find the selected thread
    const selectedThread = stitchingThreadColors.find(thread => thread.value === value);
    
    if (selectedThread?.amannNumbers?.length === 1) {
      // If there's exactly one number, set it automatically
      onChange('matchingAmannNumber', selectedThread.amannNumbers[0].value);
    } else {
      // Reset if there are multiple options or no options
      onChange('matchingAmannNumber', '');
    }
  };

  return (
    <Card>
      <InlineStack gap="400" align="start" wrap={false}>
        <Box width="50%">
          <BlockStack gap="400">
            <Select
              label="Select Embroidery"
              options={[
                { label: "Color of Thread", value: "" }, 
                ...sanitizedEmbroideryColors
              ]}
              onChange={handleEmbroideryChange}
              value={selectedEmbroideryColor}
            />
            {hasMultipleIsacordNumbers && (
              <Select
                label="Select Isacord Number"
                options={[
                  { label: "Select Number", value: "" },
                  ...sanitizedIsacordNumbers.map(({ label, value }) => ({
                    label,
                    value
                  }))
                ]}
                onChange={(value) => onChange('matchingIsacordNumber', value)}
                value={matchingIsacordNumber}
              />
            )}
          </BlockStack>
        </Box>
        <Box width="50%">
          <BlockStack gap="400">
            <Select
              label="Select Stitching"
              options={[
                { label: "Color of Thread", value: "" }, 
                ...sanitizedStitchingColors
              ]}
              onChange={handleStitchingChange}
              value={selectedStitchingColor}
            />
            {hasMultipleAmannNumbers && (
              <Select
                label="Select Amann Number"
                options={[
                  { label: "Select Number", value: "" },
                  ...sanitizedAmannNumbers.map(({ label, value }) => ({
                    label,
                    value
                  }))
                ]}
                onChange={(value) => onChange('matchingAmannNumber', value)}
                value={matchingAmannNumber}
              />
            )}
          </BlockStack>
        </Box>
      </InlineStack>
    </Card>
  );
};

export default React.memo(ThreadColorSelector);