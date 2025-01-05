// app/components/ProductTypeSelector.jsx

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

/**
 * Product type selector component that handles both standard and limited edition types
 * @param {Object} props
 * @param {Object} props.formState - Current form state
 * @param {string} props.formState.selectedOfferingType - Selected product type
 * @param {string} props.formState.limitedEditionQuantity - Quantity for limited editions
 * @param {Function} props.onChange - Callback when selections change
 */
const ProductTypeSelector = ({ formState, onChange }) => {
  const handleTypeChange = (value) => {
    // Reset quantity if switching away from limited edition
    if (value !== 'limitedEdition') {
      onChange('limitedEditionQuantity', '');
    }
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
              checked={formState.selectedOfferingType === 'customizable'}
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
                checked={formState.selectedOfferingType === 'limitedEdition'}
                id="limitedEdition"
                name="productType"
                onChange={() => handleTypeChange('limitedEdition')}
                helpText="Special Hide"
              />
            </Box>

            {formState.selectedOfferingType === 'limitedEdition' && (
              <Box minWidth="200px">
                <TextField
                  label="Quantity"
                  type="number"
                  value={formState.limitedEditionQuantity}
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