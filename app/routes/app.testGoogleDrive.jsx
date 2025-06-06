import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Button,
  Banner,
  Text,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export default function TestGoogleDrive() {
  const fetcher = useFetcher();
  const [authResult, setAuthResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTestAuth = () => {
    setIsLoading(true);
    setError(null);
    fetcher.load("/api/test/googledrive");
  };

  useEffect(() => {
    if (fetcher.data) {
      setAuthResult(fetcher.data);
      setIsLoading(false);
      
      if (!fetcher.data.success) {
        setError(fetcher.data.error);
      }
    }
  }, [fetcher.data]);

  return (
    <Page title="Test Google Drive Authentication">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Google Drive Authentication Test
              </Text>
              
              <Text as="p">
                This page allows you to test the Google Drive authentication without uploading any files.
                Click the button below to test the authentication.
              </Text>
              
              <Button
                primary
                onClick={handleTestAuth}
                loading={isLoading}
              >
                Test Authentication
              </Button>
              
              {error && (
                <Banner status="critical">
                  <p>Authentication failed: {error}</p>
                </Banner>
              )}
              
              {authResult && authResult.success && (
                <Banner status="success">
                  <p>Authentication successful!</p>
                  <p>Authenticated as: {authResult.user.emailAddress}</p>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 