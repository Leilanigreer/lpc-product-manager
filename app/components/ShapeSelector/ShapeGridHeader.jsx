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
              <Text variant="bodyMd" fontWeight="bold">Shape</Text>
            </Box>
          );
        case 'images':
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold">Images</Text>
            </Box>
          );
        case 'style':
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold">Style</Text>
            </Box>
          );
        case 'styleDetails':
          /** Putter-only header that sits above the vertical Style / Phrase / Named Leather stack
           *  rendered inside each putter row (see `ShapeRow.useStackedDetailsLayout`). */
          return (
            <Box key={column.id} width={column.width}>
              <Text variant="bodyMd" fontWeight="bold">Style Details</Text>
            </Box>
          );
        case 'leatherPhrase':
          /** Empty header — the column holds a contextual phrase that visually bridges Style and
           *  Named Leather; it doesn't carry an independent label of its own. */
          return <Box key={column.id} width={column.width} />;
        case 'colorDesignation':
          /** Tooltip removed: the inline leather phrase column already explains the field. */
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