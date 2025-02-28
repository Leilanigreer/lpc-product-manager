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
              <InlineStack wrap={false} gap="150" align="start">
                <Box width="125px">
                  <Text variant="bodyMd" fontWeight="bold">Shape</Text>
                </Box>
                <Box width="105px">
                  <Text variant="bodyMd" fontWeight="bold">Weight</Text>
                </Box>
              </InlineStack>
            </Box>
          );
        case 'style':
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold">Style</Text>
            </Box>
          );
        case 'embroidery':
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold">Embroidery</Text>
            </Box>
          );
        case 'colorDesignation':
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold">{headerText}</Text>
            </Box>
          );
        default:
          return null;
      }
    })}
  </InlineStack>
);

export default React.memo(ShapeGridHeader);