import React, { useMemo } from 'react';
import { Select, Card, Box, Text, BlockStack } from "@shopify/polaris";

/**
 * Collection selection for create-product. Collection rows come from Shopify (see loader).
 *
 * Next: styles will come from Shopify metaobjects (type `style`), not Postgres. Planned fields:
 *   - style (choice list)
 *   - abbreviation
 *   - category (choice list; must match collection `custom.category` choice list)
 *   - use_opposite_leather
 *   - leather_phrase
 *   - name_pattern
 *   - needs_secondary_leather
 *   - needs_stitching_color
 *   - needs_color_designation
 *
 * Style mode / global style UI below is commented out until that data is wired; logic is kept intact.
 *
 * @param {Object} props
 * @param {Array} props.shopifyCollections - Collections from the loader
 * @param {Object} props.productSets - Product sets (existing SKU hints per collection)
 * @param {Object} props.formState - Current form state
 * @param {Function} props.onChange - Callback when form state changes
 */

const CollectionSelector = ({ 
  shopifyCollections,
  productSets,
  formState,
  onChange
}) => {
  const collectionOptions = useMemo(() => [    
    { label: 'Select a collection...', value: '' }, 
    ...shopifyCollections
      .filter((c) => c.showInDropdown !== false)
      .map(({ value, label }) => ({
        value,
        label
      }))
  ], [shopifyCollections]);

  const handleCollectionChange = (value) => {
    const selectedCollection = shopifyCollections?.find(c => c.value === value);
    if (selectedCollection) {
      onChange('updateCollection', {
        collection: selectedCollection, 
        productSets 
      });
    }
  };

  /*
   * --- Style selection (restore when Shopify `style` metaobjects are loaded per collection) ---
   *
   * const currentCollection = useMemo(() =>
   *   shopifyCollections?.find(col => col.value === formState.collection?.value),
   *   [shopifyCollections, formState.collection?.value]
   * );
   *
   * const styleModeOptions = useMemo(() => [
   *   { label: 'Select style mode...', value: '' },
   *   { label: 'Global style for all shapes', value: 'global' },
   *   { label: 'Independent style per shape', value: 'independent' }
   * ], []);
   *
   * const styleOptions = useMemo(() => {
   *   if (!currentCollection?.styles?.length) {
   *     console.warn(`No styles found for collection: ${currentCollection?.label}`);
   *     return [{ label: 'Select a style...', value: '' }];
   *   }
   *   return [
   *     { label: 'Select a style...', value: '' },
   *     ...currentCollection.styles.map(style => ({
   *       label: style.label,
   *       value: style.value
   *     }))
   *   ];
   * }, [currentCollection]);
   *
   * const handleStyleModeChange = (value) => {
   *   if (value === 'independent') {
   *     onChange('globalStyle', null);
   *   }
   *   onChange('styleMode', value);
   * };
   *
   * const handleGlobalStyleChange = (value) => {
   *   const selectedStyle = currentCollection?.styles?.find(s => s.value === value);
   *   if (selectedStyle) {
   *     onChange('globalStyle', selectedStyle);
   *   }
   * };
   */

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

        {/*
          Restore when styles[] + needsStyle (or equivalent) come from Shopify.
          Re-add: import { ..., InlineStack } from "@shopify/polaris";

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
        */}
      </BlockStack>
    </Card>
  );
};

export default CollectionSelector;
