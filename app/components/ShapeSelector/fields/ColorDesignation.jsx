import React, { useMemo, useCallback } from 'react';
import { Select } from "@shopify/polaris";

/**
 * ColorDesignation leather color selection field.
 * The contextual leather phrase (e.g. ": Diamonds are") used to render here in front of the
 * dropdown but was extracted into its own `LeatherPhrase` column so the Named Leather dropdown
 * stays anchored under its header instead of shifting when phrases vary in length.
 *
 * @param {Object} props
 * @param {Object} props.shape - Current shape object
 * @param {Object} props.formState - Current form state
 * @param {Function} props.handleChange - Form state update handler
 */

const ColorDesignation = ({
  shape,
  formState,
  handleChange
}) => {
  const shapeState = formState.allShapes[shape.value];
  const currentValue = shapeState?.colorDesignation?.value || '';

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
    <Select
      options={leatherOptions}
      onChange={handleColorChange}
      value={currentValue}
    />
  );
};

export default React.memo(ColorDesignation);