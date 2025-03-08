import { useState, useMemo, useEffect } from "react";
import { useLoaderData, useSearchParams, useSubmit, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Button,
  Banner,
} from "@shopify/polaris";
import { preventWheelChange } from "../styles/shared/inputs.js";
import { loader as rootLoader } from "../lib/loaders/index.js";
import { createCustomOption, updateCustomOption } from "../lib/server/websiteCustomization.server.js";
import { getOptionTags } from "../lib/utils/dataFetchers.js";
import Option from "../components/WebsiteCustomOptions/Option.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const optionId = url.searchParams.get('id');
  console.log('Received optionId:', optionId);
  
  const { optionLayouts, options } = await rootLoader();
  const optionTags = await getOptionTags();
  
  let option = null;
  if (optionId) {
    console.log('Attempting to find option with ID:', optionId);
    option = options.find(opt => opt.id === optionId);
    console.log('Found option:', option);
    
    if (!option) {
      console.error('Option not found in loaded options');
      return json({ 
        error: `Option with ID ${optionId} not found`,
        optionLayouts, 
        optionTags, 
        option: null 
      });
    }
  }

  return json({ optionLayouts, optionTags, option });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const isEditing = formData.get('isEditing') === 'true';
  
  console.log('=== FORM SUBMISSION START ===');
  console.log('Raw form data:', data);
  
  try {
    // Parse the values array from the form data
    const values = data.values ? JSON.parse(data.values) : [];
    
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
      return json({ option: updatedOption });
    }

    // Otherwise create new option
    const newOption = await createCustomOption(cleanedData);
    return json({ option: newOption });
  } catch (error) {
    console.error('Error in action:', error);
    return json({ 
      error: error.message,
      details: error.stack
    }, { status: 400 });
  }
};

export default function OptionsPage() {
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
          console.log('Array length mismatch:', value1.length, value2.length);
          return true;
        }
        return value1.some((item, index) => {
          const item2 = value2[index];
          if (typeof item === 'object' && item !== null) {
            return Object.keys(item).some(key => {
              const isDifferent = normalizeValue(item[key]) !== normalizeValue(item2?.[key]);
              if (isDifferent) {
                console.log('Array object value mismatch:', key, item[key], item2?.[key]);
              }
              return isDifferent;
            });
          }
          const isDifferent = normalizeValue(item) !== normalizeValue(item2);
          if (isDifferent) {
            console.log('Array value mismatch:', item, item2);
          }
          return isDifferent;
        });
      }
      
      // Handle primitive values
      if (typeof value1 !== 'object' || value1 === null) {
        const isDifferent = normalizeValue(value1) !== normalizeValue(value2);
        if (isDifferent) {
          console.log('Primitive value mismatch:', value1, value2);
        }
        return isDifferent;
      }
      
      // Handle objects
      return Object.keys(value1).some(key => {
        if (key === 'id') return false; // Skip id comparison
        const isDifferent = compareValues(value1[key], value2[key]);
        if (isDifferent) {
          console.log('Object key mismatch:', key, value1[key], value2[key]);
        }
        return isDifferent;
      });
    };

    const changed = compareValues(options, initialOptions);
    console.log('Change detection result:', changed);
    console.log('Current options:', options);
    console.log('Initial options:', initialOptions);
    return changed;
  }, [options, initialOptions]);

  // Update isDirty based on actual changes
  useEffect(() => {
    console.log('Setting isDirty to:', hasChanges);
    setIsDirty(hasChanges);
  }, [hasChanges]);

  const handleOptionUpdate = (updates) => {
    console.log('Handling option update:', updates);
    setOptions(prev => {
      const newOptions = {
        ...prev,
        ...updates
      };
      console.log('New options state:', newOptions);
      return newOptions;
    });
  };

  const handleSubmit = async () => {
    if (!hasChanges) {
      console.log('No changes detected, skipping submit');
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

      console.log('Submitting form data:', Object.fromEntries(formData));
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



