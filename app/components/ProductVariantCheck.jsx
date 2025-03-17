// app/components/ProductVariantCheck.jsx

import React, { memo, useCallback } from 'react';
import { Text, BlockStack, Box, InlineStack, Card } from '@shopify/polaris';
import { isDevelopment } from '../lib/config/environment';
import ImageDropZone from './ImageDropZone';
import AdditionalViews from './AdditionalViews';

const VariantRow = memo(({ variant, index }) => {
  const handleDrop = useCallback((files) => {
    console.log('File dropped:', files);
    // TODO: Implement actual upload logic
  }, []);

  // Skip image upload for custom variants
  if (variant.isCustom) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        padding: '16px',
        backgroundColor: index % 2 === 0 ? '#f6f6f7' : 'white'
      }}>
        <BlockStack gap="100">
          <Text variant="bodyMd">{variant.variantName}</Text>
          {variant.weight && (
            <Text variant="bodySm" color="subdued">
              Weight: {variant.weight}oz
            </Text>
          )}
        </BlockStack>
        
        {/* Empty middle section to maintain alignment */}
        <Box />
        
        {/* Price */}
        <Text variant="bodyMd">${variant.price}</Text>
      </div>
    );
  }

  // Determine if it's a putter based on shape type
  const isPutter = variant.shapeType === 'PUTTER' || variant.shapeType === 'LAB_PUTTER';
  
  const getViewLabels = () => {
    if (isPutter) {
      return variant.shape === 'Blade' 
        ? ['Top', 'Side Back', 'Side Front']
        : ['Front', 'Back', 'Open Back'];
    }
    return ['Front'];
  };

  const viewLabels = getViewLabels();

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'start',
      padding: '16px',
      backgroundColor: index % 2 === 0 ? '#f6f6f7' : 'white'
    }}>
      {/* Variant Info */}
      <BlockStack gap="100">
        <Text variant="bodyMd">
          {variant.variantName} 
        </Text>
        {/* Development info commented out
        {isDevelopment() && (
          <>
            <Text variant="bodySm" color="subdued"> (Position: {variant.position})</Text>
            <Text variant='bodySm' color="subdued"> Shape: {variant.shape}</Text>
            <Text variant='bodySm' color='subdued'>BaseSKU: {variant.baseSKU}</Text>
            </>
            )} */}
        {variant.weight && (
          <Text variant="bodySm" color="subdued">
            Weight: {variant.weight}oz
          </Text>
        )}
        <Text variant="bodySm" color="subdued">SKU: {variant.sku}</Text>
      </BlockStack>

      {/* Image Upload Section */}
      <Box minWidth="400px">
        <InlineStack gap="600" align="start" wrap={false}>
          {viewLabels.map((label) => (
            <Box 
              key={label} 
              minWidth="100px" 
              style={{ 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <ImageDropZone
                size="small"
                label={label}
                onDrop={handleDrop}
              />
              <Text variant="bodySm" style={{ marginTop: '4px' }}>{label}</Text>
            </Box>
          ))}
        </InlineStack>
      </Box>

      {/* Price */}
      <Text variant="bodyMd" style={{ minWidth: '80px', textAlign: 'right' }}>${variant.price}</Text>
    </div>
  );
});

VariantRow.displayName = 'VariantRow';

const VariantGroup = memo(({ variantGroup, title }) => (
  <BlockStack gap="200">
    <Text variant="headingMd" as="h3">{title}</Text>
    <div style={{ 
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #dde0e4'
    }}>
      {variantGroup.map((variant, index) => (
        <VariantRow 
          key={variant.sku}
          variant={variant} 
          index={index}
        />
      ))}
    </div>
  </BlockStack>
));
VariantGroup.displayName = 'VariantGroup';

const ProductVariantCheck = ({ productData }) => {
  if (!productData?.variants?.length) return null;

  const baseVariants = productData.variants.filter(v => v && !v.isCustom);
  const customVariants = productData.variants.filter(v => v && v.isCustom);

  const { title, productType, seoTitle } = productData;

  // Mock formState for AdditionalViews
  const formState = {
    allShapes: {
      default: { isSelected: true, isPutter: false }
    }
  };

  return (
    <BlockStack gap="400">
      {productType && (
        <Text variant="bodyMd">Collection: {productType}</Text>
      )}
      {title && (
        <Text variant="bodyMd">Listing Title: {title}</Text>
      )}
      {seoTitle && (
        <Text variant="bodyMd">Listing SEO Title: {seoTitle}</Text>
      )}
      {/* Development info commented out
      {isDevelopment() && (
        <>
          {mainHandle && (
            <Text variant="bodyMd">Generated Main Handle: {mainHandle}</Text>
          )}
          {tags && (
            <Text variant="bodyMd">Generated tags: {tags}</Text>
          )}
          {descriptionHTML && (
            <Text variant="bodyMd">Generated descriptionHTML: {descriptionHTML}</Text>
          )}
          {seoDescription && (
            <Text variant="bodyMd">Generated seoDescription: {seoDescription}</Text>
          )}
        </>
      )} */}

      {baseVariants.length > 0 && (
        <VariantGroup 
          variantGroup={baseVariants} 
          title="Base Variants"
        />
      )}

      {/* Additional Views section */}
      <BlockStack gap="200">
        <Text variant="headingMd" as="h3">Additional Views</Text>
        <Card>
          <Box padding="400">
            <AdditionalViews formState={formState} handleChange={() => {}} />
          </Box>
        </Card>
      </BlockStack>

      {customVariants.length > 0 && (
        <VariantGroup 
          variantGroup={customVariants} 
          title="Custom Variants"
        />
      )}
    </BlockStack>
  );
};

ProductVariantCheck.displayName = 'ProductVariantCheck';

export default memo(ProductVariantCheck);