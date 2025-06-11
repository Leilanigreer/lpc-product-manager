import React from 'react';
import { Banner, Box } from '@shopify/polaris';

/**
 * Reusable SuccessBanner for displaying success/info/critical messages.
 *
 * Props:
 * - show: boolean (controls visibility)
 * - onDismiss: function (called when banner is dismissed)
 * - message: string (message to display)
 * - status: string (Polaris Banner status, defaults to 'success')
 */
const SuccessBanner = ({ show, onDismiss, message, status = 'success' }) => {
  if (!show) return null;
  return (
    <Box paddingBlock="400">
      <Banner status={status} onDismiss={onDismiss}>
        {message}
      </Banner>
    </Box>
  );
};

export default SuccessBanner; 