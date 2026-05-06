import React, { useMemo, useCallback } from 'react';
import { InlineStack, Select, Text } from "@shopify/polaris";

/**
 * ColorDesignation leather color selection field
 * @param {Object} props
 * @param {Object} props.shape - Current shape object
 * @param {Object} props.formState - Current form state
 * @param {boolean} props.isSelected - Whether shape is selected
 * @param {Function} props.handleChange - Form state update handler
 */

const ColorDesignation = ({
  shape,
  formState,
  handleChange
}) => {
  const shapeState = formState.allShapes[shape.value];
  const currentValue = shapeState?.colorDesignation?.value || '';
  const leatherPhrase = String(shapeState?.style?.leatherPhrase || 'are').trim();

  const leatherOptions = useMemo(() => {
    const options = [];
    const { primary, secondary } = formState.leatherColors;
    
    if (primary?.value) {
      options.push({
        label: primary.label,
        value: primary.value,
        color: primary
      });
    }
    
    if (secondary?.value) {
      options.push({
        label: secondary.label,
        value: secondary.value,
        color: secondary
      });
    }

    return [
      { label: 'Select leather color...', value: '' },
      ...options
    ];
  }, [formState.leatherColors]);

  const handleColorChange = useCallback((value) => {
    handleChange('shapeField', {
      shapeValue: shape.value,
      field: 'colorDesignation',
      value: value ? leatherOptions.find(opt => opt.value === value)?.color : null
    });
  }, [shape.value, handleChange, leatherOptions]);

  return (
    <InlineStack wrap={false} gap="200" align="center">
      <div style={{ minWidth: 110, maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <Text as="span" variant="bodyMd" tone="subdued">
          {leatherPhrase}
        </Text>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <Select
          options={leatherOptions}
          onChange={handleColorChange}
          value={currentValue}
        />
      </div>
    </InlineStack>
  );
};

export default React.memo(ColorDesignation);