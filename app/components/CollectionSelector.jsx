import React from 'react';
import { Select } from "@shopify/polaris";

const CollectionSelector = ({ shopifyCollections, selectedCollection, onChange }) => {
  // console.log(shopifyCollections);

  const options = shopifyCollections ? shopifyCollections.map(collection => ({
    label: collection.label || collection.title, // Use label if exists, fall back to title
    value: collection.value || collection.id     // Use value if exists, fall back to id
  })) : [];

  // console.log('Collection Options:', options); // Debug log

  return (
    <Select
      label="Select a collection"
      options={options}
      onChange={onChange}
      value={selectedCollection || ''}
    />
  );
};

export default CollectionSelector;