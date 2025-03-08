import { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import {
  Layout,
  Card,
  Text,
  BlockStack,
  TextField,
  Select,
  Checkbox,
} from "@shopify/polaris";
import { getOptionTypeChoices, getOptionTypeDisplayName } from "../../lib/utils/optionTypeMapping.js";
import OptionValues from "./OptionValues.jsx";
import AdditionalSettings from "./AdditionalSettings.jsx";

export default function Option({ 
  type, 
  name, 
  values, 
  nickname, 
  required, 
  description,
  minSelectable,
  maxSelectable,
  inCartName,
  allowedTypes,
  allowMultipleSelections,
  placeholderText,
  minCharLimit,
  maxCharLimit,
  minNumber,
  maxNumber,
  tags = [],
  onUpdate,
  isEditing = false
}) {
  const { optionLayouts = [], optionTags = [] } = useLoaderData();
  const currentLayout = optionLayouts.find(layout => layout.type === type) || {};
  
  const handleOptionValuesUpdate = (newValues) => {
    onUpdate({ values: newValues });
  };

  const [productIdType, setProductIdType] = useState('none');
  const productIdTypeOptions = [
    { label: 'None', value: 'none' },
    { label: 'Universal', value: 'universal' },
    { label: 'Independent', value: 'independent' }
  ];

  const handleProductIdTypeChange = (value) => {
    setProductIdType(value);
    // Clear all associated product IDs when switching types
    if (value === 'none') {
      const updatedValues = values?.map(v => ({
        ...v,
        associatedProductId: ''
      })) || [];
      onUpdate({ values: updatedValues });
    }
  };

  const optionTypes = optionLayouts.length > 0 
    ? [...new Set(optionLayouts.map(layout => layout.type))].map(type => ({
        label: getOptionTypeDisplayName(type),
        value: type
      }))
    : getOptionTypeChoices();

  return (
    <>
      <Layout.Section>
        <BlockStack gap="400">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {isEditing ? 'Edit Custom Option' : 'Create Custom Option'}
              </Text>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Option name"
                    value={name}
                    helpText="Visible to customers"
                    onChange={(value) => onUpdate({ name: value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Select
                    label="Option type" 
                    options={optionTypes}
                    value={type}
                    onChange={(value) => onUpdate({ type: value })}
                    disabled={isEditing} // Disable type change when editing
                  />
                </div>
              </div>
            </BlockStack>
          </Card>

          {/* Associated Product ID Section */}
          {currentLayout.associatedProductId && (
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Associated Product ID</Text>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {currentLayout.optionValues && (
                    <div style={{ flex: 1 }}>
                      <Select
                        label="Product ID Type"
                        options={productIdTypeOptions}
                        value={productIdType}
                        onChange={handleProductIdTypeChange}
                      />
                    </div>
                  )}
                  {(productIdType === 'universal' || !currentLayout.optionValues) && (
                    <div style={{ flex: 1 }}>
                      <TextField
                        label="Universal Product ID"
                        value={values?.[0]?.associatedProductId || ''}
                        onChange={(value) => {
                          const updatedValues = values?.map(v => ({
                            ...v,
                            associatedProductId: value
                          })) || [];
                          onUpdate({ values: updatedValues });
                        }}
                        helpText="This ID will be applied to all option values"
                      />
                    </div>
                  )}
                </div>
              </BlockStack>
            </Card>
          )}

          {/* Option Values Section */}
          {currentLayout.optionValues && (
            <OptionValues
              type={type}
              optionValues={values}
              onUpdate={handleOptionValuesUpdate}
              optionLayouts={optionLayouts}
              productIdType={productIdType}
            />
          )}
        </BlockStack>
      </Layout.Section>

      {/* Additional Settings */}
      <Layout.Section variant="oneThird">
        <AdditionalSettings
          type={type}
          nickname={nickname}
          required={required}
          description={description}
          minSelectable={minSelectable}
          maxSelectable={maxSelectable}
          inCartName={inCartName}
          allowedTypes={allowedTypes}
          allowMultipleSelections={allowMultipleSelections}
          placeholderText={placeholderText}
          minCharLimit={minCharLimit}
          maxCharLimit={maxCharLimit}
          minNumber={minNumber}
          maxNumber={maxNumber}
          tags={tags}
          onUpdate={onUpdate}
          optionLayouts={optionLayouts}
          optionTags={optionTags}
        />
      </Layout.Section>
    </>
  );
} 