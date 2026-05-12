// app/components/ShapeSelector/ShapeGridHeader.jsx
import React from 'react';
import { InlineStack, Box, Text } from "@shopify/polaris";
import FieldTooltip from '../FieldTooltip';

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
          return (
            <Box key={column.id} width={column.width}>
              <InlineStack wrap={false} gap="100" align="center" blockAlign="center">
                <Text variant="bodyMd" fontWeight="bold">{headerText}</Text>
                <FieldTooltip content={headerText.includes('Quilted')
                      ? "The quilted leather pattern used for this shape"
                      : "The leather of the stripes or the color that is variable"
                    } />
              </InlineStack>
            </Box>
          );
        default:
          return null;
      }
    })}
  </InlineStack>
);

export default React.memo(ShapeGridHeader);