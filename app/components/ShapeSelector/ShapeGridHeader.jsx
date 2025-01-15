// app/components/ShapeSelector/ShapeGridHeader.jsx
import React from 'react';
import { InlineStack, Box, Text } from "@shopify/polaris";

const ShapeGridHeader = ({ showStyleFields, showEmbroideryFields, showColorDesignation, headerText }) => (
  <InlineStack wrap={false} gap="400" align="start">
    <Box width='250px'>
    <InlineStack wrap={false} gap="150" align="start">
      <Box width="125px">
        <Text variant="bodyMd" fontWeight="bold">Shape</Text>
      </Box>
      <Box width="105px">
        <Text variant="bodyMd" fontWeight="bold">Weight</Text>
      </Box>
    </InlineStack>
    </Box>
    {showStyleFields && (
      <Box width="200px">
        <Text variant="bodyMd" fontWeight="bold">Style</Text>
      </Box>
    )}
    {showEmbroideryFields && (
      <Box width="200px">
        <Text variant="bodyMd" fontWeight="bold">Embroidery</Text>
      </Box>
    )}
    {showColorDesignation && (
      <Box width="200px">
        <Text variant="bodyMd" fontWeight="bold">{headerText}</Text>
      </Box>
    )}
  </InlineStack>
);

export default React.memo(ShapeGridHeader);