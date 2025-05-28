import React, { useCallback, useMemo, useState } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders";
import { authenticate } from "../shopify.server";
import { Page, Layout, InlineStack, Text, Card, Select } from "@shopify/polaris";



export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  // Get data from our data loader
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  
  // Temporarily disabled for testing form
  return json({ success: true });
};

export default function AddLeatherColor () {
  const {
      leatherColors,
      colorTags,
  } = useLoaderData();

  const leatherColorOptions = useMemo(() => [
    { label: 'Select a leather color ...', value: '' },
    ...(leatherColors
      ?.map(color => ({
        label: color.label,
        value: color.abbreviation
      })) || []
    )
  ], [leatherColors]);

  const colorTagOptions = useMemo(() => [
    { label: 'Select a color tag ...', value: '' },
    ...(colorTags
      ?.map(tag => ({
        label: tag.label,
        value: tag.value
      })) || []
    )
  ], [colorTags]);

  const handleLeatherColorChange = useCallback(
    (value) => {
      console.log('Selected leather color:', value);
    },
    []
  );

  const handleColorTagChange = useCallback(
    (value) => {
      console.log('Selected color tag:', value);
    },
    []
  );

  return (
    <Page>
      <TitleBar title="Updated Collection Pricing" />
      <Layout>
        <Card>
          <InlineStack>
            <Text>
              Hello World
              <Select
              label="Select a leather color"
              options={leatherColorOptions}
              onChange={handleLeatherColorChange}
              />
              <Select
              label="Select a color tag"
              options={colorTagOptions}
              onChange={handleColorTagChange}
              />
            </Text>
          </InlineStack>
        </Card>
      </Layout>
    </Page>
  );
}