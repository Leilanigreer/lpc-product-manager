import React from 'react';
import { Banner, Button, Text, BlockStack, Card } from '@shopify/polaris';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Error caught by boundary:', error, errorInfo);

    // Update state with error details
    this.setState({ error, errorInfo });

    // If an onError callback was provided, call it
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Use fallback if provided, otherwise show default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card>
          <BlockStack gap="400">
            <Banner
              title="An error occurred"
              status="critical"
              onDismiss={this.handleReset}
            >
              <Text as="p" variant="bodyMd">
                {this.props.errorMessage || 'There was a problem loading this component.'}
              </Text>
            </Banner>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Error Details:</Text>
                <details style={{ whiteSpace: 'pre-wrap' }}>
                  <summary>
                    <Text as="span" color="subdued">
                      {this.state.error?.toString()}
                    </Text>
                  </summary>
                  <Text as="p" color="subdued">
                    {this.state.errorInfo?.componentStack}
                  </Text>
                </details>
              </BlockStack>
            )}

            <Button onClick={this.handleReset}>
              Try Again
            </Button>
          </BlockStack>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Add prop types for better documentation
ErrorBoundary.defaultProps = {
  onError: undefined,
  fallback: null,
  errorMessage: ''
};

export default ErrorBoundary;