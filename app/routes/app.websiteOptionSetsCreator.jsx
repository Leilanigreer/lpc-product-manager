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
  Select,
  Listbox,
  Combobox,
  Tag,
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
import OptionValues from "../components/WebsiteCustomOptions/OptionValues.jsx";
import RulesModal from "../components/WebsiteCustomOptions/RulesModal.jsx";

function SortableItem({ id, children, index, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: 'var(--p-surface)',
    borderRadius: 'var(--p-border-radius-2)',
    border: '1px solid var(--p-border-subdued)',
    marginBottom: '4px'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '12px 16px',
        width: '100%',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Button icon={DragHandleIcon} {...listeners} />
          {children}
        </div>
        <Button icon={DeleteIcon} onClick={() => onDelete(id)} />
      </div>
    </div>
  );
}


export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // Get options data from our centralized data loader
  const { options } = await rootLoader();
  
  return { options };
};


export default function WebsiteOptionSetsCreator() {
  const [optionSets, setOptionSets] = useState([]);
  const [activeSet, setActiveSet] = useState({
    name: '',
    rank: '',
    description: '',
    options: []
  });
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedType, setSelectedType] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { options } = useLoaderData();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setActiveSet(prev => {
        const oldIndex = prev.options.findIndex((item) => item.id === active.id);
        const newIndex = prev.options.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(prev.options, oldIndex, newIndex);
        // Update displayOrder after reordering
        const updatedItems = reorderedItems.map((item, index) => ({
          ...item,
          displayOrder: index
        }));
        return {
          ...prev,
          options: updatedItems
        };
      });
    }
  };

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

  const handleDeleteOption = (optionId) => {
    setActiveSet(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== optionId)
    }));
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

  // Add a function to generate a unique ID
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  };

  // Get available operators based on the selected option
  const getOperators = () => [
    { label: 'is one of', value: 'is' },
    { label: 'is not one of', value: 'is not' },
    { label: 'is empty', value: 'is empty' },
    { label: 'is not empty', value: 'is not empty' },
  ];

  // Get option values for the selected option
  const getOptionValues = (optionId) => {
    const option = activeSet.options.find(opt => opt.id === optionId);
    if (!option || !option.OptionValue) return [{ label: 'All', value: 'all' }];
    
    const values = option.OptionValue.map(value => ({
      label: value.name || '',
      value: value.id
    }));
    
    return [
      { label: 'All', value: 'all' },
      ...values
    ];
  };

  // Get selected values display text
  const getSelectedValuesText = (selectedValues, allValues) => {
    if (selectedValues.includes('all')) return 'All';
    if (selectedValues.length === 0) return 'Select values';
    
    // Get the actual selected value labels
    const selectedLabels = allValues
      .filter(value => selectedValues.includes(value.value))
      .map(value => value.label);
    
    return selectedLabels.join(', ');
  };

  // Filter values based on search
  const filterValues = (values, searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return values.filter(({label}) => 
      label.toLowerCase().includes(normalizedSearchTerm)
    );
  };

  // Handle rule save
  const handleRuleSave = (newRule) => {
    console.log('Saving rule:', newRule);
    setIsRuleModalOpen(false);
  };

  return (
    <Frame>
      <Page fullWidth>
        <TitleBar title="Create Option Set"/>
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
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Options
                </Text>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={activeSet.options}
                      strategy={verticalListSortingStrategy}
                    >
                      {activeSet.options.map((option, index) => (
                        <SortableItem 
                          key={option.id} 
                          id={option.id} 
                          index={index}
                          onDelete={handleDeleteOption}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <Text variant="bodyMd" fontWeight="semibold" as="p">
                              {option.nickname || option.name}
                            </Text>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <Text variant="bodySm" as="p" color="subdued">
                                {getOptionTypeDisplayName(option.layout.type)}
                              </Text>
                              <Text variant="bodySm" as="p" color="subdued">
                                •
                              </Text>
                              <Text variant="bodySm" as="p" color="subdued">
                                {option.OptionValue?.length || 0} values
                              </Text>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
                <div>
                  <Button
                    icon={PlusIcon}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Add Option
                  </Button>
                </div>
              </BlockStack>

              <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add options to option sets"
                primaryAction={{
                  content: 'Add Options',
                  onAction: () => {
                    // Handle adding selected options with unique IDs
                    const selectedOptionData = options
                      .filter(opt => selectedOptions.includes(opt.id))
                      .map(opt => {
                        // Keep all the original option data
                        const newOption = {
                          ...opt,
                          originalId: opt.id,
                          id: `${opt.id}_${generateUniqueId()}`,
                          displayOrder: activeSet.options.length,
                          // Preserve the OptionValue array exactly as it is
                          OptionValue: opt.OptionValue ? [...opt.OptionValue] : []
                        };
                        return newOption;
                      });

                    setActiveSet(prev => ({
                      ...prev,
                      options: [...(prev?.options || []), ...selectedOptionData]
                    }));
                    setSelectedOptions([]);
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
              <ResourceList
                resourceName={{ singular: 'rule', plural: 'rules' }}
                items={[]}
                renderItem={() => {
                  return <div>Rule</div>;
                }}
              />
              <RulesModal
                isOpen={isRuleModalOpen}
                onClose={() => setIsRuleModalOpen(false)}
                onSave={handleRuleSave}
                activeSet={activeSet}
                getOptionValues={getOptionValues}
                filterValues={filterValues}
              />
              <Button
                icon={PlusIcon}
                onClick={() => setIsRuleModalOpen(true)}
              >
                Create Rule
              </Button>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}