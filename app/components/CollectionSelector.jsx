import React from 'react';
import { Select } from "@shopify/polaris";

const CollectionSelector = ({ collections, selectedCollection, onChange }) => {
  return (
    <Select
      label="Select a collection"
      options={collections}
      onChange={onChange}
      value={selectedCollection}
    />
  );
};

export default CollectionSelector;