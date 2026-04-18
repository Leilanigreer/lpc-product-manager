import React, { useMemo } from 'react';
import { Select, Card, Box, Text, BlockStack, InlineStack } from "@shopify/polaris";

/**
 * Collection + style selection for create-product.
 *
 * Collections and `styles[]` come from the loader (Shopify: `style` metaobjects filtered by
 * `style.collectionCategory === collection.category`).
 *
 * Styles are then matched to shapes via `shape_group`:
 * `style.shapeGroup` is compared against each shape's `shape_group`.
 *
 * Style selection UI is only needed when any `shape_group` within the selected `collection_category`
 * has more than 1 valid style option. When every `shape_group` has exactly 1 style, we auto-assign
 * styles per shape in `useFormState` and we don't show style mode controls.
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

  const currentCollection = useMemo(() =>
    shopifyCollections?.find(col => col.value === formState.collection?.value),
    [shopifyCollections, formState.collection?.value]
  );

  const styleModeOptions = useMemo(() => [
    { label: 'Independent style per shape', value: 'independent' }
  ], []);

  const styleOptions = useMemo(() => {
    const styles = currentCollection?.styles;
    if (!styles?.length) {
      return [{ label: 'Select a style...', value: '' }];
    }
    return [
      { label: 'Select a style...', value: '' },
      ...styles.map(style => ({
        label: style.label,
        value: style.value
      }))
    ];
  }, [currentCollection]);

  const showStyleControls = useMemo(() => {
    const styles = currentCollection?.styles ?? [];
    const groupCounts = styles.reduce((acc, s) => {
      const key =
        s.shapeGroup != null && String(s.shapeGroup).trim() !== ''
          ? String(s.shapeGroup).trim()
          : 'UNKNOWN';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.values(groupCounts).some((count) => count > 1);
  }, [currentCollection?.styles]);

  const handleCollectionChange = (value) => {
    const selectedCollection = shopifyCollections?.find(c => c.value === value);
    if (selectedCollection) {
      onChange('updateCollection', {
        collection: selectedCollection, 
        productSets 
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

        {showStyleControls && (
          <InlineStack gap="400" align="start" wrap={false}>
            <Box width="50%">
              <Text as="h2" variant="headingMd">Style Mode</Text>
              <Box paddingBlockStart="200">
                <Select
                  label="Select style mode"
                  options={styleModeOptions}
                  onChange={handleStyleModeChange}
                  value={formState.styleMode || 'independent'}
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
