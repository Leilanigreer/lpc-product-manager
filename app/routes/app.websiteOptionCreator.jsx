import { useState, useMemo, useEffect } from "react";
import { useLoaderData, useSearchParams, useSubmit, useNavigate } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
} from "@shopify/polaris";
import { preventWheelChange } from "../styles/shared/inputs.js";
import { loader as rootLoader } from "../lib/loaders/index.js";
import { createCustomOption, updateCustomOption } from "../lib/server/websiteCustomization.server.js";
import { getOptionTags } from "../lib/utils/dataFetchers.js";
import Option from "../components/WebsiteCustomOptions/Option.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const optionId = url.searchParams.get('id');
  
  const { optionLayouts, options } = await rootLoader();
  const optionTags = await getOptionTags();
  
  let option = null;
  if (optionId) {
    option = options.find(opt => opt.id === optionId);
    
    if (!option) {
      console.error('Option not found in loaded options');
      return { 
        error: `Option with ID ${optionId} not found`,
        optionLayouts, 
        optionTags, 
        option: null 
      };
    }
  }

  return { optionLayouts, optionTags, option };
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const isEditing = formData.get('isEditing') === 'true';
  
  try {
    // Get the layout ID based on the type
    const { optionLayouts } = await rootLoader();
    
    if (!optionLayouts || !Array.isArray(optionLayouts)) {
      throw new Error('Failed to load option layouts');
    }

    const layout = optionLayouts.find(l => l.type === data.type);
    
    if (!layout) {
      throw new Error(`No layout found for type: ${data.type}`);
    }

    // Clean up the data
    const cleanedData = {
      name: data.name,
      type: data.type,
      layoutId: layout.id,
      required: data.required === 'true',
      ...(layout.optionValues && data.values ? {
        values: JSON.parse(data.values).map(v => ({
          name: v.name,
          displayOrder: v.displayOrder || 0,
          default: v.default || false,
          associatedProductId: v.associatedProductId || null,
          imageUrl: v.imageUrl || null
        }))
      } : {}),
      ...(layout.nickname && data.nickname && { nickname: data.nickname }),
      ...(layout.description && data.description && { description: data.description }),
      ...(layout.inCartName && data.inCartName && { inCartName: data.inCartName }),
      ...(layout.allowedTypes && data.allowedTypes && { allowedTypes: data.allowedTypes }),
      ...(layout.minSelectable && data.minSelectable && { minSelectable: data.minSelectable }),
      ...(layout.maxSelectable && data.maxSelectable && { maxSelectable: data.maxSelectable }),
      ...(layout.allowMultipleSelections && data.allowMultipleSelections === 'true' && { allowMultipleSelections: true }),
      ...(layout.placeholderText && data.placeholderText && { placeholderText: data.placeholderText }),
      ...(layout.minCharLimit && data.minCharLimit && { minCharLimit: data.minCharLimit }),
      ...(layout.maxCharLimit && data.maxCharLimit && { maxCharLimit: data.maxCharLimit }),
      ...(layout.minNumber && data.minNumber && { minNumber: data.minNumber }),
      ...(layout.maxNumber && data.maxNumber && { maxNumber: data.maxNumber })
    };

    // If editing, include the ID and use updateCustomOption
    if (isEditing) {
      cleanedData.id = data.id;
      const updatedOption = await updateCustomOption(cleanedData);
      return { option: updatedOption };
    }

    // Otherwise create new option
    const newOption = await createCustomOption(cleanedData);
    return { option: newOption };
  } catch (error) {
    console.error('Error in action:', error);
    return { 
      error: error.message,
      details: error.stack
    };
  }
};

export default function OptionsPage() {
  // eslint-disable-next-line no-unused-vars
  const { optionLayouts, optionTags, option: existingOption } = useLoaderData();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || (existingOption?.layout?.type || 'CHECKBOX');
  const isEditing = !!existingOption;
  const submit = useSubmit();
  const navigate = useNavigate();
  
  const initialOptions = useMemo(() => {
    if (existingOption) {
      return {
        id: existingOption.id,
        type: existingOption.layout.type,
        name: existingOption.name || '',
        values: existingOption.OptionValue || [],
        nickname: existingOption.nickname || '',
        required: existingOption.required || false,
        description: existingOption.description || '',
        minSelectable: existingOption.minSelectable || '',
        maxSelectable: existingOption.maxSelectable || '',
        inCartName: existingOption.inCartName || '',
        allowedTypes: existingOption.allowedTypes || '',
        allowMultipleSelections: existingOption.allowMultipleSelections || false,
        placeholderText: existingOption.placeholderText || '',
        minCharLimit: existingOption.minCharLimit || '',
        maxCharLimit: existingOption.maxCharLimit || '',
        minNumber: existingOption.minNumber || '',
        maxNumber: existingOption.maxNumber || '',
        tags: existingOption.tags || []
      };
    }
    
    return {
      type: initialType,
      name: '',
      values: [],
      nickname: '',
      required: false,
      description: '',
      minSelectable: '',
      maxSelectable: '',
      inCartName: '',
      allowedTypes: '',
      allowMultipleSelections: false,
      placeholderText: '',
      minCharLimit: '',
      maxCharLimit: '',
      minNumber: '',
      maxNumber: '',
      tags: []
    };
  }, [existingOption, initialType]);
  
  const [options, setOptions] = useState(initialOptions);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Function to deeply compare two objects
  const hasChanges = useMemo(() => {
    const compareValues = (value1, value2) => {
      // Convert empty strings to null for comparison
      const normalizeValue = (val) => val === '' ? null : val;
      
      // Handle arrays
      if (Array.isArray(value1) && Array.isArray(value2)) {
        if (value1.length !== value2.length) {
          return true;
        }
        return value1.some((item, index) => {
          const item2 = value2[index];
          if (typeof item === 'object' && item !== null) {
            return Object.keys(item).some(key => 
              normalizeValue(item[key]) !== normalizeValue(item2?.[key])
            );
          }
          return normalizeValue(item) !== normalizeValue(item2);
        });
      }
      
      // Handle primitive values
      if (typeof value1 !== 'object' || value1 === null) {
        return normalizeValue(value1) !== normalizeValue(value2);
      }
      
      // Handle objects
      return Object.keys(value1).some(key => {
        if (key === 'id') return false; // Skip id comparison
        return compareValues(value1[key], value2[key]);
      });
    };

    return compareValues(options, initialOptions);
  }, [options, initialOptions]);

  // Update isDirty based on actual changes
  useEffect(() => {
    setIsDirty(hasChanges);
  }, [hasChanges]);

  const handleOptionUpdate = (updates) => {
    setOptions(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleSubmit = async () => {
    if (!hasChanges) {
      return;
    }
    
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      // Add isEditing flag
      formData.append('isEditing', isEditing);
      if (isEditing) {
        formData.append('id', existingOption.id);
      }
      
      Object.entries(options).forEach(([key, value]) => {
        if (key === 'values') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'tags') {
          formData.append(key, JSON.stringify(value.map(tag => tag.value)));
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
    if (hasChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    navigate('/app/websiteCustomizationLanding');
  };

  // Debug render
  console.log('Render state:', { isDirty, isSaving, hasChanges });

  const showSaveBar = isDirty && options.name.trim() !== '';


  return (
    <Page fullWidth>
      <style>{preventWheelChange}</style>
      <TitleBar
        title={isEditing ? `Edit Option: ${existingOption?.name}` : "Create Option"}>
          {showSaveBar && (
            <>
              <button onClick={handleDiscard}>Discard</button>
              <button variant="primary" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </TitleBar>
      
      <Layout>
        <Option
          {...options}
          onUpdate={handleOptionUpdate}
          isEditing={isEditing}
        />
      </Layout>
    </Page>
  );
} 



