import { useState, useEffect } from "react";
import { useLoaderData, useSearchParams, useSubmit, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
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
  ColorPicker,
  DropZone,
  Spinner,
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
import { createCustomOption } from "../lib/server/websiteCustomization.server.js";
import { preventWheelChange } from "../styles/shared/inputs";

export const loader = async () => {
  const { optionLayouts } = await rootLoader();
  return { optionLayouts };
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  
  console.log('=== FORM SUBMISSION START ===');
  console.log('Raw form data:', data);
  
  try {
    // Parse the values array from the form data
    const values = data.values ? JSON.parse(data.values) : [];
    console.log('Parsed values:', values);
    
    // Get the layout ID based on the type
    const { optionLayouts } = await rootLoader();
    console.log('Available layouts:', optionLayouts);
    
    if (!optionLayouts || !Array.isArray(optionLayouts)) {
      throw new Error('Failed to load option layouts');
    }

    const layout = optionLayouts.find(l => l.type === data.type);
    console.log('Found layout for type:', data.type, layout);
    
    if (!layout) {
      throw new Error(`No layout found for type: ${data.type}`);
    }

    // Clean up the data before sending to createCustomOption
    const cleanedData = {
      name: data.name,
      type: data.type,
      layoutId: layout.id,
      required: data.required === 'true',
      // Only include values if the layout supports them and we have values
      ...(layout.optionValues && data.values ? {
        values: JSON.parse(data.values).map(v => ({
          name: v.name,
          displayOrder: v.displayOrder || 0,
          default: v.default || false,
          associatedProductId: v.associatedProductId || null,
          imageUrl: v.imageUrl || null
        }))
      } : {}),
      // Optional fields - only include if they have values and are supported by the layout
      ...(layout.nickname && data.nickname && { nickname: data.nickname }),
      ...(layout.description && data.description && { description: data.description }),
      ...(layout.inCartName && data.inCartName && { inCartName: data.inCartName }),
      ...(layout.allowedTypes && data.allowedTypes && { allowedTypes: data.allowedTypes }),
      ...(layout.minSelectable && data.minSelectable && { minSelectable: data.minSelectable }),
      ...(layout.maxSelectable && data.maxSelectable && { maxSelectable: data.maxSelectable }),
      ...(layout.allowMultipleSelections && data.allowMultipleSelections === 'true' && { allowMultipleSelections: true }),
      ...(layout.placeholderText && data.placeholderText && { placeholderText: data.placeholderText }),
      ...(layout.minCharLimit && data.minCharLimit && { minCharLimit: data.minCharLimit }),
      ...(layout.maxCharLimit && data.maxCharLimit && { maxCharLimit: data.maxCharLimit }),
      ...(layout.minNumber && data.minNumber && { minNumber: data.minNumber }),
      ...(layout.maxNumber && data.maxNumber && { maxNumber: data.maxNumber })
    };

    console.log('Cleaned data being sent to createCustomOption:', cleanedData);

    // Create the option with layout ID
    const option = await createCustomOption(cleanedData);

    console.log('Successfully created option:', option);
    return json({ option });
  } catch (error) {
    console.error('Error in action:', error);
    return json({ 
      error: error.message,
      details: error.stack
    }, { status: 400 });
  }
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
  const [uploadingImages, setUploadingImages] = useState(new Set());
  const [optionRows, setOptionRows] = useState(() => {
    // Initialize with optionValues if provided, otherwise create default row
    return optionValues?.length > 0 ? optionValues : [{
      id: '1', 
      name: '', 
      default: false, 
      displayOrder: 0,
      imageUrl: '', // Will be Cloudinary URL later
      tempImageUrl: '', // Local preview URL
      file: null,
      color: {
        hue: 0,
        brightness: 1,
        saturation: 1
      },
      associatedProductId: ''
    }];
  });

  // Update optionRows when optionValues prop changes
  useEffect(() => {
    // If optionValues is empty array or null/undefined, reset to default state
    if (!optionValues || optionValues.length === 0) {
      setOptionRows([{
        id: '1', 
        name: '', 
        default: false, 
        displayOrder: 0,
        imageUrl: '',
        tempImageUrl: '',
        file: null,
        color: {
          hue: 0,
          brightness: 1,
          saturation: 1
        },
        associatedProductId: ''
      }]);
    } else {
      setOptionRows(optionValues);
    }
  }, [optionValues]);

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
          tempImageUrl: '',
          file: null,
          color: {
            hue: 0,
            brightness: 1,
            saturation: 1
          },
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

  const handleDropZoneChange = async (files, id) => {
    const file = files[0];
    if (!file) return;

    // For now, just show local preview
    const tempImageUrl = URL.createObjectURL(file);
    
    // Update with local preview only
    handleValueUpdate(id, {
      tempImageUrl,
      file
    });

    // Commenting out Cloudinary upload for now
    /* try {
      setUploadingImages(prev => new Set(prev).add(id));
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-swatch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();

      handleValueUpdate(id, {
        imageUrl: url,
        tempImageUrl: '',
        file: null
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingImages(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } */
  };

  // Find the current layout settings
  const currentLayout = optionLayouts.find(layout => layout.type === type) || {CHECKBOX: true};

  // If none of the relevant fields are enabled, don't render anything
  if (!currentLayout.optionValues && !currentLayout.image && 
      !currentLayout.color && !currentLayout.associatedProductId) {
    return null;
  }

  return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Option Values</Text>
          
          {/* Column Headers */}
          <div style={{ display: 'flex', gap: '1rem', paddingLeft: '44px' }}>
            {currentLayout.image && (
              <div style={{ flex: 2 }}>
                <Text as="p" variant="bodyMd">Image</Text>
              </div>
            )}
            {currentLayout.color && (
              <div style={{ flex: 2 }}>
                <Text as="p" variant="bodyMd">Color</Text>
              </div>
            )}
            {currentLayout.optionValues && (
              <div style={{ flex: 2 }}>
                <Text as="p" variant="bodyMd">Value</Text>
              </div>
            )}
            {currentLayout.associatedProductId && productIdType === 'independent' && (
              <div style={{ flex: 2 }}>
                <Text as="p" variant="bodyMd">Product ID</Text>
              </div>
            )}
            {currentLayout.optionValues && (
              <div style={{ flex: 'none', width: '140px' }}>
                <Text as="p" variant="bodyMd">Default</Text>
              </div>
            )}
          </div>

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
                    {/* Image Upload - controlled by image */}
                    {currentLayout.image && (
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 40, height: 40, position: 'relative' }}>
                          <DropZone
                            allowMultiple={false}
                            accept="image/*"
                            type="image"
                            onChange={(files) => handleDropZoneChange(files, row.id)}
                          >
                            {row.tempImageUrl ? (
                              <img
                                src={row.tempImageUrl}
                                alt="Option swatch"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <DropZone.FileUpload />
                            )}
                          </DropZone>
                        </div>
                        {row.file && (
                          <Text variant="bodySm" as="p">
                            {row.file.name}
                          </Text>
                        )}
                      </div>
                    )}

                    {/* Color Picker - controlled by color */}
                    {currentLayout.color && (
                      <div style={{ flex: 2 }}>
                        <ColorPicker
                          label="Color"
                          onChange={(color) => handleValueUpdate(row.id, { color })}
                          color={row.color || { hue: 0, brightness: 1, saturation: 1 }}
                          allowAlpha={false}
                        />
                      </div>
                    )}

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
          onUpdate={onUpdate}
          optionLayouts={optionLayouts}
        />
      </Layout.Section>



    </>
  );
}

export default function OptionsPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'CHECKBOX';
  const submit = useSubmit();
  const navigate = useNavigate();
  
  const initialOptions = {
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
  };
  
  const [options, setOptions] = useState(initialOptions);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOptionUpdate = (updates) => {
    setOptions(prev => ({
      ...prev,
      ...updates
    }));
    setIsDirty(true);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    
    console.log('=== SUBMITTING FORM DATA ===');
    console.log('Options state:', options);
    
    // Convert the options state to FormData
    const formData = new FormData();
    
    // Ensure required fields are present
    if (!options.type) {
      options.type = 'CHECKBOX'; // Default type if none selected
    }
    
    Object.entries(options).forEach(([key, value]) => {
      if (key === 'values') {
        // Ensure each value has a name property
        const validValues = value.filter(v => v.name?.trim());
        formData.append(key, JSON.stringify(validValues));
      } else {
        formData.append(key, value?.toString() || '');
      }
    });

    console.log('Form data being submitted:', Object.fromEntries(formData));

    try {
      await submit(formData, { method: 'post' });
      // Reset form to initial state after successful save
      setOptions(initialOptions);
      setIsDirty(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    // Just reset the form to initial state
    setOptions(initialOptions);
    setIsDirty(false);
  };

  // Show save bar when form is dirty and name is not empty
  const showSaveBar = isDirty && options.name.trim() !== '';

  return (
    <Page fullWidth>    
      <style>{preventWheelChange}</style>
      <TitleBar title="Product Options">
        {showSaveBar && (
          <>
            <button onClick={handleDiscard}>Discard</button>
            <button variant="primary" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </TitleBar>
      <Layout>
        <Option
          {...options}
          onUpdate={handleOptionUpdate}
        />
      </Layout>
    </Page>
  );
} 



