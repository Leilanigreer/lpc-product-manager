import React from "react";
import { Modal, Text, BlockStack } from "@shopify/polaris";

export default function ThreadReassignNumberModal({
  open,
  onClose,
  numberLabel,
  currentThread,
  onConfirm
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reassign Number?"
      primaryAction={{ content: "Reassign", onAction: onConfirm }}
      secondaryActions={[
        { content: "Cancel", onAction: onClose }
      ]}
    >
      <Modal.Section>
        <BlockStack gap="200">
          <Text>
            The number <b>{numberLabel}</b> is currently linked to <b>{currentThread}</b>.<br />
            Do you want to reassign it to this thread color?
          </Text>
          <Text color="critical">
            This will remove the number from the previous thread color.
          </Text>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 