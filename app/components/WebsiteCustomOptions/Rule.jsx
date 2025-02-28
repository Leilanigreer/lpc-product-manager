import { Card, BlockStack, Select } from "@shopify/polaris";

export function Rule({ conditions, actions, onUpdate }) {
  return (
    <Card>
      <BlockStack gap="400">
        <Select
          label="If"
          options={[
            { label: 'All', value: 'all' },
            { label: 'Any', value: 'any' }
          ]}
        />
        {/* Condition builder */}
        {/* Action builder */}
      </BlockStack>
    </Card>
  );
} 