import React from 'react';
import { Select } from "@shopify/polaris";

const CollectionSelector = ({ shopifyCollections, selectedCollection, onChange }) => {
  const options = [    
    { label: 'Select a collection...', value: '' }, 
    ...(shopifyCollections ? shopifyCollections.map(collection => ({
      label: collection.label || collection.title,
      value: collection.value || collection.id
    })) : [])
  ];

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