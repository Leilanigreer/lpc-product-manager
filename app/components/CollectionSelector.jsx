// app/components/CollectionSelector.jsx

import React from 'react';
import { Select, Card } from "@shopify/polaris";

const CollectionSelector = ({ shopifyCollections, selectedCollection, onChange, onCollectionChange }) => {
  const options = [    
    { label: 'Select a collection...', value: '' }, 
    ...(shopifyCollections ? shopifyCollections.map(collection => ({
      label: collection.label || collection.title,
      value: collection.value || collection.id
    })) : [])
  ];

  const handleChange = (value) => {
    onChange('selectedCollection', value);
    onCollectionChange(value);
  };

  return (
    <Card>
      <Select
        label="Select a collection"
        options={options}
        onChange={handleChange}
        value={selectedCollection || ''}
      />
    </Card>
  );
};

export default React.memo(CollectionSelector);