// app/components/ShapeSelector/fields/LeatherPhrase.jsx
//
// Contextual leather phrase rendered between the Style and Named Leather columns
// (e.g. ": Diamonds are", ": Fat Middle is"). Previously this was rendered inside
// `ColorDesignation` and ate into the same column as the Named Leather dropdown, which made the
// dropdown shift away from its header. Splitting it into its own fixed-width column keeps both
// `Style` and `Named Leather` cleanly aligned with their headers.
//
// Visibility is paired with `colorDesignation` — both share the `showColorDesignation` flag in
// `ShapeGrid`, so the phrase column never appears alone.

import React from 'react';
import { Box, Text } from "@shopify/polaris";

const LeatherPhrase = ({ shape, formState }) => {
  const shapeState = formState.allShapes[shape.value];
  const rawPhrase = shapeState?.style?.leatherPhrase;
  const phrase =
    typeof rawPhrase === "string" && rawPhrase.trim().length > 0
      ? rawPhrase.trim()
      : null;

  if (!phrase) return null;

  return (
    <Box paddingBlockStart="200">
      <Text as="span" variant="bodyMd" tone="subdued">
        {phrase}
      </Text>
    </Box>
  );
};

export default React.memo(LeatherPhrase);
