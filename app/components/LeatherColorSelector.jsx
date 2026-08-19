import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { getGoogleDriveUrl, sanitizeSelectOptions } from '../lib/utils';
import { generateTitle } from '../lib/generators/titleGenerator';
import { Button, Card, InlineStack, Box, Select, BlockStack, Text, Image } from "@shopify/polaris";

const LeatherColorSelector = ({ 
  leatherColors, 
  formState,
  onChange,
}) => {
  const [previewTitle, setPreviewTitle] = useState(null);
  const hasPreviewedRef = useRef(false);

  const displayOptions = useMemo(() => {
    const baseOption = [{ label: "Select a Leather", value: "" }];
    return [...baseOption, ...sanitizeSelectOptions(leatherColors)];
  }, [leatherColors]);
  
  const requiresSecondary = formState.finalRequirements.needsSecondaryLeather;
  const primaryLeather = formState.leatherColors?.primary;
  const secondaryLeather = formState.leatherColors?.secondary;
  const collectionValue = formState.collection?.value;
  const hasCollection = Boolean(collectionValue);
  const hasPrimary = Boolean(primaryLeather?.value);
  const hasSecondary = Boolean(secondaryLeather?.value);
  const canPreview = hasCollection && hasPrimary && hasSecondary;
  const canFlip = hasPrimary && hasSecondary;

  const refreshPreview = useCallback(async () => {
    const title = await generateTitle(formState);
    setPreviewTitle(title);
  }, [formState]);

  useEffect(() => {
    if (!hasPreviewedRef.current) return;
    if (!canPreview) {
      hasPreviewedRef.current = false;
      setPreviewTitle(null);
      return;
    }
    let cancelled = false;
    generateTitle(formState).then((title) => {
      if (!cancelled) setPreviewTitle(title);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- leather/collection identity, not every formState change
  }, [canPreview, collectionValue, primaryLeather?.value, secondaryLeather?.value]);

  const previewUrlFor = (leather) => {
    if (!leather) return null;
    const raw = leather.url_id ?? leather.image_url;
    if (!raw) return null;
    return raw.startsWith("http") ? raw : getGoogleDriveUrl(raw);
  };

  const renderColorSelector = (label, type) => {
    const leather = formState.leatherColors[type];
    const previewUrl = previewUrlFor(leather);
    return (
      <>
        <Box width={requiresSecondary ? "25%" : "50%"}>
          <Select
            label={label}
            options={displayOptions}
            onChange={(value) => {
              const selectedColor = leatherColors.find(c => c.value === value) || null;
              const updatedColors = {
                primary: type === 'primary' ? selectedColor : formState.leatherColors.primary,
                secondary: type === 'secondary' ? selectedColor : formState.leatherColors.secondary
              };
              onChange('leatherColors', updatedColors);
            }}
            value={formState.leatherColors[type]?.value || ''}
          />
        </Box>
        <Box width={requiresSecondary ? "25%" : "50%"}>
          {leather && previewUrl && (
            <BlockStack gap="200">
              <Text variant="bodyMd" as="p">
                {type === 'secondary' ? "2nd Leather Preview:" : "Leather Preview:"}
              </Text>
              <Image
                source={previewUrl}
                alt={`Preview of ${leather.label} leather`}
                style={{ width: '150px', height: 'auto' }}
              />
            </BlockStack>
          )}
        </Box>
      </>
    );
  };

  const handlePreviewTitle = async () => {
    hasPreviewedRef.current = true;
    await refreshPreview();
  };

  const handleFlipColors = () => {
    onChange('leatherColors', {
      primary: formState.leatherColors.secondary,
      secondary: formState.leatherColors.primary,
    });
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack gap="500" align="start" wrap={false}>
          {renderColorSelector("Select Leather Color", "primary")}
          {requiresSecondary && (
            renderColorSelector("Select 2nd Leather Color", "secondary")
          )}
        </InlineStack>
        {requiresSecondary && (
          <BlockStack gap="200">
            <InlineStack gap="300" wrap>
              <Button onClick={handlePreviewTitle} disabled={!canPreview}>
                Preview Title
              </Button>
              <Button onClick={handleFlipColors} disabled={!canFlip}>
                Flip Colors
              </Button>
            </InlineStack>
            {previewTitle != null && (
              <Text as="p" variant="bodyMd">
                <Text as="span" fontWeight="semibold">
                  Listing title:{" "}
                </Text>
                {previewTitle}
              </Text>
            )}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
};

export default React.memo(LeatherColorSelector);
