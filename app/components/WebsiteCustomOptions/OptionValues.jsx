import { useState, useEffect } from "react";
import {
  Card,
  Text,
  BlockStack,
  TextField,
  Checkbox,
  Button,
  ColorPicker,
  DropZone,
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

export default function OptionValues({ 
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

    // Show local preview immediately
    const tempImageUrl = URL.createObjectURL(file);
    
    // Update with local preview
    handleValueUpdate(id, {
      tempImageUrl,
      file
    });

    try {
      setUploadingImages(prev => new Set(prev).add(id));
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-swatch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const responseData = await response.json();

      handleValueUpdate(id, {
        imageUrl: responseData.url,
        publicId: responseData.publicId,
        tempImageUrl: '',
        file: null
      });
    } catch (error) {
      console.error('Upload process error:', error);
    } finally {
      setUploadingImages(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
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
                          onDropAccepted={(acceptedFiles) => {
                            handleDropZoneChange(acceptedFiles, row.id);
                          }}
                          errorOverlayText="File type must be an image"
                          overlayText="Drop image file to upload"
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