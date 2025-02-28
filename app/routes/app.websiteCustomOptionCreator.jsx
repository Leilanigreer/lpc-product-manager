import { useState } from "react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  Select,
  TextField,
  Checkbox,
} from "@shopify/polaris";

function Option({ type, name, values, nickname, required, description, minValues, maxValues, onUpdate }) {
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
          helpText="Visible to customers"
          onChange={(value) => onUpdate({ name: value })}
        />
        <Select
          label="Option type"
          options={optionTypes}
          value={type}
          onChange={(value) => onUpdate({ type: value })}
        />
        <TextField
          label="Option values"
          value={values}
          multiline={3}
          onChange={(value) => onUpdate({ values: value })}
        />
        <Button variant="primary" onClick={() => onUpdate({ values: values ? `${values}\n` : '' })}>
          Add another value
        </Button>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="bodyMd">Additional Settings</Text>
            
            <TextField
              label="Option nickname"
              helpText="Only visible to you"
              value={nickname}
              onChange={(value) => onUpdate({ nickname: value })}
            />
            
            <Checkbox
              label="Required"
              checked={required}
              onChange={(checked) => onUpdate({ required: checked })}
            />

            <TextField
              label="Option description"
              helpText="Visible to customers"
              value={description}
              multiline={2}
              onChange={(value) => onUpdate({ description: value })}
            />

            <TextField
              label="Minimum selectable values"
              type="number"
              value={minValues}
              onChange={(value) => onUpdate({ minValues: value })}
            />

            <TextField
              label="Maximum selectable values" 
              type="number"
              value={maxValues}
              onChange={(value) => onUpdate({ maxValues: value })}
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </Card>
  );
}

export default function OptionsPage() {
  const [options, setOptions] = useState({
    type: 'button',
    name: '',
    values: '',
    nickname: '',
    required: false,
    description: '',
    minValues: '',
    maxValues: ''
  });

  const handleOptionUpdate = (updates) => {
    setOptions(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <Page>
      <TitleBar title="Product Options" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Create Custom Option
              </Text>
              <Option
                {...options}
                onUpdate={handleOptionUpdate}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 