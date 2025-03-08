import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, Outlet } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { TitleBar } from "@shopify/app-bridge-react";
import { loader as rootLoader } from "../lib/loaders/index.js";
import { OPTION_TYPE_DISPLAY_NAMES, getOptionTypeDisplayName } from "../lib/utils/optionTypeMapping";

import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  ResourceList,
  ResourceItem,
  Filters,
  ChoiceList,
  Loading,
  Frame,
  Modal,
} from "@shopify/polaris";
import {
  DeleteIcon,
  DragHandleIcon,
  PlusIcon,
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
  await authenticate.admin(request);

  // Get options data from our centralized data loader
  const { options } = await rootLoader();
  
  return { options };
};


export default function WebsiteOptionSetsCreator() {
  const [optionSets, setOptionSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedType, setSelectedType] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { options } = useLoaderData();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Set loading to false once data is loaded
    if (options) {
      setIsLoading(false);
    }
  }, [options]);

  if (isLoading) {
    return (
      <Frame>
        <Page>
          <Loading />
        </Page>
      </Frame>
    );
  }

  const handleDiscard = () => {
    navigate("/app/websiteCustomOptionSets");
  };

  const handleSubmit = () => {
    setIsSaving(true);
    console.log('Submitting:', activeSet);
    // Add submission logic here
  };

  const handleOptionSelect = (selectedIds) => {
    setSelectedOptions(selectedIds);
  };

  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
  };

  const filterControl = (
    <Filters
      queryValue={searchValue}
      queryPlaceholder="Search options"
      onQueryChange={handleSearchChange}
      onQueryClear={() => setSearchValue('')}
      filters={[
        {
          key: 'type',
          label: 'Type',
          filter: (
            <ChoiceList
              title="Option Type"
              titleHidden
              choices={Object.entries(OPTION_TYPE_DISPLAY_NAMES).map(([value, label]) => ({
                label,
                value,
              }))}
              selected={selectedType}
              onChange={handleTypeChange}
              allowMultiple
            />
          ),
        },
      ]}
    />
  );

  const filteredOptions = options
    .filter(option => 
      (searchValue === '' || option.name.toLowerCase().includes(searchValue.toLowerCase())) &&
      (selectedType.length === 0 || selectedType.includes(option.layout.type))
    );
 
  return (
    <Frame>
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
              <Button
                icon={PlusIcon}
                accessibilityLabel="Add Option"
                onClick={() => setIsModalOpen(true)}
              >
                Add Option
              </Button>
              <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add options to option sets"
                primaryAction={{
                  content: 'Add Options',
                  onAction: () => {
                    // Handle adding selected options
                    const selectedOptionData = options.filter(opt => selectedOptions.includes(opt.id));
                    setActiveSet(prev => ({
                      ...prev,
                      options: [...(prev?.options || []), ...selectedOptionData]
                    }));
                    setIsModalOpen(false);
                  }
                }}
                secondaryActions={[
                  {
                    content: 'Cancel',
                    onAction: () => setIsModalOpen(false)
                  }
                ]}
              >
                <Modal.Section>
                  <ResourceList
                    resourceName={{ singular: 'option', plural: 'options' }}
                    items={filteredOptions}
                    renderItem={(item) => {
                      const { id, name, layout } = item;
                      return (
                        <ResourceItem
                          id={id}
                          name={name}
                          accessibilityLabel={`Select ${name}`}
                        >
                          <h3>
                            <Text variant="bodyMd" fontWeight="bold" as="span">
                              {name}
                            </Text>
                          </h3>
                          <div>Type: {getOptionTypeDisplayName(layout.type)}</div>
                        </ResourceItem>
                      );
                    }}
                    selectedItems={selectedOptions}
                    onSelectionChange={handleOptionSelect}
                    filterControl={filterControl}
                    selectable
                  />
                </Modal.Section>
              </Modal>
            </Card>
            <Card>
                <Text variant="headingMd" as="h2">
                  Placeholder for Rules
                </Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}