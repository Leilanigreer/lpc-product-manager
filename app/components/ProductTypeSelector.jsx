import React from 'react';
import { Card, InlineStack, Box, RadioButton, TextField, BlockStack, Text } from "@shopify/polaris";

const ProductTypeSelector = ({ 
  selectedType, 
  quantity,
  onChange
}) => {
  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingSm" as="h6">Select Product Type</Text>
        <InlineStack gap="500" align="start" wrap={false}>
          <Box width="50%">
            <InlineStack gap="400">
              <RadioButton
                label="Customizable"
                checked={selectedType === 'customizable'}
                id="customizable"
                name="productType"
                onChange={() => onChange('selectedOfferingType')('customizable')}
              />
              <RadioButton
                label="Limited Edition"
                checked={selectedType === 'limitedEdition'}
                id="limitedEdition"
                name="productType"
                onChange={() => onChange('selectedOfferingType')('limitedEdition')}
              />
            </InlineStack>
          </Box>
          <Box width="50%">
            {selectedType === 'limitedEdition' && (
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={onChange('limitedEditionQuantity')}
                min={1}
                autoComplete="off"
              />
            )}
          </Box>
        </InlineStack>
      </BlockStack>
    </Card>
  );
};

export default ProductTypeSelector;