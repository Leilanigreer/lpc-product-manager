// app/components/ShapeSelector/fields/LeatherPhrase.jsx
//
// Contextual leather phrase rendered between the Style and Named Leather rows of the stacked
// "Style Details" column (e.g. ": Diamonds are", ": Fat Middle is"). Previously this was rendered
// inside `ColorDesignation` and ate into the same column as the Named Leather dropdown, which made
// the dropdown shift away from its header.
//
// Visibility is paired with `colorDesignation` — both share the `showColorDesignation` flag in
// `ShapeGrid`, so the phrase never appears alone.
//
// Vertical rhythm is owned entirely by the parent `BlockStack` (`gap="200"`); this component
// renders a plain inline `<Text>` with no internal padding so the gaps above and below it stay
// equal to the Phrase → Named Leather gap.

import React from 'react';
import { Text } from "@shopify/polaris";

const LeatherPhrase = ({ shape, formState }) => {
  const shapeState = formState.allShapes[shape.value];
  const rawPhrase = shapeState?.style?.leatherPhrase;
  const phrase =
    typeof rawPhrase === "string" && rawPhrase.trim().length > 0
      ? rawPhrase.trim()
      : null;

  if (!phrase) return null;

  return (
    <Text as="span" variant="bodyMd" tone="subdued">
      {phrase}
    </Text>
  );
};

export default React.memo(LeatherPhrase);
