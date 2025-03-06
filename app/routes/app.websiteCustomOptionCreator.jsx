import { useState } from "react";
import { useLoaderData, useSearchParams } from "@remix-run/react";
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
  InlineStack,
} from "@shopify/polaris";
import {
  DeleteIcon,
  DragHandleIcon,
} from '@shopify/polaris-icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { loader as rootLoader } from "../lib/loaders/index.js";
import { getOptionTypeChoices, getOptionTypeDisplayName } from "../lib/utils/optionTypeMapping.js";

export const loader = async () => {
  const { optionLayouts } = await rootLoader();
  return { optionLayouts };
};

function SortableItem({ id, children, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Button icon={DragHandleIcon} {...listeners} />
          {process.env.NODE_ENV === 'development' && (
            <Text as="span" variant="bodySm" color="subdued">#{index + 1}</Text>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function OptionValues({ 
  type, 
  optionValues, 
  onUpdate,
  optionLayouts,
  productIdType 
}) {
  const [optionRows, setOptionRows] = useState([
    { 
      id: '1', 
      name: '', 
      default: false, 
      displayOrder: 0,
      imageUrl: '',
      color: '',
      associatedProductId: '' 
    }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setOptionRows((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        // Update displayOrder after reordering
        const updatedItems = reorderedItems.map((item, index) => ({
          ...item,
          displayOrder: index
        }));
        onUpdate(updatedItems);
        return updatedItems;
      });
    }
  };

  const handleValueUpdate = (id, updates) => {
    setOptionRows(prev => {
      const updatedRows = prev.map(row =>
        row.id === id ? { ...row, ...updates } : row
      );
      onUpdate(updatedRows);
      return updatedRows;
    });
  };

  const addNewRow = () => {
    setOptionRows(prev => {
      const newRows = [
        ...prev,
        { 
          id: String(Date.now()), 
          name: '', 
          default: false, 
          displayOrder: prev.length,
          imageUrl: '',
          color: '',
          associatedProductId: '' 
        }
      ];
      onUpdate(newRows);
      return newRows;
    });
  };

  const deleteRow = (idToDelete) => {
    if (optionRows.length <= 1) return;
    setOptionRows(prev => {
      const newRows = prev.filter(row => row.id !== idToDelete)
        .map((row, index) => ({
          ...row,
          displayOrder: index
        }));
      onUpdate(newRows);
      return newRows;
    });
  };

  // Find the current layout settings
  const currentLayout = optionLayouts.find(layout => layout.type === type) || {};

  // If none of the relevant fields are enabled, don't render anything
  if (!currentLayout.optionValues && !currentLayout.image && 
      !currentLayout.color && !currentLayout.associatedProductId) {
    return null;
  }

  return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Option Values</Text>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={optionRows}
              strategy={verticalListSortingStrategy}
            >
              {optionRows.map((row, index) => (
                <SortableItem key={row.id} id={row.id} index={index}>
                  <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
                    {/* Option Value Name - controlled by optionValues */}
                    {currentLayout.optionValues && (
                      <div style={{ flex: 2 }}>
                        <TextField
                          label="Value"
                          value={row.name}
                          onChange={(value) => handleValueUpdate(row.id, { name: value })}
                          labelHidden
                        />
                      </div>
                    )}

                    {/* Image Upload - controlled by image */}
                    {currentLayout.image && (
                      <div style={{ flex: 2 }}>
                        <TextField
                          label="Image URL"
                          value={row.imageUrl}
                          onChange={(value) => handleValueUpdate(row.id, { imageUrl: value })}
                          labelHidden
                          helpText="Image upload coming soon"
                        />
                      </div>
                    )}

                    {/* Color Picker - controlled by color */}
                    {currentLayout.color && (
                      <div style={{ flex: 2 }}>
                        <TextField
                          label="Color"
                          value={row.color}
                          onChange={(value) => handleValueUpdate(row.id, { color: value })}
                          labelHidden
                          helpText="Color picker coming soon"
                        />
                      </div>
                    )}

                    {/* Associated Product ID - only shown when type is independent */}
                    {currentLayout.associatedProductId && productIdType === 'independent' && (
                      <div style={{ flex: 2 }}>
                        <TextField
                          label="Product ID"
                          value={row.associatedProductId}
                          onChange={(value) => handleValueUpdate(row.id, { associatedProductId: value })}
                          labelHidden
                        />
                      </div>
                    )}

                    {/* Default Checkbox - controlled by optionValues */}
                    {currentLayout.optionValues && (
                      <Checkbox
                        label="Default"
                        checked={row.default}
                        onChange={(checked) => handleValueUpdate(row.id, { default: checked })}
                      />
                    )}

                    {/* Delete Button - controlled by optionValues */}
                    {currentLayout.optionValues && (
                      <Button
                        icon={DeleteIcon}
                        onClick={() => deleteRow(row.id)}
                        variant="critical"
                        disabled={optionRows.length <= 1}
                      />
                    )}
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>

          {/* Add Value Button - controlled by optionValues */}
          {currentLayout.optionValues && (
            <div style={{ paddingTop: '1rem' }}>
              <Button onClick={addNewRow}>Add another value</Button>
            </div>
          )}
        </BlockStack>
      </Card>
  );
}

function AdditionalSettings({ 
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
  onUpdate, 
  optionLayouts 
}) {
  // Find the layout settings for the current option type
  const currentLayout = optionLayouts.find(layout => layout.type === type) || {};

  return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Additional Settings</Text>
          
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

function Option({ 
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
  onUpdate 
}) {
  const { optionLayouts = [] } = useLoaderData();
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
      {/* Main Option Settings */}
      <Layout.Section>
        <BlockStack gap="400">

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Create Custom Option</Text>
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
                  <div style={{ flex: 1 }}>
                    <Select
                      label="Product ID Type"
                      options={productIdTypeOptions}
                      value={productIdType}
                      onChange={handleProductIdTypeChange}
                      />
                  </div>
                  {productIdType === 'universal' && (
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
          onUpdate={onUpdate}
          optionLayouts={optionLayouts}
        />
      </Layout.Section>



    </>
  );
}

export default function OptionsPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || '';
  
  const [options, setOptions] = useState({
    type: initialType,
    name: '',
    values: [],
    nickname: '',
    required: false,
    description: '',
    minSelectable: '',
    maxSelectable: '',
    inCartName: '',
    allowedTypes: '',
    allowMultipleSelections: false,
    placeholderText: '',
    minCharLimit: '',
    maxCharLimit: '',
    minNumber: ''
  });

  const handleOptionUpdate = (updates) => {
    setOptions(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <Page fullWidth>
      <TitleBar title="Product Options" />
      <Layout>
        <Option
          {...options}
          onUpdate={handleOptionUpdate}
        />
      </Layout>
    </Page>
  );
} 