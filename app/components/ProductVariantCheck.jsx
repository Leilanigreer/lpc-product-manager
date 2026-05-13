// app/components/ProductVariantCheck.jsx

import React, { memo } from 'react';
import { Text, BlockStack, Box, Card, TextField, Badge, InlineStack } from '@shopify/polaris';
import { isDevelopment } from '../lib/config/environment';
import AdditionalViews from './AdditionalViews';

/**
 * Per-variant image dropzones moved into the input section (see `ShapeImageCapture` inside
 * `ShapeSelector`). Capture happens before Preview, and the staged files are uploaded to Google
 * Drive at submit time keyed by the generated `variant.sku`. This panel is now a read-only preview
 * of the variant list with the in-page description editor.
 */
const VariantRow = memo(({ variant, index, showVariantReconcileStatus }) => {
  const reconcileBadge =
    showVariantReconcileStatus && variant.existingVariantId != null ? (
      <Badge tone="info">Updates existing variant</Badge>
    ) : showVariantReconcileStatus ? (
      <Badge tone="attention">New variant (create)</Badge>
    ) : null;

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
          <InlineStack gap="200" blockAlign="center" wrap>
            {reconcileBadge}
            <Text variant="bodyMd">{variant.variantName}</Text>
          </InlineStack>
          {showVariantReconcileStatus && variant.sku ? (
            <Text variant="bodySm" color="subdued">SKU: {variant.sku}</Text>
          ) : null}
        </BlockStack>
        <Box />
        <Text variant="bodyMd">${variant.price}</Text>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      padding: '16px',
      backgroundColor: index % 2 === 0 ? '#f6f6f7' : 'white'
    }}>
      <BlockStack gap="100">
        <InlineStack gap="200" blockAlign="center" wrap>
          {reconcileBadge}
          <Text variant="bodyMd">{variant.variantName}</Text>
        </InlineStack>
        {isDevelopment() && (
          <>
            <Text variant="bodySm" color="subdued"> (Position: {variant.position})</Text>
            <Text variant='bodySm' color="subdued"> Shape: {variant.shape}</Text>
            <Text variant='bodySm' color='subdued'>BaseSKU: {variant.baseSKU}</Text>
          </>
        )}
        <Text variant="bodySm" color="subdued">SKU: {variant.sku}</Text>
      </BlockStack>

      <Text variant="bodyMd" style={{ minWidth: '80px', textAlign: 'right' }}>${variant.price}</Text>
    </div>
  );
});

VariantRow.displayName = 'VariantRow';

const VariantGroup = memo(({ variantGroup, title, showVariantReconcileStatus }) => (
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
          showVariantReconcileStatus={showVariantReconcileStatus}
        />
      ))}
    </div>
  </BlockStack>
));
VariantGroup.displayName = 'VariantGroup';

function previewListingText(value) {
  if (value == null) return "—";
  if (typeof value === "string") return value.trim() || "—";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "—";
}

function collectionLabelForPreview(collection) {
  if (!collection) return "—";
  const lab = collection.label;
  if (typeof lab === "string" && lab.trim()) return lab.trim();
  return "—";
}

const ProductVariantCheck = ({
  productData,
  onImageUpload,
  /** Overrides collection label row when form state is fresher than `productData.collection`. */
  listingCollection,
  /** Plain-text Shopify body; shown with TextField when `onDescriptionPlainTextChange` is passed. */
  descriptionPlainText,
  onDescriptionPlainTextChange,
  descriptionPlaceholder = "Please write a description",
  /** Optional ref on a wrapper for scroll-into-view (create flow after Preview). */
  previewScrollRef,
  /** When true, show whether each row maps to an existing Shopify variant (update flow). */
  showVariantReconcileStatus = false,
}) => {
  if (!productData?.variants?.length) return null;

  const baseVariants = productData.variants.filter(v => v && !v.isCustom);
  const customVariants = productData.variants.filter(v => v && v.isCustom);

  const { title, seoTitle, mainHandle, tags, descriptionHTML, seoDescription } = productData;

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
  const handleAdditionalViewUpload = (sku, label, displayUrl, data) => {
    if (!onImageUpload) return;
    
    // For additional views, we'll use the baseSKU as the identifier
    onImageUpload(sku, label, displayUrl, data);
  };

  const collectionSource = listingCollection ?? productData.collection;

  return (
    <div ref={previewScrollRef ?? undefined}>
      <BlockStack gap="400">
        <BlockStack gap="100">
          <Text as="p" variant="bodyMd">
            <Text as="span" fontWeight="semibold">
              Collection:{" "}
            </Text>
            {collectionLabelForPreview(collectionSource)}
          </Text>
          <Text as="p" variant="bodyMd">
            <Text as="span" fontWeight="semibold">
              Listing title:{" "}
            </Text>
            {previewListingText(title)}
          </Text>
          <Text as="p" variant="bodyMd">
            <Text as="span" fontWeight="semibold">
              Listing SEO title:{" "}
            </Text>
            {previewListingText(seoTitle)}
          </Text>
        </BlockStack>

        {typeof onDescriptionPlainTextChange === "function" && (
          <TextField
            label="Description"
            multiline={6}
            autoComplete="off"
            value={descriptionPlainText ?? ""}
            onChange={onDescriptionPlainTextChange}
            placeholder={descriptionPlaceholder}
          />
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
            showVariantReconcileStatus={showVariantReconcileStatus}
          />
        )}

        {/*
         * Additional Views (product-level Back View / Inside View) — uses `baseSKU` instead of a
         * variant SKU, so it's intentionally separate from the per-variant images captured in the
         * shape rows above. Drive compression is wired in `googleDrive.js`, so the same 10MB cap
         * fix applies here automatically.
         */}
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
            showVariantReconcileStatus={showVariantReconcileStatus}
          />
        )}
      </BlockStack>
    </div>
  );
};

ProductVariantCheck.displayName = 'ProductVariantCheck';

export default memo(ProductVariantCheck);