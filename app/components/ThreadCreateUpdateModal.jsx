import React from "react";
import { Modal, BlockStack } from "@shopify/polaris";

export default function ThreadCreateUpdateModal({
  open,
  onClose,
  title,
  primaryAction,
  secondaryActions,
  children
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      <Modal.Section>
        <BlockStack gap="200">
          {children}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 