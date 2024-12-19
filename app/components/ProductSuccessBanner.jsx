// components/ProductSuccessBanner.jsx
import { Banner, Text, BlockStack, InlineStack, Box, Button } from '@shopify/polaris';
import { ExternalSmallIcon } from '@shopify/polaris-icons';

export function ProductSuccessBanner({ 
  onDismiss, 
  productId, 
  shopDomain, 
  host, 
  productHandle 
}) {
  return (
    <Box paddingBlock="400">
      <Banner
        title="Product Created Successfully"
        status="success"
        onDismiss={onDismiss}
      >
        <BlockStack gap="400">
          <Text>
            Your product has been created and is now available in your Shopify store.
          </Text>
          <InlineStack gap="300" align="start">
            <Button
              icon={ExternalSmallIcon}
              onClick={() => 
                window.open(
                  `https://admin.shopify.com/store/${shopDomain}/products/${productId}`,
                  '_blank'
                )
              }
            >
              View in Shopify Admin
            </Button>
            <Button
              primary
              icon={ExternalSmallIcon}
              onClick={() => 
                window.open(
                  `https://${host}/products/${productHandle}`,
                  '_blank'
                )
              }
            >
              View Live Product
            </Button>
          </InlineStack>
        </BlockStack>
      </Banner>
    </Box>
  );
}