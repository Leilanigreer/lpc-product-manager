import React from 'react';
import { Card, InlineStack, Box, Select, BlockStack, Text, Image } from "@shopify/polaris";

const FontSelector = ({ fonts, selectedFont, onChange }) => {
  const selectedFontObject = fonts.find(font => font.value === selectedFont);

  return (
    <Card>
      <InlineStack gap="500" align="start" wrap={false}>
        <Box width="50%">
          <Select
            label="Select Font"
            options={[{ label: "Font used", value: "" }, ...fonts]}
            onChange={onChange}
            value={selectedFont}
          />
        </Box>
        <Box width="50%">
          {selectedFont && (
            <BlockStack gap="200">
              <Text variant="bodyMd" as="p">Font Preview:</Text>
              <Image
                source={selectedFontObject?.image_url}
                alt={`Preview of ${selectedFontObject?.label} font`}
                style={{ width: '150px', height: 'auto' }}
              />
            </BlockStack>
          )}
        </Box>
      </InlineStack>
    </Card>
  );
};

export default FontSelector;