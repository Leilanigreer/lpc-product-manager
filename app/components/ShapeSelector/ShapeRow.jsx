// app/components/ShapeSelector/ShapeRow.jsx

import React, { useMemo } from 'react';
import { InlineStack, Box } from "@shopify/polaris";
import ShapeCheckbox from './fields/ShapeCheckbox';
import StyleField from './fields/StyleField';
import EmbroideryField from './fields/EmbroideryField';
import QClassicField from './fields/QClassicField';
import WeightField from './fields/WeightField';

/**
 * @typedef {import('./index').Shape} Shape
 * @typedef {import('./index').Style} Style
 */

/**
 * Individual row component for shape configuration
 * @param {Object} props
 * @param {Shape} props.shape - Shape to configure
 * @param {Style[]} props.styles - Available styles
 * @param {Array} props.leatherColors - Available leather colors
 * @param {Array} props.embroideryThreadColors - Available thread colors
 * @param {Object} props.formState - Current form state
 * @param {Function} props.handleChange - Form state update handler
 */
const ShapeRow = ({
  shape,
  styles,
  leatherColors,
  embroideryThreadColors,
  formState,
  handleChange
}) => {
  // Get collection requirements from form state
  const { needsStyle, needsQClassicField } = formState.collection || {};
  
  // Check shape selection status
  const isSelected = Boolean(formState.weights[shape.value]);

  // Memoize field props to prevent unnecessary re-renders
  const fieldProps = useMemo(() => ({
    isSelected,
    formState,
    handleChange
  }), [isSelected, formState, handleChange]);

  // Memoize style-specific props
  const styleProps = useMemo(() => ({
    styles,
    embroideryThreadColors,
    leatherColors
  }), [styles, embroideryThreadColors, leatherColors]);

  return (
    <InlineStack wrap={false} gap="400" align="start">
      {/* Shape Checkbox - Always shown */}
      <Box width="200px">
        <ShapeCheckbox 
          shape={shape}
          {...fieldProps}
        />
      </Box>

      {/* Style Fields - Shown when style is needed */}
      {needsStyle && (
        <>
          <Box width="200px">
            <StyleField 
              shape={shape}
              styles={styleProps.styles}
              {...fieldProps}
            />
          </Box>
          
          <Box width="200px">
            <EmbroideryField
              shape={shape}
              embroideryThreadColors={styleProps.embroideryThreadColors}
              {...fieldProps}
            />
          </Box>

          {/* Q-Classic Field - Only shown when needed */}
          {needsQClassicField && (
            <Box width="200px">
              <QClassicField
                shape={shape}
                leatherColors={styleProps.leatherColors}
                {...fieldProps}
              />
            </Box>
          )}
        </>
      )}

      {/* Weight Field - Always shown */}
      <Box width="150px">
        <WeightField
          shape={shape}
          {...fieldProps}
        />
      </Box>
    </InlineStack>
  );
};

// Ensure shape-level prop changes trigger re-renders
const propsAreEqual = (prevProps, nextProps) => {
  return (
    prevProps.shape === nextProps.shape &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.formState === nextProps.formState &&
    prevProps.styles === nextProps.styles &&
    prevProps.leatherColors === nextProps.leatherColors &&
    prevProps.embroideryThreadColors === nextProps.embroideryThreadColors
  );
};

export default React.memo(ShapeRow, propsAreEqual);