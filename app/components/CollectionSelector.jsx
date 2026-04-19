import React, { useMemo } from 'react';
import { Select, Card, Box, Text, BlockStack } from "@shopify/polaris";

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
 * styles per shape in `useFormState`. Users always pick style per shape in the grid when required.
 *
 * @param {Object} props
 * @param {Array} props.shopifyCollections - Collections from the loader
 * @param {Object} props.formState - Current form state
 * @param {Function} props.onChange - Form dispatch; uses `updateCollection` with `{ collection }`. Existing base SKUs for versioning load at Preview time.
 *
 * When the selected collection has no `priceTier`, an informational note explains manual
 * pricing and that templated fields are not applied yet.
 */

const CollectionSelector = ({
  shopifyCollections,
  formState,
  onChange,
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

  const currentCollection = useMemo(
    () =>
      shopifyCollections?.find((col) => col.value === formState.collection?.value),
    [shopifyCollections, formState.collection?.value]
  );

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
    const selectedCollection = shopifyCollections?.find((c) => c.value === value);
    if (selectedCollection) {
      onChange("updateCollection", { collection: selectedCollection });
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

          {formState.collection?.value && !formState.collection?.priceTier && (
            <Box paddingBlockStart="200">
              <Text as="p" variant="bodyMd" tone="subdued">
                No pricing tier is linked to this collection in Shopify. Set product and
                variant pricing manually after creation.
              </Text>
              <Box paddingBlockStart="150">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Title, SEO title, variant names, and other fields that usually come from
                  collection templates are not filled by the app here yet. Plan to enter those manually until full in-app support for this collection is built.
                </Text>
              </Box>
            </Box>
          )}
        </Box>

        {showStyleControls && (
          <Box paddingBlockStart="100">
            <Text as="p" variant="bodyMd" tone="subdued">
              Choose a style for each applicable shape in the grid below.
            </Text>
          </Box>
        )}
      </BlockStack>
    </Card>
  );
};

export default CollectionSelector;
