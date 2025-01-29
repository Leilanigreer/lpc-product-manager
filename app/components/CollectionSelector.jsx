import React, { useMemo } from 'react';
import { sanitizeCollectionOptions } from '../lib/utils/optionSanitizer';
import { Select, Card, InlineStack, Box, Text, BlockStack } from "@shopify/polaris";

/**
 * Collection Selector component that handles collection selection and style mode configuration
 * @param {Object} props
 * @param {Array} props.shopifyCollections - Available collections from the database
 * @param {Object} props.formState - Current form state including collection and style settings
 * @param {Function} props.onChange - Callback when form state changes
 */

const CollectionSelector = ({ 
  shopifyCollections,
  productDataLPC,
  formState,
  onChange
}) => {
  const displayCollections = useMemo(() => 
      sanitizeCollectionOptions(shopifyCollections),
      [shopifyCollections]
    );

  // Filter collections that should be shown in dropdown
  const collectionOptions = useMemo(() => [    
    { label: 'Select a collection...', value: '' }, 
    ...displayCollections.map(({ value, label }) => ({
      value,
      label
    }))
  ], [displayCollections]);

  // Get current collection for style options
  const currentCollection = useMemo(() => 
    displayCollections?.find(col => col.value === formState.collection?.value),
    [displayCollections, formState.collection?.value]
  );

  // Style mode options
  const styleModeOptions = useMemo(() => [
    { label: 'Select style mode...', value: '' },
    { label: 'Global style for all shapes', value: 'global' },
    { label: 'Independent style per shape', value: 'independent' }
  ], []);

  // Available styles for the current collection
  const styleOptions = useMemo(() => {
    if (!currentCollection?.styles?.length) {
      console.warn(`No styles found for collection: ${currentCollection?.label}`);
      return [{ label: 'Select a style...', value: '' }];
    }
    
    return [
      { label: 'Select a style...', value: '' },
      ...currentCollection.styles
    ];
  }, [currentCollection]);

  const handleCollectionChange = (value) => {
    const selectedCollection = shopifyCollections?.find(c => c.value === value);
    if (selectedCollection) {
      onChange('updateCollection', {
        collection: selectedCollection, 
        productDataLPC 
      });
    }
  };

  const handleStyleModeChange = (value) => {
    if (value === 'independent') {
      onChange('globalStyle', null);
    }
    onChange('styleMode', value);
  };

  const handleGlobalStyleChange = (value) => {
    const selectedStyle = currentCollection?.styles?.find(s => s.value === value);
    if (selectedStyle) {
      onChange('globalStyle', selectedStyle);
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Box width="100%">
          <Text as="h2" variant="headingMd">Collection Selection</Text>
          <Box paddingBlockStart="200">
            <Select
              label="Select a collection"
              options={collectionOptions}
              onChange={handleCollectionChange}
              value={formState.collection?.value || ''}
            />
          </Box>
        </Box>

        {currentCollection?.needsStyle && (
          <InlineStack gap="400" align="start" wrap={false}>
            <Box width="50%">
              <Text as="h2" variant="headingMd">Style Mode</Text>
              <Box paddingBlockStart="200">
                <Select
                  label="Select style mode"
                  options={styleModeOptions}
                  onChange={handleStyleModeChange}
                  value={formState.styleMode || ''}
                />
              </Box>
            </Box>

            {formState.styleMode === 'global' && (
              <Box width="50%">
                <Text as="h2" variant="headingMd">Global Style</Text>
                <Box paddingBlockStart="200">
                  <Select
                    label="Select style"
                    options={styleOptions}
                    onChange={handleGlobalStyleChange}
                    value={formState.globalStyle?.value || ''}
                  />
                </Box>
              </Box>
            )}
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
};

export default CollectionSelector;