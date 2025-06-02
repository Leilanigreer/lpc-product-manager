import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { Page, Layout } from "@shopify/polaris";
import AddEmbroideryThreadColorForm from "../components/AddEmbroideryThreadColorForm";
import AddStitchingThreadColorForm from "../components/AddStitchingThreadColorForm";
import { authenticate } from "../shopify.server";
import { loader as dataLoader } from "../lib/loaders";

export default function AddThreadColors() {
  const {
    colorTags,
    unlinkedIsacordNumbers,
    stitchingThreadColors,
    embroideryThreadColors,
  } = useLoaderData();
  const fetcher = useFetcher();

  return (
    <Page>
      <TitleBar title="Add Thread Colors" />
      <Layout>
        <Layout.Section variant="oneHalf">
          <AddEmbroideryThreadColorForm
            colorTags={colorTags}
            unlinkedIsacordNumbers={unlinkedIsacordNumbers}
            embroideryThreadColors={embroideryThreadColors}
            fetcher={fetcher}
          />
        </Layout.Section>
        <Layout.Section variant="oneHalf">
          <AddStitchingThreadColorForm
            colorTags={colorTags}
            stitchingThreadColors={stitchingThreadColors}
            fetcher={fetcher}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  // Get data from our data loader
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  // ... (your action logic)
}; 