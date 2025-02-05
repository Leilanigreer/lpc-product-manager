// hooks/useFormNotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';

export const useFormNotifications = ({ fetcher, handleChange, onSuccess }) => {
  const [notification, setNotification] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [successDetails, setSuccessDetails] = useState(null);
  
  // Track the last processed response to prevent loops
  const lastProcessedResponseRef = useRef(null);

  const handleSuccess = useCallback((data) => {
    const productId = data.product.id.replace('gid://shopify/Product/', '');
    const shopDomain = data.shop?.myshopifyDomain?.replace('.myshopify.com', '');
    const host = data.shop?.host;
    const productHandle = data.databaseSave.mainProduct.mainHandle;

    if (productId && shopDomain && host && productHandle) {
      // Set all states in a single batch
      const details = {
        productId,
        shopDomain,
        host,
        productHandle
      };

      setSuccessDetails(details);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Call callbacks after state updates
      setTimeout(() => {
        handleChange('resetForm');
        if (onSuccess) {
          onSuccess();
        }
      }, 0);
    } else {
      console.error('Missing required data:', { productId, shopDomain, host, productHandle });
      setNotification({
        message: "Product created but some data is missing",
        status: "warning"
      });
    }
  }, [handleChange, onSuccess]);

  const handleError = useCallback((errors) => {
    const errorMessage = errors.join(', ');
    setSubmissionError(errorMessage);
    setNotification({
      message: errorMessage,
      status: "critical"
    });
  }, []);

  useEffect(() => {
    const data = fetcher.data;
    const responseKey = JSON.stringify(data); // Create a key to track this response
    
    // Only process if this is a new response we haven't seen before
    if (fetcher.state === 'idle' && 
        data && 
        responseKey !== lastProcessedResponseRef.current) {
      
      // Mark this response as processed
      lastProcessedResponseRef.current = responseKey;

      if (data.product && data.shop && data.databaseSave?.mainProduct) {
        handleSuccess(data);
      } else if (data.errors) {
        handleError(data.errors);
      }
    }
  }, [fetcher.state, fetcher.data, handleSuccess, handleError]);

  return {
    notification,
    setNotification,
    submissionError,
    setSubmissionError,
    successDetails,
    setSuccessDetails
  };
};