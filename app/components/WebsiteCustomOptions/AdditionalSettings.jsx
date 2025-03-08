import { useState } from "react";
import {
  Card,
  Text,
  BlockStack,
  TextField,
  Checkbox,
  Combobox,
  Tag,
} from "@shopify/polaris";

export default function AdditionalSettings({ 
  type, 
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
  optionLayouts,
  optionTags = []
}) {
  // Find the layout settings for the current option type
  const currentLayout = optionLayouts.find(layout => layout.type === type) || {};

  const [selectedTags, setSelectedTags] = useState(tags);
  const [tagInputValue, setTagInputValue] = useState('');
  const [availableTags, setAvailableTags] = useState(optionTags);

  const updateTags = (newTags) => {
    setSelectedTags(newTags);
    onUpdate({ tags: newTags });
  };

  const handleTagRemove = (tagToRemove) => {
    updateTags(selectedTags.filter(tag => tag.value !== tagToRemove.value));
  };

  const handleTagAdd = (tag) => {
    if (!selectedTags.find(t => t.value === tag.value)) {
      updateTags([...selectedTags, tag]);
    }
    setTagInputValue('');
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Additional Settings</Text>
        
        {/* Tags Section */}
        <div>
          <Text as="h3" variant="headingSm">Tags</Text>
          <div style={{ marginTop: '4px' }}>
            <Combobox
              activator={
                <Combobox.TextField
                  label="Tags"
                  labelHidden
                  value={tagInputValue}
                  onChange={setTagInputValue}
                  placeholder="Search or add tags"
                />
              }
            >
              {availableTags
                .filter(tag => 
                  tag.label.toLowerCase().includes(tagInputValue.toLowerCase()) &&
                  !selectedTags.find(t => t.value === tag.value)
                )
                .map((tag) => (
                  <Combobox.Option
                    key={tag.value}
                    value={tag.value}
                    selected={selectedTags.some(t => t.value === tag.value)}
                    onClick={() => handleTagAdd(tag)}
                  >
                    {tag.label}
                  </Combobox.Option>
                ))
              }
            </Combobox>
          </div>
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {selectedTags.map((tag) => (
              <Tag key={tag.value} onRemove={() => handleTagRemove(tag)}>
                {tag.label}
              </Tag>
            ))}
          </div>
        </div>
        
        {currentLayout.nickname && (
          <TextField
            label="Option nickname"
            helpText="Only visible to you"
            value={nickname}
            onChange={(value) => onUpdate({ nickname: value })}
          />
        )}
        
        {currentLayout.required && (
          <Checkbox
            label="Required"
            checked={required}
            onChange={(checked) => onUpdate({ required: checked })}
          />
        )}

        {currentLayout.description && (
          <TextField
            label="Option description"
            helpText="Visible to customers"
            value={description}
            multiline={2}
            onChange={(value) => onUpdate({ description: value })}
          />
        )}

        {currentLayout.inCartName && (
          <TextField
            label="In cart name"
            value={inCartName}
            onChange={(value) => onUpdate({ inCartName: value })}
          />
        )}

        {currentLayout.allowedTypes && (
          <TextField
            label="Allowed file types"
            value={allowedTypes}
            onChange={(value) => onUpdate({ allowedTypes: value })}
          />
        )}

        {currentLayout.minSelectable && (
          <TextField
            label="Minimum selectable values"
            type="number"
            value={minSelectable}
            onChange={(value) => onUpdate({ minSelectable: value })}
          />
        )}

        {currentLayout.maxSelectable && (
          <TextField
            label="Maximum selectable values" 
            type="number"
            value={maxSelectable}
            onChange={(value) => onUpdate({ maxSelectable: value })}
          />
        )}

        {currentLayout.allowMultipleSelections && (
          <Checkbox
            label="Allow multiple selections"
            checked={allowMultipleSelections}
            onChange={(checked) => onUpdate({ allowMultipleSelections: checked })}
          />
        )}

        {currentLayout.placeholderText && (
          <TextField
            label="Placeholder text"
            value={placeholderText}
            onChange={(value) => onUpdate({ placeholderText: value })}
          />
        )}

        {currentLayout.minCharLimit && (
          <TextField
            label="Minimum character limit"
            type="number"
            value={minCharLimit}
            onChange={(value) => onUpdate({ minCharLimit: value })}
          />
        )}

        {currentLayout.maxCharLimit && (  
          <TextField
            label="Maximum character limit"
            type="number"
            value={maxCharLimit}
            onChange={(value) => onUpdate({ maxCharLimit: value })}
          />
        )}

        {currentLayout.minNumber && (
          <TextField
            label="Minimum number"
            type="number"
            value={minNumber}
            onChange={(value) => onUpdate({ minNumber: value })}
          />
        )}

        {currentLayout.maxNumber && (
          <TextField
            label="Maximum number"
            type="number"
            value={maxNumber}
            onChange={(value) => onUpdate({ maxNumber: value })}
          />
        )}       
      </BlockStack>
    </Card>
  );
} 