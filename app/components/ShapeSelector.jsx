import React, { useMemo } from "react";
import { BlockStack, Box, Divider, Text, Select, TextField, Checkbox, InlineStack } from "@shopify/polaris";
import { isPutter } from "../lib/shapeUtils";

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

const ShapeSelector = ({ 
  shapes, 
  styles, 
  embroideryThreadColors,
  isacordNumbers,
  leatherColors,
  formState, 
  handleChange,
  needsStyle,
  needsQClassicField
}) => {
  const hasMultipleThreadNumbers = useMemo(() => 
    (threadId, threadColors) => {
      const thread = threadColors?.find(t => t.value === threadId);
      return thread?.isacordNumbers?.length > 1;
    }, []
  );

  const sanitizedEmbroideryColors = useMemo(() => 
    embroideryThreadColors?.map(({ colorTags, ...rest }) => rest) || [],
    [embroideryThreadColors]
  );

  const memoizedShapes = useMemo(() => shapes || [], [shapes]);
  const showStyle = needsStyle();
  const showQClassicField = needsQClassicField();

  // Create leather options based on the selected colors in formState
  const leatherOptions = useMemo(() => {
    const options = [];
    
    // Find the leather color objects for the selected colors
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

  const handleWeightChange = (shapeValue, value) => {
    const newWeights = { ...formState.weights };
    if (value === '') {
      delete newWeights[shapeValue];
    } else {
      newWeights[shapeValue] = value;
    }
    handleChange('weights', newWeights);
  };

  const handleStyleChange = (shapeValue, value) => {
    handleChange('selectedStyles', {
      ...formState.selectedStyles,
      [shapeValue]: value
    });
  };

  const handleEmbroideryChange = (shapeValue, value) => {
    handleChange('selectedEmbroideryColors', {
      ...formState.selectedEmbroideryColors,
      [shapeValue]: value
    });
  
    // Find the selected thread color and its Isacord numbers
    const selectedThread = embroideryThreadColors?.find(t => t.value === value);
    
    if (selectedThread?.isacordNumbers?.length === 1) {
      // If there's exactly one Isacord number, set it automatically
      handleChange('shapeIsacordNumbers', {
        ...formState.shapeIsacordNumbers,
        [shapeValue]: selectedThread.isacordNumbers[0].value
      });
    } else {
      // Reset if there are multiple options or no options
      const newIsacordNumbers = { ...formState.shapeIsacordNumbers };
      delete newIsacordNumbers[shapeValue];
      handleChange('shapeIsacordNumbers', newIsacordNumbers);
    }
  };

  const handleQClassicLeatherChange = (shapeValue, value) => {
    handleChange('qClassicLeathers', {
      ...formState.qClassicLeathers,
      [shapeValue]: value
    });
  };

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
                      options={styles || []}
                      onChange={(value) => handleStyleChange(shape.value, value)}
                      value={formState.selectedStyles?.[shape.value] || ''}
                      placeholder="Select style"
                      disabled={!formState.weights.hasOwnProperty(shape.value)}
                    />
                  </Box>
                  <Box width="200px">
                    <Select
                      options={[
                        { label: "Color of Thread", value: "", key: "default-thread-color" },
                        ...(sanitizedEmbroideryColors || [])
                      ]}
                      onChange={(value) => handleEmbroideryChange(shape.value, value)}
                      value={formState.selectedEmbroideryColors?.[shape.value] || ''}
                      // placeholder="Select thread color"
                      disabled={!formState.weights.hasOwnProperty(shape.value)}
                    />
                    {hasMultipleThreadNumbers(
                      formState.selectedEmbroideryColors?.[shape.value],
                      sanitizedEmbroideryColors
                    ) && (
                      <Select
                        options={[
                          { label: "Select Number", value: "" },
                          ...(sanitizedEmbroideryColors
                            .find(t => t.value === formState.selectedEmbroideryColors?.[shape.value])
                            ?.isacordNumbers || []
                          )
                        ]}
                        onChange={(value) => handleChange('shapeIsacordNumbers', {
                          ...formState.shapeIsacordNumbers,
                          [shape.value]: value
                        })}
                        value={formState.shapeIsacordNumbers?.[shape.value] || ''}
                        disabled={!formState.weights.hasOwnProperty(shape.value)}
                      />
                    )}                    
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