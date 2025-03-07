import { useState } from "react";
import { useLoaderData, useNavigate, Outlet } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { TitleBar } from "@shopify/app-bridge-react";

import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Button,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import {
  DeleteIcon,
  DragHandleIcon,
} from '@shopify/polaris-icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return json({});
};

export default function WebsiteOptionSetsCreator() {
  const [optionSets, setOptionSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [selectedOptionType, setSelectedOptionType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { admin } = useLoaderData();

  const handleDiscard = () => {
    navigate("/app/websiteCustomOptionSets");
  };

  const handleSubmit = () => {
    setIsSaving(true);
    console.log('Submitting:', activeSet);
    // Add submission logic here
  };
 
  return (
    <Page fullWidth>
      <TitleBar title="Create Option Set"/>
        {/* <button onClick={handleDiscard}>Discard</button>
        <button variant="primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </TitleBar> */}
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="200">
                <TextField
                  label="Option Set Name"
                  helpText="This is not visible to customers"
                  value={activeSet?.name || ""}
                  onChange={(value) => setActiveSet({ ...activeSet, name: value })}
                />
                <TextField 
                  label="Rank"
                  value={activeSet?.rank || ""}
                  onChange={(value) => setActiveSet({ ...activeSet, rank: value })}
                />
              </InlineStack>
                <TextField 
                  label="Option Set Description"
                  value={activeSet?.description || ""}
                  onChange={(value) => setActiveSet({ ...activeSet, description: value })}
                />
            </BlockStack>
          </Card>
          <Card>
            <Text variant="headingMd" as="h2">
              Options
            </Text>
          </Card>
          <Card>
            <Card.Section>
              <Text variant="headingMd" as="h2">
                Placeholder for options
              </Text>
            </Card.Section> */}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}