import React, { useMemo } from 'react';
import { getGoogleDriveUrl } from '../lib/utils/urlUtils';
import { Card, InlineStack, Box, Select, BlockStack, Text, Image } from "@shopify/polaris";

const LeatherColorSelector = ({ 
  leatherColors, 
  formState,
  onChange,
}) => {
  const needsSecondaryColor = useMemo(() => {
    let requiresSecondary = formState.collection?.needsSecondaryLeather ?? false;
    
    if (formState.styleMode === 'global' && formState.globalStyle?.requirements) {
      requiresSecondary = formState.globalStyle.requirements.needsSecondaryLeather;
    }
    
    return requiresSecondary;
  }, [formState.collection, formState.styleMode, formState.globalStyle]);

  const renderColorSelector = (label, type) => (
    <>
      <Box width={needsSecondaryColor ? "25%" : "50%"}>
        <Select
          label={label}
          options={[{ label: "Select a Leather", value: "" }, ...leatherColors]}
          onChange={(value) => {
            const selectedColor = leatherColors.find(c => c.value === value) || null;
            const updatedColors = {
              primary: type === 'primary' ? selectedColor : formState.leatherColors.primary,
              secondary: type === 'secondary' ? selectedColor : formState.leatherColors.secondary
            };
            onChange('leatherColors', updatedColors);
          }}
          value={formState.leatherColors[type]?.value || ''}
        />
      </Box>
      <Box width={needsSecondaryColor ? "25%" : "50%"}>
        {formState.leatherColors[type] && formState.leatherColors[type].image_url !== "" && formState.leatherColors[type].image_url != null && (
          <BlockStack gap="200">
            <Text variant="bodyMd" as="p">
              {type === 'secondary' ? "2nd Leather Preview:" : "Leather Preview:"}
            </Text>
            <Image
              source={getGoogleDriveUrl(formState.leatherColors[type].url_id)}
              alt={`Preview of ${formState.leatherColors[type].label} leather`}
              style={{ width: '150px', height: 'auto' }}
            />
          </BlockStack>
        )}
      </Box>
    </>
  );

  return (
    <Card>
      <InlineStack gap="500" align="start" wrap={false}>
        {renderColorSelector("Select Leather Color", "primary")}
        {needsSecondaryColor && (
          renderColorSelector("Select 2nd Leather Color", "secondary")
        )}
      </InlineStack>
    </Card>
  );
};

export default React.memo(LeatherColorSelector);