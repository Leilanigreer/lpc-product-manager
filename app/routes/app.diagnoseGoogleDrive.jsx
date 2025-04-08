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
  List,
  Code,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export default function DiagnoseGoogleDrive() {
  const fetcher = useFetcher();
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDiagnose = () => {
    setIsLoading(true);
    setError(null);
    fetcher.load("/api/diagnose/googledrive");
  };

  useEffect(() => {
    if (fetcher.data) {
      setDiagnosticResult(fetcher.data);
      setIsLoading(false);
      
      if (fetcher.data.error) {
        setError(fetcher.data.error);
      }
    }
  }, [fetcher.data]);

  return (
    <Page title="Diagnose Google Drive Authentication">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Google Drive Authentication Diagnostic
              </Text>
              
              <Text as="p">
                This page helps diagnose Google Drive authentication issues.
                Click the button below to run diagnostics.
              </Text>
              
              <Button
                primary
                onClick={handleDiagnose}
                loading={isLoading}
              >
                Run Diagnostics
              </Button>
              
              {error && (
                <Banner status="critical">
                  <p>Diagnostic failed: {error}</p>
                </Banner>
              )}
              
              {diagnosticResult && (
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">
                      Diagnostic Results
                    </Text>
                    
                    <List>
                      <List.Item>
                        Environment: {diagnosticResult.environment || "unknown"}
                      </List.Item>
                      <List.Item>
                        Private Key Format: {diagnosticResult.privateKeyFormat || "unknown"}
                      </List.Item>
                      <List.Item>
                        Auth Client Created: {diagnosticResult.authClientCreated ? "Yes" : "No"}
                      </List.Item>
                      {diagnosticResult.authError && (
                        <List.Item>
                          Auth Error: {diagnosticResult.authError}
                        </List.Item>
                      )}
                      <List.Item>
                        Timestamp: {diagnosticResult.timestamp || "unknown"}
                      </List.Item>
                    </List>
                    
                    <Text as="h4" variant="headingSm">
                      Environment Variables
                    </Text>
                    
                    <List>
                      {Object.entries(diagnosticResult.envVars || {}).map(([key, value]) => (
                        <List.Item key={key}>
                          {key}: {value ? "Set" : "Not set"}
                        </List.Item>
                      ))}
                    </List>
                    
                    <Text as="h4" variant="headingSm">
                      Raw Diagnostic Data
                    </Text>
                    
                    <Code>
                      {JSON.stringify(diagnosticResult, null, 2)}
                    </Code>
                  </BlockStack>
                </Card>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 