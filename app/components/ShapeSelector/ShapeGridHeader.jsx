// app/components/ShapeSelector/ShapeGridHeader.jsx
import React from 'react';
import { InlineStack, Box, Text } from "@shopify/polaris";

const ShapeGridHeader = ({ gridColumns, headerText }) => (
  <InlineStack wrap={false} gap="400" align="start">
    {gridColumns.map(column => {
      switch(column.id) {
        case 'shape':
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold" alignment="center">Shape</Text>
            </Box>
          );
        case 'images':
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold" alignment="center">Images</Text>
            </Box>
          );
        case 'style':
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold" alignment="center">Style</Text>
            </Box>
          );
        case 'colorDesignation':
          /**
           * Tooltip removed: the inline leather phrase shown next to the dropdown
           * (e.g. ": Diamonds are", ": Fat Middle is") already explains the field, so the
           * `?` icon was redundant.
           */
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold" alignment="center">{headerText}</Text>
            </Box>
          );
        default:
          return null;
      }
    })}
  </InlineStack>
);

export default React.memo(ShapeGridHeader);