import React, { useMemo, useCallback } from 'react';
import { Select } from "@shopify/polaris";
import {
  getShapeGroup,
  styleCategoryMatchesShapeGroup,
} from '../../../lib/utils/shapeUtils';

const StyleField = ({ 
  shape,
  formState,
  handleChange 
}) => {
  const shapeState = formState.allShapes[shape.value];

  // Generate style options from collection styles
  const styleOptions = useMemo(() => {
    const collectionStyles = formState.collection?.styles || [];

    let sourceStyles = collectionStyles;
    const group = getShapeGroup(shape);
    if (group) {
      sourceStyles = collectionStyles.filter((style) =>
        styleCategoryMatchesShapeGroup(style.shapeGroup, group)
      );
    }

    return [
      { label: 'Select a style...', value: '' },
      ...sourceStyles.map((style) => ({
        label: style.label,
        value: style.value,
        style: { ...style },
      })),
    ];
  }, [formState.collection?.styles, shape]);

  // Handle style selection for independent mode
  const handleStyleChange = useCallback((value) => {
    if (!value) {
      handleChange('shapeField', {
        shapeValue: shape.value,
        field: 'style',
        value: null
      });
      return;
    }

    // Find selected style and store minimal data
    const selectedOption = styleOptions.find(opt => opt.value === value);
    if (!selectedOption?.style) return;

    handleChange('shapeField', {
      shapeValue: shape.value,
      field: 'style',
      value: selectedOption.style
    });
  }, [shape.value, styleOptions, handleChange]);

  return (
    <Select
      options={styleOptions}
      onChange={handleStyleChange}
      value={shapeState?.style?.value || ''}
      disabled={!shapeState?.isSelected}
    />
  );
};

export default React.memo(StyleField);