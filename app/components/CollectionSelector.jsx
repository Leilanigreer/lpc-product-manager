import React, { useMemo } from 'react';
import { Select, Card, InlineStack, Box, Text } from "@shopify/polaris";

/**
 * @typedef {Object} Collection
 * @property {string} value - Collection ID
 * @property {string} label - Display name
 * @property {string} title - Collection title
 * @property {boolean} showInDropdown - Whether to show in selector
 * @property {Array<Style>} styles - Available styles for collection
 */

/**
 * @typedef {Object} Style
 * @property {string} id - Style ID
 * @property {string} label - Display name
 * @property {boolean} stylePerShape - Whether style applies per shape
 * @property {Object} validation - Style-specific validation rules
 */

/**
 * Collection selector component with optional style selection
 * @component
 * @param {Object} props - Component props
 * @param {Array<Collection>} props.shopifyCollections - Available Shopify collections
 * @param {string} props.selectedCollection - Currently selected collection ID
 * @param {string} props.selectedStyle - Currently selected style ID
 * @param {Function} props.onChange - Callback for collection/style changes
 * @param {Function} props.onCollectionChange - Additional collection change handler
 * @param {boolean} props.needsStyle - Whether style selection is required
 * @returns {React.ReactElement} Rendered component
 */
const CollectionSelector = ({ 
  shopifyCollections, 
  selectedCollection, 
  selectedStyle,
  onChange, 
  onCollectionChange, 
  needsStyle 
}) => {
  /**
   * Filter and format collection options
   * @type {Array<{label: string, value: string}>}
   */
  const collectionOptions = [    
    { label: 'Select a collection...', value: '' }, 
    ...(shopifyCollections?.filter(c => c.showInDropdown)?.map(collection => ({
      label: collection.label || collection.title,
      value: collection.value || collection.id
    })) || [])
  ];

  /**
   * Get current collection object
   * @type {Collection|undefined}
   */
  const currentCollection = useMemo(() => 
    shopifyCollections?.find(col => col.value === selectedCollection),
    [shopifyCollections, selectedCollection]
  );

  /**
   * Generate style options for current collection
   * @type {Array<{label: string, value: string}>}
   */
  const styleOptions = useMemo(() => {
    if (!currentCollection?.styles) return [];
    
    return [
      { label: 'Select a style...', value: '' },
      { label: 'Independent for each shape', value: 'independent' },
      ...currentCollection.styles.map(style => ({
        label: style.label,
        value: style.id
      }))
    ];
  }, [currentCollection]);

  /**
   * Handle collection selection change
   * @param {string} value - Selected collection ID
   */
  const handleCollectionChange = (value) => {
    onCollectionChange(value);
    onChange('selectedCollection', value);
  };

  /**
   * Handle style selection change
   * @param {string} value - Selected style ID
   */
  const handleStyleChange = (value) => {
    onChange('selectedStyle', value);
  };

  return (
    <Card>
      <InlineStack gap="400" align="start" wrap={false}>
        <Box width={needsStyle ? "50%" : "100%"}>
          <Text as="h2" variant="headingMd">Collection</Text>
          <Box paddingBlockStart="200">
            <Select
              label="Select a collection"
              options={collectionOptions}
              onChange={handleCollectionChange}
              value={selectedCollection || ''}
            />
          </Box>
        </Box>

        {needsStyle && selectedCollection && (
          <Box width="50%">
            <Text as="h2" variant="headingMd">Style</Text>
            <Box paddingBlockStart="200">
              <Select
                label="Select a style"
                options={styleOptions}
                onChange={handleStyleChange}
                value={selectedStyle || ''}
              />
            </Box>
          </Box>
        )}
      </InlineStack>
    </Card>
  );
};

export default React.memo(CollectionSelector);