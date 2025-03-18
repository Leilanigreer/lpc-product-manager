// app/components/ProductVariantCheck.jsx

import React, { memo, useCallback } from 'react';
import { Text, BlockStack, Box, InlineStack, Card } from '@shopify/polaris';
import { isDevelopment } from '../lib/config/environment';
import ImageDropZone from './ImageDropZone';
import AdditionalViews from './AdditionalViews';
import { uploadToCloudinary } from '../lib/utils/cloudinary';
import { isPutter } from '../lib/utils/shapeUtils';

const VariantRow = memo(({ variant, index, productData, onImageUpload }) => {
  const handleDrop = useCallback(async (files, label) => {
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const isPutterVariant = isPutter({ shapeType: variant.shapeType });
      
      // Create the public ID based on whether it's a putter or not
      const publicId = isPutterVariant 
        ? `${productData.cloudinaryFolder}/${variant.sku}-${label}`
        : `${productData.cloudinaryFolder}/${variant.sku}`;

      // Upload to Cloudinary with the specific public ID
      const result = await uploadToCloudinary(file, publicId);
      
      console.log('Image uploaded:', {
        sku: variant.sku,
        label,
        isPutter: isPutterVariant,
        publicId,
        url: result.url
      });

      // Update the product data with the new image URL
      if (onImageUpload) {
        onImageUpload(variant.sku, label, result.url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [variant, productData, onImageUpload]);

  // Get the uploaded image URL for a specific label
  const getUploadedImageUrl = useCallback((label) => {
    if (!variant.images) return null;
    const image = variant.images.find(img => img.label === label);
    return image?.url || null;
  }, [variant.images]);

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
  const isPutterVariant = isPutter({ shapeType: variant.shapeType });
  
  const getViewLabels = () => {
    if (isPutterVariant) {
      // For putters, use the variant's shape to determine the views
      if (variant.shape === 'Blade') {
        return ['Top', 'Side Back', 'Side Front'];
      } else if (variant.shape === 'Mallet') {
        return ['Front', 'Back', 'Open Back'];
      }
      // Default putter views if shape doesn't match
      return ['Front', 'Back', 'Open Back'];
    }
    // For non-putters, just show front view
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
        {isDevelopment() && (
          <>
            <Text variant="bodySm" color="subdued"> (Position: {variant.position})</Text>
            <Text variant='bodySm' color="subdued"> Shape: {variant.shape}</Text>
            <Text variant='bodySm' color='subdued'>BaseSKU: {variant.baseSKU}</Text>
          </>
        )}
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
                onDrop={(files) => handleDrop(files, label)}
                uploadedImageUrl={getUploadedImageUrl(label)}
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

const VariantGroup = memo(({ variantGroup, title, productData, onImageUpload }) => (
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
          productData={productData}
          onImageUpload={onImageUpload}
        />
      ))}
    </div>
  </BlockStack>
));
VariantGroup.displayName = 'VariantGroup';

const ProductVariantCheck = ({ productData, onImageUpload }) => {
  if (!productData?.variants?.length) return null;

  const baseVariants = productData.variants.filter(v => v && !v.isCustom);
  const customVariants = productData.variants.filter(v => v && v.isCustom);

  const { title, productType, seoTitle, mainHandle, tags, descriptionHTML, seoDescription } = productData;

  // Get the baseSKU from the first variant
  const baseSKU = baseVariants[0]?.baseSKU || '';

  // Mock formState for AdditionalViews
  const formState = {
    baseSKU,
    allShapes: {
      default: { isSelected: true, isPutter: false }
    }
  };

  // Handle additional view uploads
  const handleAdditionalViewUpload = (label, url) => {
    if (!onImageUpload) return;
    
    // For additional views, we'll use the baseSKU as the identifier
    onImageUpload(baseSKU, label, url);
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
      )}

      {baseVariants.length > 0 && (
        <VariantGroup 
          variantGroup={baseVariants} 
          title="Base Variants"
          productData={productData}
          onImageUpload={onImageUpload}
        />
      )}

      {/* Additional Views section */}
      <BlockStack gap="200">
        <Text variant="headingMd" as="h3">Additional Views</Text>
        <Card>
          <Box padding="100">
            <AdditionalViews 
              formState={formState} 
              handleChange={() => {}} 
              onImageUpload={handleAdditionalViewUpload}
              productData={productData}
            />
          </Box>
        </Card>
      </BlockStack>

      {customVariants.length > 0 && (
        <VariantGroup 
          variantGroup={customVariants} 
          title="Custom Variants"
          productData={productData}
          onImageUpload={onImageUpload}
        />
      )}
    </BlockStack>
  );
};

ProductVariantCheck.displayName = 'ProductVariantCheck';

export default memo(ProductVariantCheck);