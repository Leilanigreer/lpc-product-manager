// components/ProductSuccessBanner.jsx
import { Banner, Text, BlockStack, InlineStack, Box, Button, List } from '@shopify/polaris';
import { ExternalSmallIcon } from '@shopify/polaris-icons';

/**
 * After-submit banner. Two modes:
 *  - Pure success → green "Product Created Successfully" banner with Shopify + live-product links.
 *  - Success with per-variant Drive upload failures → yellow "Product created, but…" banner that
 *    lists the failed `{sku} — {label}` entries and links to the Drive folder (when known) so Karl
 *    can drop the missing files in by hand. Shopify never received variant images either way (see
 *    `app/lib/server/shopifyOperations.server.js` header comment), so the product itself is fully
 *    intact — only the Drive side has gaps to fill.
 */
const ProductSuccessBanner = ({
  onDismiss,
  productId,
  shopDomain,
  host,
  productHandle,
  /** Array of `{ sku, label, error }` entries from `handleSubmit`'s per-variant upload loop. */
  failedImages,
  /** Google Drive folder URL for the just-created product (when at least one Drive call succeeded). */
  googleDriveFolderUrl,
}) => {
  const hasFailures = Array.isArray(failedImages) && failedImages.length > 0;
  const adminUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
  const liveUrl = `https://${host}/products/${productHandle}`;

  return (
    <Box paddingBlock="400">
      <Banner
        title={
          hasFailures
            ? "Product created — some images failed to upload"
            : "Product Created Successfully"
        }
        status={hasFailures ? "warning" : "success"}
        onDismiss={onDismiss}
      >
        <BlockStack gap="400">
          <Text>
            {hasFailures
              ? "Your product was created in Shopify. The variant images below could not be uploaded to Google Drive — please add them manually until a re-upload flow exists."
              : "Your product has been created and is now available in your Shopify store."}
          </Text>

          {hasFailures && (
            <BlockStack gap="200">
              <Text fontWeight="semibold" as="p">
                Images that need to be uploaded by hand:
              </Text>
              <List type="bullet">
                {failedImages.map((f, idx) => {
                  const ident = f.sku
                    ? `${f.sku} — ${f.label}`
                    : `${f.shapeValue ?? "unknown shape"} — ${f.label}`;
                  return (
                    <List.Item key={`${ident}-${idx}`}>
                      <Text as="span">{ident}</Text>
                      {f.error ? (
                        <Text as="span" tone="subdued"> ({f.error})</Text>
                      ) : null}
                    </List.Item>
                  );
                })}
              </List>
              {!googleDriveFolderUrl && (
                <Text tone="subdued" as="p" variant="bodySm">
                  No Drive folder URL was returned for this product — the folder may not have been
                  created yet. Add the files using the existing Drive structure for this collection.
                </Text>
              )}
            </BlockStack>
          )}

          <InlineStack gap="300" align="start">
            <Button
              icon={ExternalSmallIcon}
              onClick={() => window.open(adminUrl, '_blank')}
            >
              View in Shopify Admin
            </Button>
            <Button
              primary
              icon={ExternalSmallIcon}
              onClick={() => window.open(liveUrl, '_blank')}
            >
              View Live Product
            </Button>
            {hasFailures && googleDriveFolderUrl && (
              <Button
                icon={ExternalSmallIcon}
                onClick={() => window.open(googleDriveFolderUrl, '_blank')}
              >
                Open Google Drive folder
              </Button>
            )}
          </InlineStack>
        </BlockStack>
      </Banner>
    </Box>
  );
};

ProductSuccessBanner.displayName = 'ProductSuccessBanner';

export default ProductSuccessBanner;
