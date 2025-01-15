import React, { useMemo, useCallback } from 'react';
import { Select } from "@shopify/polaris";

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
    handleChange('colorDesignationLeathers', {
      shapeId: shape.value,
      leather: value ? leatherOptions.find(opt => opt.value === value)?.color : null
    });
  }, [shape.value, handleChange, leatherOptions]);

  return (
    <Select
      options={leatherOptions}
      onChange={handleColorChange}
      value={formState.colorDesignationLeathers[shape.value]?.value || ''}
    />
  );
};

export default React.memo(ColorDesignation);