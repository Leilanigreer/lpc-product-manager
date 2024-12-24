// app/components/ProductVariantCheck.jsx

import React, { memo } from 'react';
import { Text, BlockStack } from '@shopify/polaris';
import { isDevelopment } from '../lib/environment';

const VariantRow = memo(({ variant, index }) => (
  <BlockStack gap="100">
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      padding: '8px',
      backgroundColor: index % 2 === 0 ? '#f6f6f7' : 'white'
    }}>
      <BlockStack gap="100">
        <Text variant="bodyMd">{variant.variantName}</Text>
        {isDevelopment() && (
          <>
            <Text variant="bodySm" color="subdued">
              SKU: {variant.sku}
            </Text>
            <Text variant='bodySm' color='subdued'>
              BaseSKU: {variant.baseSKU}
            </Text>
          </>
        )}
        {variant.weight && (
          <Text variant="bodySm" color="subdued">
            Weight: {variant.weight}oz
          </Text>
        )}
      </BlockStack>
      <Text variant="bodyMd">${variant.price}</Text>
    </div>
  </BlockStack>
));
VariantRow.displayName = 'VariantRow';

const VariantGroup = memo(({ variantGroup, title }) => (
  <BlockStack gap="200">
    <Text variant="headingMd" as="h3">{title}</Text>
    <BlockStack gap="100">
      {variantGroup.map((variant, index) => (
        <VariantRow 
          key={variant.sku}
          variant={variant} 
          index={index}
        />
      ))}
    </BlockStack>
  </BlockStack>
));
VariantGroup.displayName = 'VariantGroup';

const ProductVariantCheck = ({ productData }) => {
  if (!productData) {
    return null;
  }

  const { title, mainHandle, productType, seoTitle, tags, variants } = productData;

  const baseVariants = variants.filter(v => !v.isCustom);
  const customVariants = variants.filter(v => v.isCustom);

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
      {isDevelopment() && (
        <>
          {mainHandle && (
            <Text variant="bodyMd">Generated Main Handle: {mainHandle}</Text>
          )}
          {tags && (
            <Text variant="bodyMd">Generated tags: {tags}</Text>
          )}
        </>
      )}

      {variants && variants.length > 0 && (
        <>
          {baseVariants.length > 0 && (
            <VariantGroup 
              variantGroup={baseVariants} 
              title="Base Variants"
            />
          )}
          {customVariants.length > 0 && (
            <VariantGroup 
              variantGroup={customVariants} 
              title="Custom Variants"
            />
          )}
        </>
      )}
    </BlockStack>
  );
};

ProductVariantCheck.displayName = 'ProductVariantCheck';

export default memo(ProductVariantCheck);