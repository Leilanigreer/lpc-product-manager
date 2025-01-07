// app/components/CollectionSelector.jsx

import React, { useMemo } from 'react';
import { Select, Card, InlineStack, Box, Text, BlockStack } from "@shopify/polaris";

/**
 * Collection selector component with style mode selection
 */
const CollectionSelector = ({ 
  shopifyCollections,
  formState,
  onChange
}) => {
  // Filter collections that should be shown in dropdown
  const collectionOptions = useMemo(() => [    
    { label: 'Select a collection...', value: '' }, 
    ...(shopifyCollections
      ?.filter(c => c.showInDropdown)
      ?.map(collection => ({
        label: collection.label,
        value: collection.value
      })) || [])
  ], [shopifyCollections]);

  // console.log("raw data", shopifyCollections)
  // console.log("Collections:", collectionOptions)

  // Get current collection for style options
  const currentCollection = useMemo(() => 
    shopifyCollections?.find(col => col.value === formState.collection?.value),
    [shopifyCollections, formState.collection?.value]
  );

  // Style mode options (global vs independent)
  const styleModeOptions = useMemo(() => [
    { label: 'Select style mode...', value: '' },
    { label: 'Global style for all shapes', value: 'global' },
    { label: 'Independent style per shape', value: 'independent' }
  ], []);

  // Available styles for the current collection
  const styleOptions = useMemo(() => {
    if (!currentCollection?.styles) return [];
    
    return [
      { label: 'Select a style...', value: '' },
      ...currentCollection.styles.map(style => ({
        label: style.label,
        value: style.value,
        data: style // Pass full style object for reference
      }))
    ];
  }, [currentCollection]);

  const handleCollectionChange = (value) => {
    const selectedCollection = shopifyCollections?.find(c => c.value === value);
    if (!selectedCollection) return;

    // Reset form state with new collection
    onChange('collection', {
      value: selectedCollection.value,
      label: selectedCollection.label,
      handle: selectedCollection.handle,
      skuPrefix: selectedCollection.skuPrefix,
      threadType: selectedCollection.threadType,
      description: selectedCollection.description,
      commonDescription: selectedCollection.commonDescription,
      needsSecondaryLeather: selectedCollection.needsSecondaryLeather,
      needsStitchingColor: selectedCollection.needsStitchingColor,
      needsQClassicField: selectedCollection.needsQClassicField,
      needsStyle: selectedCollection.needsStyle,
      showInDropdown: selectedCollection.showInDropdown,
      admin_graphql_api_id: selectedCollection.admin_graphql_api_id
    });

    // Reset style-related state
    onChange('styleMode', '');
    onChange('globalStyle', {
      value: '',
      label: '',
      abbreviation: '',
      image_url: '',
      overrides: {}
    });
    onChange('selectedStyles', {});
  };

  const handleStyleModeChange = (value) => {
    onChange('styleMode', value);
    
    // Reset style selections when mode changes
    if (value === 'global') {
      onChange('selectedStyles', {});
    } else {
      onChange('globalStyle', {
        value: '',
        label: '',
        abbreviation: '',
        image_url: '',
        overrides: {}
      });
    }
  };

  // Add validation helper
  const validateStyleSelection = (selectedStyle) => {
    if (!currentCollection || !selectedStyle) return true;
    
    // Check if style requires secondary leather when collection doesn't
    if (selectedStyle.overrides.overrideSecondaryLeather && 
        !currentCollection.needsSecondaryLeather) {
      console.warn('Style requires secondary leather but collection does not support it');
      return false;
    }
    
    return true;
  };
  

  const handleGlobalStyleChange = (value) => {
    const selectedStyle = currentCollection?.styles?.find(s => s.value === value);
    if (!selectedStyle) return;

    if (!validateStyleSelection(selectedStyle)) return;

    onChange('globalStyle', {
      value: selectedStyle.value,
      label: selectedStyle.label,
      abbreviation: selectedStyle.abbreviation,
      image_url: selectedStyle.image_url,
      overrides: {
        overrideSecondaryLeather: selectedStyle.overrideSecondaryLeather,
        overrideStitchingColor: selectedStyle.overrideStitchingColor,
        overrideQClassicField: selectedStyle.overrideQClassicField,
        titleTemplate: selectedStyle.titleTemplate,
        seoTemplate: selectedStyle.seoTemplate,
        handleTemplate: selectedStyle.handleTemplate,
        validation: selectedStyle.validation
      }
    });
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

export default React.memo(CollectionSelector);