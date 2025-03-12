import { useState } from "react";
import {
  Modal,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Select,
  Button,
  Combobox,
  Listbox,
} from "@shopify/polaris";
import { PlusIcon } from '@shopify/polaris-icons';

export default function RulesModal({ 
  isOpen, 
  onClose, 
  onSave,
  activeSet,
  getOptionValues,
  filterValues
}) {
  const [ruleName, setRuleName] = useState('');
  const [ruleConditionType, setRuleConditionType] = useState('ANY');
  const [selectedOptionType, setSelectedOptionType] = useState('manual');
  const [selectedConditionOption, setSelectedConditionOption] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('is');
  const [selectedOptionValues, setSelectedOptionValues] = useState([]);
  const [selectedActionType, setSelectedActionType] = useState('show');
  const [selectedActionOption, setSelectedActionOption] = useState('');
  const [selectedActionValues, setSelectedActionValues] = useState([]);
  const [optionValuesSearchTerm, setOptionValuesSearchTerm] = useState('');
  const [actionValuesSearchTerm, setActionValuesSearchTerm] = useState('');

  // Get operators based on the selected option
  const getOperators = () => [
    { label: 'is one of', value: 'is' },
    { label: 'is not one of', value: 'is not' },
    { label: 'is empty', value: 'is empty' },
    { label: 'is not empty', value: 'is not empty' },
  ];

  // Get selected values display text
  const getSelectedValuesText = (selectedValues, allValues) => {
    if (selectedValues.includes('all')) return 'All';
    if (selectedValues.length === 0) return 'Select values';
    
    // Get the actual selected value labels
    const selectedLabels = allValues
      .filter(value => selectedValues.includes(value.value))
      .map(value => value.label);
    
    return selectedLabels.join(', ');
  };

  const handleOptionValuesChange = (value) => {
    // Ensure we're working with an array
    const selectedValues = Array.isArray(value) ? value : [value];
    
    // If clicking "All" when it wasn't previously selected
    if (selectedValues.includes('all') && !selectedOptionValues.includes('all')) {
      setSelectedOptionValues(['all']);
      return;
    }
    
    // If clicking "All" when it was already selected, or clicking other options when "All" was selected
    if (selectedValues.includes('all') && selectedOptionValues.includes('all')) {
      setSelectedOptionValues([]);
      return;
    }
    
    // If selecting a specific value
    if (!Array.isArray(value)) {
      // Toggle the value
      const newValues = selectedOptionValues.includes(value) 
        ? selectedOptionValues.filter(v => v !== value)
        : [...selectedOptionValues, value];
      setSelectedOptionValues(newValues);
      return;
    }
    
    // Remove "all" if selecting specific values
    const filteredValues = selectedValues.filter(v => v !== 'all');
    setSelectedOptionValues(filteredValues);
  };

  const handleActionValuesChange = (value) => {
    // Ensure we're working with an array
    const selectedValues = Array.isArray(value) ? value : [value];
    
    // If clicking "All" when it wasn't previously selected
    if (selectedValues.includes('all') && !selectedActionValues.includes('all')) {
      setSelectedActionValues(['all']);
      return;
    }
    
    // If clicking "All" when it was already selected, or clicking other options when "All" was selected
    if (selectedValues.includes('all') && selectedActionValues.includes('all')) {
      setSelectedActionValues([]);
      return;
    }
    
    // If selecting a specific value
    if (!Array.isArray(value)) {
      // Toggle the value
      const newValues = selectedActionValues.includes(value) 
        ? selectedActionValues.filter(v => v !== value)
        : [...selectedActionValues, value];
      setSelectedActionValues(newValues);
      return;
    }
    
    // Remove "all" if selecting specific values
    const filteredValues = selectedValues.filter(v => v !== 'all');
    setSelectedActionValues(filteredValues);
  };

  const handleSave = () => {
    const newRule = {
      name: ruleName,
      conditionType: ruleConditionType,
      conditions: [{
        field: selectedOptionType,
        optionId: selectedConditionOption,
        operator: selectedOperator,
        values: selectedOptionValues
      }],
      action: selectedActionType,
      actionTargets: [{
        optionId: selectedActionOption,
        valueType: 'All values',
        values: selectedActionValues
      }]
    };

    onSave(newRule);
    resetForm();
  };

  const resetForm = () => {
    setRuleName('');
    setRuleConditionType('ANY');
    setSelectedOptionType('manual');
    setSelectedConditionOption('');
    setSelectedOperator('is');
    setSelectedOptionValues([]);
    setSelectedActionType('show');
    setSelectedActionOption('');
    setSelectedActionValues([]);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create Rule"
      primaryAction={{
        content: 'Save Rule',
        onAction: handleSave
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose
        }
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <TextField
            label="Rule Name"
            value={ruleName}
            onChange={(value) => setRuleName(value)}
          />
          <InlineStack gap="200">
            <Text variant="headingMd" as="h2">IF</Text>
            <Select
              label="Condition"
              labelHidden
              options={[
                { label: 'Any', value: 'ANY' },
                { label: 'All', value: 'ALL' }
              ]}
              value={ruleConditionType}
              onChange={(value) => setRuleConditionType(value)}
            />
            <Text variant="bodyMd" color="subdued">of these conditions are met</Text>
          </InlineStack>
          <InlineStack gap="200">
            <Select
              label="Option Type"
              labelHidden
              options={[
                { label: 'Manual Option', value: 'manual' }
              ]}
              value={selectedOptionType}
              onChange={(value) => setSelectedOptionType(value)}
            />
            <Select 
              label="Option"
              labelHidden
              options={[
                { label: 'Select option', value: '' },
                ...activeSet.options.map(option => ({
                  label: option.nickname || option.name,
                  value: option.id
                }))
              ]}
              value={selectedConditionOption}
              onChange={(value) => setSelectedConditionOption(value)}
            />
            <Select 
              label="Operator" 
              labelHidden
              options={getOperators()}
              value={selectedOperator}
              onChange={(value) => setSelectedOperator(value)}
            />
            <Combobox
              allowMultiple
              activator={
                <Combobox.TextField
                  label="Value"
                  labelHidden
                  value={optionValuesSearchTerm}
                  onChange={setOptionValuesSearchTerm}
                  placeholder={getSelectedValuesText(selectedOptionValues, getOptionValues(selectedConditionOption))}
                />
              }
            >
              <Listbox
                onSelect={handleOptionValuesChange}
                selected={selectedOptionValues}
                allowMultiple
              >
                {filterValues(getOptionValues(selectedConditionOption), optionValuesSearchTerm).map(({label, value}) => (
                  <Listbox.Option
                    key={value}
                    value={value}
                    selected={selectedOptionValues.includes(value)}
                  >
                    <Listbox.TextOption selected={selectedOptionValues.includes(value)}>
                      {label}
                    </Listbox.TextOption>
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox>
          </InlineStack>
          <div style={{ marginLeft: "0px" }}>
            <Button icon={PlusIcon} variant="plain" onClick={() => console.log('Add another condition')}>Add Condition</Button>
          </div>
          <InlineStack gap="200">
            <Text variant="headingMd" as="h2">THEN</Text>
            <Text variant="bodyMd" color="subdued">all of these will happen</Text>
          </InlineStack>
          <InlineStack gap="200">
            <Select 
              label="Action" 
              labelHidden
              options={[
                { label: 'Show option or values', value: 'show' },
                { label: 'Hide option or values', value: 'hide' }
              ]}
              value={selectedActionType}
              onChange={(value) => setSelectedActionType(value)}
            />
            <Select 
              label="Option" 
              labelHidden
              options={[
                { label: 'Select option', value: '' },
                ...activeSet.options.map(option => ({
                  label: option.nickname || option.name,
                  value: option.id
                }))
              ]}
              value={selectedActionOption}
              onChange={(value) => setSelectedActionOption(value)}
            />
            <Combobox
              allowMultiple
              activator={
                <Combobox.TextField
                  label="Value"
                  labelHidden
                  value={actionValuesSearchTerm}
                  onChange={setActionValuesSearchTerm}
                  placeholder={getSelectedValuesText(selectedActionValues, getOptionValues(selectedActionOption))}
                />
              }
            >
              <Listbox
                onSelect={handleActionValuesChange}
                selected={selectedActionValues}
                allowMultiple
              >
                {filterValues(getOptionValues(selectedActionOption), actionValuesSearchTerm).map(({label, value}) => (
                  <Listbox.Option
                    key={value}
                    value={value}
                    selected={selectedActionValues.includes(value)}
                  >
                    <Listbox.TextOption selected={selectedActionValues.includes(value)}>
                      {label}
                    </Listbox.TextOption>
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox>
          </InlineStack>
          <div style={{ marginLeft: "0px" }}>
            <Button icon={PlusIcon} variant="plain" onClick={() => console.log('Add another action')}>Add Action</Button>
          </div>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 