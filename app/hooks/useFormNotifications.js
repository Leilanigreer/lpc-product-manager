// hooks/useFormNotifications.js

import { useState, useEffect } from 'react';
import { initialFormState } from '../lib/forms/formState';

export const useFormNotifications = ({ fetcher, handleChange }) => {
  const [notification, setNotification] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [successDetails, setSuccessDetails] = useState(null);

  useEffect(() => {
    if (fetcher.data?.product && fetcher.data?.shop && fetcher.data?.databaseSave?.mainProduct) {
      const productId = fetcher.data.product.id.replace('gid://shopify/Product/', '');
      const shopDomain = fetcher.data.shop?.myshopifyDomain?.replace('.myshopify.com', '');
      const host = fetcher.data.shop?.host;
      const productHandle = fetcher.data.databaseSave.mainProduct.mainHandle;

      if (productId && shopDomain && host && productHandle) {
        setSuccessDetails({
          productId,
          shopDomain,
          host,
          productHandle
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Reset form state
        Object.entries(initialFormState).forEach(([key, value]) => {
          handleChange(key, value);
        });

      } else {
        console.error('Missing required data:', { productId, shopDomain, host, productHandle });
        setNotification({
          message: "Product created but some data is missing",
          status: "warning"
        });
      }
    } else if (fetcher.data?.errors) {
      const errorMessage = fetcher.data.errors.join(', ');
      setSubmissionError(errorMessage);
      setNotification({
        message: errorMessage,
        status: "critical"
      });
    }
  }, [fetcher.data, handleChange]);

  return {
    notification,
    setNotification,
    submissionError,
    setSubmissionError,
    successDetails,
    setSuccessDetails
  };
};