import React, { useMemo } from 'react';
import { Select, Card, Box, Text } from "@shopify/polaris";

/**
 * Collection selection for create-product.
 *
 * Collection objects (including `styles[]` from the loader) are passed through; shape/style
 * choices happen in the grid elsewhere.
 *
 * @param {Object} props
 * @param {Array} props.shopifyCollections - Collections from the loader
 * @param {Object} props.formState - Current form state
 * @param {Function} props.onChange - Form dispatch; uses `updateCollection` with `{ collection }`.
 *   Each collection may include `versioningSkus` from the loader (base SKUs + raw GraphQL pages);
 *   Preview still refetches via API and falls back to loader data when the API payload is empty.
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

  const handleCollectionChange = (value) => {
    const selectedCollection = shopifyCollections?.find((c) => c.value === value);
    if (selectedCollection) {
      onChange("updateCollection", { collection: selectedCollection });
    }
  };

  return (
    <Card>
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
    </Card>
  );
};

export default CollectionSelector;
