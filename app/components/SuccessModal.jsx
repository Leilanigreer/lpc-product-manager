import React from 'react';
import { Modal, Button, BlockStack, Text, InlineStack } from "@shopify/polaris";

const SuccessModal = ({ 
  open, 
  onClose, 
  productId, 
  shopDomain,
  host,
  productHandle
}) => {
  const shopifyAdminUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
  const liveProductUrl = `https://${host}/products/${productHandle}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Product Created Successfully"
    >
      <Modal.Section>
        <BlockStack>
          <Text as="p">
            Your product has been created and is now available in your Shopify store.
          </Text>
          <InlineStack gap="3" align="center" className="mt-4">
            <Button 
              variant="secondary" 
              onClick={() => window.open(shopifyAdminUrl, '_blank')}
            >
              View in Shopify Admin
            </Button>
            <Button 
              variant="default"
              onClick={() => window.open(liveProductUrl, '_blank')}
            >
              View Live Product
            </Button>
          </InlineStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
};

export default SuccessModal;