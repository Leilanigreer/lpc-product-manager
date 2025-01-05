// app/components/LeatherColorSelector.jsx

import React, { useMemo } from 'react';
import { Card, InlineStack, Box, Select, BlockStack, Text, Image, Banner } from "@shopify/polaris";

/**
 * Leather color selector component that handles both primary and secondary leather selections
 * @param {Object} props
 * @param {Array<Object>} props.leatherColors - Available leather colors
 * @param {Object} props.formState - Current form state
 * @param {Object} props.formState.collection - Selected collection info
 * @param {Object} props.formState.leatherColors - Selected leather colors
 * @param {Function} props.onChange - Callback when selections change
 */

const LeatherColorSelector = ({ 
  leatherColors, 
  formState,
  onChange
}) => {
  const { collection, globalStyle } = formState;
  
  // Determine if secondary leather is needed based on collection and style override
  const needsSecondaryLeather = useMemo(() => {
    if (globalStyle?.overrides?.overrideSecondaryLeather !== null) {
      return globalStyle.overrides.overrideSecondaryLeather;
    }
    return collection?.needsSecondaryLeather || false;
  }, [collection?.needsSecondaryLeather, globalStyle?.overrides?.overrideSecondaryLeather]);

  // Filter and memoize leather options
  const leatherOptions = useMemo(() => {
    const baseOptions = [{ label: "Select a Leather", value: "" }];
    
    if (!Array.isArray(leatherColors)) {
      console.warn('Invalid leatherColors array');
      return baseOptions;
    }

    const filteredOptions = leatherColors
      .filter(color => {
        // Add any filtering logic here (e.g., for limited editions)
        if (formState.selectedOfferingType === 'limitedEdition') {
          return color.isLimitedEditionLeather;
        }
        return true;
      })
      .map(({ colorTags, ...rest }) => ({
        value: rest.value,
        label: rest.label,
        abbreviation: rest.abbreviation,
        image_url: rest.image_url
      }));

    return [...baseOptions, ...filteredOptions];
  }, [leatherColors, formState.selectedOfferingType]);

  const handleColorChange = (colorType, value) => {
    const selectedColor = value ? leatherColors.find(color => color.value === value) : null;
    
    // Map selected color to form state structure
    const mappedColor = selectedColor ? {
      id: selectedColor.value,
      name: selectedColor.label,
      abbreviation: selectedColor.abbreviation,
      image_url: selectedColor.image_url,
      colorTags: selectedColor.colorTags?.map(tag => ({
        id: tag.value,
        name: tag.label
      })) || []
    } : null;

    onChange('leatherColors', {
      type: colorType,
      color: mappedColor
    });
  };

  const renderColorSelector = (label, colorType, index) => {
    const currentValue = formState.leatherColors?.[colorType]?.id || '';
    const currentColor = formState.leatherColors?.[colorType];
    
    return (
      <>
        <Box width={needsSecondaryLeather ? "25%" : "50%"}>
          <Select
            label={label}
            options={leatherOptions}
            onChange={(value) => handleColorChange(colorType, value)}
            value={currentValue}
            error={colorType === 'primary' && !currentValue ? 
              "Primary leather color is required" : undefined}
          />
        </Box>
        <Box width={needsSecondaryLeather ? "25%" : "50%"}>
          {currentValue && (
            <BlockStack gap="200">
              <Text variant="bodyMd" as="p">
                {index === 2 ? "2nd Leather Preview:" : "Leather Preview:"}
              </Text>
              <Image
                source={currentColor?.image_url}
                alt={`Preview of ${currentColor?.name} leather`}
                style={{ width: '150px', height: 'auto' }}
              />
            </BlockStack>
          )}
        </Box>
      </>
    );
  };

  return (
    <Card>
      {formState.selectedOfferingType === 'limitedEdition' && 
       leatherOptions.length <= 1 && (
        <Box paddingBlockEnd="400">
          <Banner status="warning">
            No limited edition leathers available
          </Banner>
        </Box>
      )}
      <InlineStack gap="500" align="start" wrap={false}>
        {renderColorSelector(
          "Select Leather Color", 
          'primary',
          1
        )}
        {needsSecondaryLeather && (
          renderColorSelector(
            "Select 2nd Leather Color", 
            'secondary',
            2
          )
        )}
      </InlineStack>
    </Card>
  );
};

export default React.memo(LeatherColorSelector);