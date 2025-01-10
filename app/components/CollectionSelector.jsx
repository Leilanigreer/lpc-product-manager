import React, { useMemo } from 'react';
import { Select, Card, InlineStack, Box, Text, BlockStack } from "@shopify/polaris";

/**
 * @typedef {Object} StyleOverrides
 * @property {boolean|null} overrideSecondaryLeather
 * @property {boolean|null} overrideStitchingColor
 * @property {boolean|null} overrideQClassicField
 */

/**
 * @param {Object} collection Collection object
 * @param {StyleOverrides|null} style Style object with overrides
 */
function resolveRequirements(collection, style) {
  return {
    needsSecondaryLeather: style?.overrideSecondaryLeather ?? collection.needsSecondaryLeather,
    needsStitchingColor: style?.overrideStitchingColor ?? collection.needsStitchingColor,
    needsQClassicField: style?.overrideQClassicField ?? collection.needsQClassicField
  };
}

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

  // Get current collection for style options
  const currentCollection = useMemo(() => 
    shopifyCollections?.find(col => col.value === formState.collection?.value),
    [shopifyCollections, formState.collection?.value]
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
      return [{ label: 'Select a style...', value: '' }];
    }
    
    return [
      { label: 'Select a style...', value: '' },
      ...currentCollection.styles.map(style => ({
        label: style.label || style.name,
        value: style.value || style.id
      }))
    ];
  }, [currentCollection]);

  const handleCollectionChange = (value) => {
    const selectedCollection = shopifyCollections?.find(c => c.value === value);
    if (!selectedCollection) return;

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
      admin_graphql_api_id: selectedCollection.admin_graphql_api_id,
      styles: selectedCollection.styles
    });

    // Reset style-related state
    onChange('styleMode', '');
    onChange('globalStyle', null);
    onChange('selectedStyles', {});
  };

  const handleStyleModeChange = (value) => {
    onChange('styleMode', value);
    
    // Reset style selections when mode changes
    onChange('globalStyle', null);
    onChange('selectedStyles', {});
  };

  const handleGlobalStyleChange = (value) => {
    const selectedStyle = currentCollection?.styles?.find(s => s.value === value || s.id === value);
    console.log('Selected style raw:', selectedStyle);
    
    if (!selectedStyle) return;

    const requirements = resolveRequirements(currentCollection, selectedStyle);

    const styleData = {
      value: selectedStyle.value || selectedStyle.id,
      label: selectedStyle.label || selectedStyle.name,
      abbreviation: selectedStyle.abbreviation,
      overrides: {
        overrideSecondaryLeather: selectedStyle.overrideSecondaryLeather,
        overrideStitchingColor: selectedStyle.overrideStitchingColor,
        overrideQClassicField: selectedStyle.overrideQClassicField,
        titleTemplate: selectedStyle.titleTemplate,
        seoTemplate: selectedStyle.seoTemplate,
        handleTemplate: selectedStyle.handleTemplate,
        validation: selectedStyle.validation
      },
      requirements
    };

    onChange('globalStyle', styleData);

    // Update selected styles for all shapes when in global mode
    if (formState.styleMode === 'global' && formState.weights) {
      const updatedStyles = {};
      Object.keys(formState.weights).forEach(shapeId => {
        updatedStyles[shapeId] = styleData;
      });
      onChange('selectedStyles', updatedStyles);
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