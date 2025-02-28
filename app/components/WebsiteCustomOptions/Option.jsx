import { Card, BlockStack, Select, TextField } from "@shopify/polaris";

export function Option({ type, name, values, onUpdate }) {
  const optionTypes = [
    { label: 'Button', value: 'button' },
    { label: 'Radio Button', value: 'radio' },
    { label: 'Image Swatch', value: 'swatch' },
    { label: 'Text Field', value: 'text' },
    { label: 'Checkbox', value: 'checkbox' }
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <TextField
          label="Option name"
          value={name}
          onChange={(value) => onUpdate({ name: value })}
        />
        <Select
          label="Option type"
          options={optionTypes}
          value={type}
          onChange={(value) => onUpdate({ type: value })}
        />
        {/* Option-specific value configuration */}
      </BlockStack>
    </Card>
  );
} 