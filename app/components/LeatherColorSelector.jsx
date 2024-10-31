// app/components/LeatherColorSelector.jsx

import React from 'react';
import { Card, InlineStack, Box, Select, BlockStack, Text, Image } from "@shopify/polaris";

const LeatherColorSelector = ({ 
  leatherColors, 
  selectedLeatherColor1, 
  selectedLeatherColor2, 
  onChange, 
  needsSecondaryColor,
}) => {
  // Filter out colorTags from the options
  const sanitizedLeatherColors = leatherColors.map(({ colorTags, ...rest }) => rest);

  const renderColorSelector = (label, value, field, index) => (
    <>
      <Box width={needsSecondaryColor ? "25%" : "50%"}>
        <Select
          label={label}
          options={[{ label: "Select a Leather", value: "" }, ...sanitizedLeatherColors]}
          onChange={(newValue) => onChange(field, newValue)}
          value={value}
        />
      </Box>
      <Box width={needsSecondaryColor ? "25%" : "50%"}>
        {value && (
          <BlockStack gap="200">
            <Text variant="bodyMd" as="p">{index === 2 ? "2nd Leather Preview:" : "Leather Preview:"}</Text>
            <Image
              source={leatherColors.find(color => color.value === value)?.image_url}
              alt={`Preview of ${leatherColors.find(color => color.value === value)?.label} leather`}
              style={{ width: '150px', height: 'auto' }}
            />
          </BlockStack>
        )}
      </Box>
    </>
  );

  return (
    <Card>
      <InlineStack gap="500" align="start" wrap={false}>
        {renderColorSelector(
          "Select Leather Color", 
          selectedLeatherColor1, 
          'selectedLeatherColor1', 
          1
        )}
        {needsSecondaryColor && (
          renderColorSelector(
            "Select 2nd Leather Color", 
            selectedLeatherColor2, 
            'selectedLeatherColor2', 
            2
          )
        )}
      </InlineStack>
    </Card>
  );
};

export default React.memo(LeatherColorSelector);