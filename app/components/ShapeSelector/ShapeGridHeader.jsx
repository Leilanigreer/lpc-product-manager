// app/components/ShapeSelector/ShapeGridHeader.jsx
// Header component for the shape grid
import React from 'react';
import { InlineStack, Box, Text } from "@shopify/polaris";

export const ShapeGridHeader = ({ showStyle, showQClassicField }) => (
  <InlineStack wrap={false} gap="400" align="start">
    <Box width="200px">
      <Text variant="bodyMd" fontWeight="bold">Shape</Text>
    </Box>
    {showStyle && (
      <>
        <Box width="200px">
          <Text variant="bodyMd" fontWeight="bold">Style</Text>
        </Box>
        <Box width="200px">
          <Text variant="bodyMd" fontWeight="bold">Embroidery</Text>
        </Box>
        {showQClassicField && (
          <Box width="200px">
            <Text variant="bodyMd" fontWeight="bold">Quilted Leather</Text>
          </Box>
        )}
      </>
    )}
    <Box width="150px">
      <Text variant="bodyMd" fontWeight="bold">Weight</Text>
    </Box>
  </InlineStack>
);