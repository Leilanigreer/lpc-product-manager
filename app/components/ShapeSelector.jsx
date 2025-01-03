// app/components/ShapeSelector.jsx

import React, { useMemo, useState, useCallback } from "react";
import { 
  BlockStack, 
  Box, 
  Divider, 
  Text, 
  Select, 
  TextField, 
  Checkbox, 
  InlineStack,
  Combobox,
  Listbox,
  Icon 
} from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';
import { isPutter } from "../lib/utils";

/**
 * CSS to prevent unwanted wheel behavior on number inputs
 * @constant {string}
 */
const preventWheelChange = `
  input[type="number"] {
    -moz-appearance: textfield !important;
  }
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none !important;
    margin: 0 !important;
    display: none !important;
  }
  
  input[type="number"] {
    scroll-behavior: auto !important;
    overflow: hidden !important;
  }
`;

/**
 * @typedef {Object} Shape
 * @property {string} value - Unique identifier for the shape
 * @property {string} label - Display name for the shape
 * @property {string} abbreviation - Short form code for the shape
 */

/**
 * @typedef {Object} Style
 * @property {string} value - Unique identifier for the style
 * @property {string} label - Display name for the style
 * @property {boolean} stylePerShape - Whether style applies per shape
 * @property {Array<StyleCollection>} collections - Associated collections
 */

/**
 * @typedef {Object} StyleCollection
 * @property {string} handle - Collection handle
 * @property {boolean} needsSecondaryLeather - Whether secondary leather is required
 * @property {boolean} needsStitchingColor - Whether stitching color is required
 * @property {boolean} needsQClassicField - Whether quilted leather field is required
 */

/**
 * @typedef {Object} CurrentCollection
 * @property {string} handle - Collection handle
 * @property {boolean} needsSecondaryLeather - Whether secondary leather is required
 * @property {boolean} needsStitchingColor - Whether stitching color is required
 * @property {boolean} needsQClassicField - Whether quilted leather field is required
 * @property {boolean} needsStyle - Whether style selection is required
 */

/**
 * @typedef {Object} ThreadNumber
 * @property {string} label - Display name for the thread number
 * @property {string} value - Unique identifier for the thread number
 */

/**
 * @typedef {Object} ThreadColor
 * @property {string} value - Unique identifier for the thread color
 * @property {string} label - Display name for the thread color
 * @property {Array<ThreadNumber>} isacordNumbers - Associated thread numbers
 */

/**
 * @typedef {Object} LeatherColor
 * @property {string} value - Unique identifier for the leather color
 * @property {string} label - Display name for the leather color
 */

/**
 * @typedef {Object} FormState
 * @property {Object.<string, string>} weights - Map of shape IDs to their weights
 * @property {Object.<string, string>} selectedStyles - Map of shape IDs to selected style IDs
 * @property {Object.<string, string>} selectedEmbroideryColors - Map of shape IDs to selected thread colors
 * @property {Object.<string, string>} shapeIsacordNumbers - Map of shape IDs to selected thread numbers
 * @property {Object.<string, string>} qClassicLeathers - Map of shape IDs to selected leather colors
 */

/**
 * Shape Selector component for managing shapes and their associated properties
 * @component
 * @param {Object} props - Component props
 * @param {Array<Shape>} props.shapes - Available shapes
 * @param {Array<Style>} props.styles - Available styles with collection relationships
 * @param {Array<ThreadColor>} props.embroideryThreadColors - Available embroidery thread colors
 * @param {Array<ThreadNumber>} props.isacordNumbers - Available thread numbers
 * @param {Array<LeatherColor>} props.leatherColors - Available leather colors
 * @param {FormState} props.formState - Current form state
 * @param {Function} props.handleChange - Callback for form state changes
 * @param {Function} props.needsStyle - Function to determine if style selection is needed
 * @param {Function} props.needsQClassicField - Function to determine if quilted leather selection is needed
 * @param {CurrentCollection} props.currentCollection - Currently selected collection with its configuration
 * @returns {React.ReactElement} Rendered component
 */
const ShapeSelector = ({ 
  shapes, 
  styles, 
  leatherColors,
  embroideryThreadColors,
  isacordNumbers,
  formState, 
  handleChange,
  needsStyle,
  needsQClassicField,
  currentCollection,
}) => {
  console.log('ShapeSelector Props:', {
    shapesCount: shapes?.length,
    stylesCount: styles?.length,
    formState,
    currentCollection,
  });

  const [threadSearchValues, setThreadSearchValues] = useState({});
  const [editingShapeIds, setEditingShapeIds] = useState({});

  const filteredStyles = useMemo(() => {
    if (!currentCollection?.handle || !styles?.length) {
      return [];
    }
    
    return styles
      .filter(style => 
        style.collections?.some(sc => 
          sc.handle === currentCollection.handle
        )
      )
      .map(style => ({
        label: style.label,
        value: style.value,
        stylePerShape: style.stylePerShape
      }));
  }, [currentCollection, styles]);

  // Remove colorTags from thread colors for internal use
  const sanitizedEmbroideryColors = useMemo(() => 
    embroideryThreadColors?.map(({ colorTags, ...rest }) => rest) || [],
    [embroideryThreadColors]
  );

  /**
   * Generate combined options list with "None" and all thread numbers
   * @type {Array<Object>}
   */
  const threadNumberOptions = useMemo(() => {
    const options = [{ label: "None", value: "none" }];
  
    sanitizedEmbroideryColors.forEach(thread => {
      if (thread.isacordNumbers) {
        thread.isacordNumbers.forEach(number => {
          options.push({
            label: number.label,
            value: number.value,
            threadId: thread.value,
            threadName: thread.label,
            displayText: `${number.label} - ${thread.label}`
          });
        });
      }
    });
  
    return options;
  }, [sanitizedEmbroideryColors]);

  /**
   * Filter thread options based on search input
   * @param {string} shapeId - ID of the shape being filtered for
   * @returns {Array<Object>} Filtered options
   */
  const getFilteredOptions = useCallback((shapeId) => {
    const searchValue = threadSearchValues[shapeId] || '';
    if (searchValue === '') return threadNumberOptions;
    
    const searchTerm = searchValue.toLowerCase();
    return threadNumberOptions.filter(option => 
      option.value === 'none' || 
      option.displayText?.toLowerCase().includes(searchTerm)
    );
  }, [threadNumberOptions, threadSearchValues]);

  /**
   * Handle changes to the thread number search input
   * @param {string} shapeId - ID of the shape being searched for
   * @param {string} value - New search input value
   */
  const handleSearchChange = useCallback((shapeId, value) => {
    // Mark this shape as being edited
    setEditingShapeIds(prev => ({
      ...prev,
      [shapeId]: true
    }));
    
    setThreadSearchValues(prev => ({
      ...prev,
      [shapeId]: value
    }));
  }, []);

  const handleSearchBlur = useCallback((shapeId) => {
    // Clear editing state when field loses focus
    setEditingShapeIds(prev => ({
      ...prev,
      [shapeId]: false
    }));
    
    // Clear search value if no selection was made
    setThreadSearchValues(prev => ({
      ...prev,
      [shapeId]: ''
    }));
  }, []);

  const handleSearchFocus = useCallback((shapeId) => {
    // Set editing state when field gains focus
    setEditingShapeIds(prev => ({
      ...prev,
      [shapeId]: true
    }));
  }, []);

  /**
   * Handle selection of a thread number
   * @param {string} shapeId - ID of the shape being updated
   * @param {string} value - Selected thread number value
   */
  const handleThreadSelect = useCallback((shapeId, value) => {
    if (value === 'none') {
      // Clear both color and number
      const newEmbroideryColors = { ...formState.selectedEmbroideryColors };
      const newIsacordNumbers = { ...formState.shapeIsacordNumbers };
      delete newEmbroideryColors[shapeId];
      delete newIsacordNumbers[shapeId];
      
      handleChange('selectedEmbroideryColors', newEmbroideryColors);
      handleChange('shapeIsacordNumbers', newIsacordNumbers);
    } else {
      const selectedOption = threadNumberOptions.find(opt => opt.value === value);
      if (selectedOption) {
        // Update with enhanced data
        handleChange('selectedEmbroideryColors', {
          ...formState.selectedEmbroideryColors,
          [shapeId]: {
            id: selectedOption.threadId,
            name: selectedOption.threadName,
            number: selectedOption.label
          }
        });
        handleChange('shapeIsacordNumbers', {
          ...formState.shapeIsacordNumbers,
          [shapeId]: value
        });
      }
    }
    
    setEditingShapeIds(prev => ({
      ...prev,
      [shapeId]: false
    }));
    setThreadSearchValues(prev => ({
      ...prev,
      [shapeId]: ''
    }));
  }, [handleChange, threadNumberOptions, formState]);

  const memoizedShapes = useMemo(() => shapes || [], [shapes]);
  const showStyle = needsStyle;
  console.log('showStyle result:', showStyle);

  const showQClassicField = needsQClassicField;

  /**
   * Generate leather color options based on selected colors
   * @type {Array<Object>}
   */
  const leatherOptions = useMemo(() => {
    const options = [];
    
    const leatherColor1 = leatherColors?.find(color => color.value === formState.selectedLeatherColor1);
    const leatherColor2 = leatherColors?.find(color => color.value === formState.selectedLeatherColor2);
    
    if (leatherColor1) {
      options.push({
        label: leatherColor1.label,
        value: formState.selectedLeatherColor1
      });
    }
    
    if (leatherColor2) {
      options.push({
        label: leatherColor2.label,
        value: formState.selectedLeatherColor2
      });
    }

    return options; 
  }, [leatherColors, formState.selectedLeatherColor1, formState.selectedLeatherColor2]);

  /**
   * Handle toggling of shape selection
   * @param {string} shapeValue - ID of the shape being toggled
   * @param {boolean} checked - New checked state
   */
  const handleShapeToggle = (shapeValue, checked) => {
    if (!checked) {
      const newWeights = { ...formState.weights };
      const newStyles = { ...formState.selectedStyles };
      
      delete newWeights[shapeValue];
      delete newStyles[shapeValue];
      
      if (showStyle) {
        const newEmbroideryColors = { ...formState.selectedEmbroideryColors };
        delete newEmbroideryColors[shapeValue];
        handleChange('selectedEmbroideryColors', newEmbroideryColors);
        
        if (showQClassicField) {
          const newQClassicLeathers = { ...formState.qClassicLeathers };
          delete newQClassicLeathers[shapeValue];
          handleChange('qClassicLeathers', newQClassicLeathers);
        }
      }
  
      handleChange('weights', newWeights);
      handleChange('selectedStyles', newStyles);
    } else {
      handleChange('weights', {
        ...formState.weights,
        [shapeValue]: ''
      });
    }
  };

  /**
   * Handle changes to shape weight
   * @param {string} shapeValue - ID of the shape being updated
   * @param {string} value - New weight value
   */
  const handleWeightChange = (shapeValue, value) => {
    const newWeights = { ...formState.weights };
    if (value === '') {
      delete newWeights[shapeValue];
    } else {
      newWeights[shapeValue] = value;
    }
    handleChange('weights', newWeights);
  };

  /**
   * Handle changes to shape style
   * @param {string} shapeValue - ID of the shape being updated
   * @param {string} value - New style value
   */
  const handleStyleChange = (shapeValue, value) => {
    handleChange('selectedStyles', {
      ...formState.selectedStyles,
      [shapeValue]: value
    });
  };

  /**
   * Handle changes to quilted leather selection
   * @param {string} shapeValue - ID of the shape being updated
   * @param {string} value - New leather color value
   */
  const handleQClassicLeatherChange = (shapeValue, value) => {
    handleChange('qClassicLeathers', {
      ...formState.qClassicLeathers,
      [shapeValue]: value
    });
  };

  /**
   * Render the listbox for thread number selection
   * @component
   */
  const ComboboxList = ({ options, selectedValue, onSelect }) => (
    options.length > 0 && (
      <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
        <Listbox onSelect={onSelect}>
          {options.map((option) => (
            <Listbox.Option
              key={option.value}
              value={option.value}
              selected={option.value === selectedValue}
            >
              {option.value === 'none' ? option.label : option.displayText }
            </Listbox.Option>
          ))}
        </Listbox>
      </div>
    )
  );

  /**
   * Render the thread number selector combobox
   * @param {Object} shape - Shape object to render selector for
   * @returns {React.ReactElement} Rendered selector
   */
  const renderThreadSelector = (shape) => (
    <Combobox
      activator={
        <Combobox.TextField
          prefix={<Icon source={SearchIcon} />}
          onChange={(value) => handleSearchChange(shape.value, value)}
          onBlur={() => handleSearchBlur(shape.value)}
          onFocus={() => handleSearchFocus(shape.value)}
          value={editingShapeIds[shape.value] 
            ? (threadSearchValues[shape.value] || '')
            : getSelectedThreadNumberLabel(shape.value)}
          autoComplete="off"
          disabled={!formState.weights.hasOwnProperty(shape.value)}
        />
      }
    >
      <ComboboxList 
        options={getFilteredOptions(shape.value)}
        selectedValue={formState.shapeIsacordNumbers?.[shape.value]}
        onSelect={(value) => handleThreadSelect(shape.value, value)}
      />
    </Combobox>
  );

  const getSelectedThreadNumberLabel = useCallback((shapeId) => {
    const selectedNumberValue = formState.shapeIsacordNumbers?.[shapeId];
    if (!selectedNumberValue || selectedNumberValue === 'none') {
      return 'None';
    }
    
    const selectedOption = threadNumberOptions.find(opt => opt.value === selectedNumberValue);
    return selectedOption?.displayText || '';
  }, [formState.shapeIsacordNumbers, threadNumberOptions]);

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">Part 2</Text>
      
      {/* Headers */}
      <InlineStack wrap={false} gap="400" align="start">
        <Box width="200px">
          <Text variant="bodyMd" fontWeight="bold">Shape</Text>
        </Box>
        {showStyle && (
          <>
            <Box width="200px">
              <Text variant="bodyMd" fontWeight="bold">Style</Text>
            </Box>
            <Box width="200px">
              <Text variant="bodyMd" fontWeight="bold">Embroidery</Text>
            </Box>
            {showQClassicField && (
              <Box width="200px">
                <Text variant="bodyMd" fontWeight="bold">Quilted Leather</Text>
              </Box>
            )}
          </>
        )}
        <Box width="150px">
          <Text variant="bodyMd" fontWeight="bold">Weight</Text>
        </Box>
      </InlineStack>
      
      {/* Shape rows */}
      {memoizedShapes.map((shape, index) => {
        const isShapePutter = isPutter(shape);
        return (
          <Box key={shape.value} paddingBlockEnd="400">
            <InlineStack wrap={false} gap="400" align="start">
              <Box width="200px">
                <Checkbox
                  label={shape.label}
                  checked={formState.weights.hasOwnProperty(shape.value)}
                  onChange={(checked) => handleShapeToggle(shape.value, checked)}
                />
              </Box>
              {showStyle && !isShapePutter && (
                <>
                  <Box width="200px">
                    <Select
                      options={filteredStyles || []}
                      onChange={(value) => handleStyleChange(shape.value, value)}
                      value={formState.selectedStyles?.[shape.value] || ''}
                      placeholder="Select style"
                      disabled={!formState.weights.hasOwnProperty(shape.value)}
                    />
                  </Box>
                  <Box width="200px">
                    {renderThreadSelector(shape)}
                  </Box>
                  {showQClassicField && (
                    <Box width="200px">
                      <Select
                        options={leatherOptions}
                        onChange={(value) => handleQClassicLeatherChange(shape.value, value)}
                        value={formState.qClassicLeathers?.[shape.value] || ''}
                        placeholder="Select leather color"
                        disabled={!formState.weights.hasOwnProperty(shape.value)}
                      />
                    </Box>
                  )}
                </>
              )}
              <Box width="150px">
                <style>{preventWheelChange}</style>
                <TextField
                  type="number"
                  min="0"
                  step="0.01"
                  onWheel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onFocus={(e) => {
                    e.target.addEventListener('wheel', (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }, { passive: false });
                  }}
                  onChange={(value) => handleWeightChange(shape.value, value)}
                  value={formState.weights?.[shape.value] || ''}
                  placeholder="0.00"
                  suffix="oz"
                  disabled={!formState.weights.hasOwnProperty(shape.value)}
                />
              </Box>
            </InlineStack>
            {index < memoizedShapes.length - 1 && <Divider />}
          </Box>
        );
      })}
    </BlockStack>
  );
};

export default React.memo(ShapeSelector);