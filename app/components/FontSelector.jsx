// app/components/FontSelector.jsx

import React, { useMemo } from 'react';
import { getGoogleDriveUrl } from '../lib/utils';
import { Card, InlineStack, Box, Select, BlockStack, Text, Image, Spinner } from "@shopify/polaris";

const FontSelector = ({ fonts, formState, onChange }) => {
  // Memoize font options and selected font
  const fontOptions = useMemo(() => {
    const baseOptions = [{ label: "Select a font", value: "" }];
    
    if (!Array.isArray(fonts)) {
      console.warn('Invalid fonts array');
      return baseOptions;
    }

    return [...baseOptions, ...fonts];
  }, [fonts]);

  const selectedFontObject = useMemo(() => 
    fonts?.find(font => font.value === formState.selectedFont),
    [fonts, formState.selectedFont]
  );

  const handleChange = (value) => {
    onChange('selectedFont', value);
  };

  // Add loading state for image
  const [isImageLoading, setIsImageLoading] = React.useState(false);

  return (
    <Card>
      <InlineStack gap="500" align="start" wrap={false}>
        <Box width="50%">
          <Select
            label="Select Font"
            options={fontOptions}
            onChange={handleChange}
            value={formState.selectedFont}
          />
        </Box>
        <Box width="50%">
          {formState.selectedFont && (
            <BlockStack gap="200">
              <Text variant="bodyMd" as="p">Font Preview:</Text>
              {isImageLoading && (
                <Box padding="400">
                  <Spinner accessibilityLabel="Loading font preview" size="small" />
                </Box>
              )}
              <Image
                source={getGoogleDriveUrl(selectedFontObject?.url_id)}
                alt={`Preview of ${selectedFontObject?.label} font`}
                style={{ 
                  width: '150px', 
                  height: 'auto',
                  display: isImageLoading ? 'none' : 'block'
                }}
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </BlockStack>
          )}
        </Box>
      </InlineStack>
    </Card>
  );
};

export default React.memo(FontSelector);