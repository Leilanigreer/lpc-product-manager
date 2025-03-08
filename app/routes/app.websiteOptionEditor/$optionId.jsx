import { useState } from "react";
import { useLoaderData, useSearchParams, useSubmit, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  Banner,
} from "@shopify/polaris";
import { preventWheelChange } from "../styles/shared/inputs.js";
import Option from "../components/WebsiteCustomOptions/Option.jsx";
import { getOptionById, updateCustomOption } from "../lib/server/websiteCustomization.server.js";
import { loader as rootLoader } from "../lib/loaders/index.js";

export const loader = async ({ params }) => {
  console.log("Loader params:", params); // Debug log
  const { optionId } = params;
  
  try {
    const option = await getOptionById(optionId);
    console.log("Loaded option:", option); // Debug log
    
    if (!option) {
      return json({ 
        error: "Option not found",
        option: null 
      });
    }

    return json({ option });
  } catch (error) {
    console.error("Loader error:", error);
    return json({ 
      error: error.message,
      option: null 
    });
  }
};

export default function EditOptionPage() {
  const { option, error } = useLoaderData();
  const submit = useSubmit();
  const navigate = useNavigate();
  
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize options with default values if no data
  const [options, setOptions] = useState(option || {
    name: '',
    type: 'CHECKBOX',
    values: [],
    required: false,
    description: '',
  });

  const handleOptionUpdate = (updates) => {
    setOptions(prev => ({
      ...prev,
      ...updates
    }));
    setIsDirty(true);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.entries(options).forEach(([key, value]) => {
        if (key === 'values') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value?.toString() || '');
        }
      });

      await submit(formData, { method: 'post' });
      navigate('/app/websiteCustomizationLanding');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    navigate('/app/websiteCustomizationLanding');
  };

  return (
    <Page fullWidth>
      <style>{preventWheelChange}</style>
      <TitleBar
        title={option ? `Edit Option: ${option.name}` : "Edit Option"}
        primaryAction={{
          content: isSaving ? 'Saving...' : 'Save',
          onAction: handleSubmit,
          disabled: !isDirty || isSaving
        }}
        secondaryActions={[
          {
            content: 'Discard',
            onAction: handleDiscard
          }
        ]}
      />
      
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Option Details</Text>
              {option ? (
                <Option
                  {...options}
                  onUpdate={handleOptionUpdate}
                  isEditing={true}
                />
              ) : (
                <Banner status="info">
                  <p>Loading option details or no option found.</p>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 