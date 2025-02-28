import { Card, BlockStack, TextField, Select, RadioButton } from "@shopify/polaris";

export function OptionSet({ title, rank, collection, onUpdate }) {
  return (
    <Card>
      <BlockStack gap="400">
        <TextField
          label="Option set title"
          value={title}
          onChange={(value) => onUpdate({ title: value })}
        />
        <TextField
          label="Rank"
          type="number"
          value={rank}
          onChange={(value) => onUpdate({ rank: value })}
        />
        {/* Collection selector etc */}
      </BlockStack>
    </Card>
  );
} 