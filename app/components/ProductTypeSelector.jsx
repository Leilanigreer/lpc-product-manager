import React from 'react';
import {
  Card,
  InlineStack,
  Box,
  RadioButton,
  TextField,
  BlockStack,
  Text,
  Divider
} from "@shopify/polaris";

const ProductTypeSelector = ({ 
  selectedType, 
  quantity,
  onChange
}) => {
  const handleTypeChange = (value) => {
    onChange('selectedOfferingType', value);
  };

  const handleQuantityChange = (value) => {
    onChange('limitedEditionQuantity', value);
  };

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text variant="headingMd" as="h2">
            Select Product Type
          </Text>
        </BlockStack>
        
        <Divider />
        
        <InlineStack gap="500" align="start" wrap={false}>
          <Box minWidth="120px">
            <RadioButton
              label="Standard Stock"
              checked={selectedType === 'customizable'}
              id="customizable"
              name="productType"
              onChange={() => handleTypeChange('customizable')}
              helpText="Stock Leather"
            />
          </Box>
          
          <InlineStack gap="300" align="start" wrap={false}>
            <Box minWidth="120px">
              <RadioButton
                label="Limited Edition"
                checked={selectedType === 'limitedEdition'}
                id="limitedEdition"
                name="productType"
                onChange={() => handleTypeChange('limitedEdition')}
                helpText="Special Hide"
              />
            </Box>

            {selectedType === 'limitedEdition' && (
              <Box minWidth="200px">
                <TextField
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  autoComplete="off"
                  min={1}
                  placeholder="Enter quantity"
                />
              </Box>
            )}
          </InlineStack>
        </InlineStack>
      </BlockStack>
    </Card>
  );
};

export default React.memo(ProductTypeSelector);