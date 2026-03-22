import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { Page, Layout, Box } from "@shopify/polaris";
import AddEmbroideryThreadColorForm from "../components/AddEmbroideryThreadColorForm";
import AddStitchingThreadColorForm from "../components/AddStitchingThreadColorForm";
import { authenticate } from "../shopify.server";
import { loader as dataLoader } from "../lib/loaders";
import {
  getEmbroideryThreadColorDataFromShopify,
  createEmbroideryThreadAndLinkIsacordNumbers,
  updateEmbroideryThreadIsacordLinks,
} from "../lib/server/embroideryThreadShopify.server";
import {
  createStitchingThreadAndLinkAmannNumbers,
  updateStitchingThreadAmannLinks,
} from "../lib/server/stitchingThreadShopify.server";
import SuccessBanner from "../components/SuccessBanner.jsx";

export default function AddThreadColors() {
  const {
    unlinkedIsacordNumbers,
    stitchingThreadColors,
    embroideryThreadColors,
    unlinkedAmannNumbers,
  } = useLoaderData();
  const fetcher = useFetcher();

  const [showBanner, setShowBanner] = React.useState(false);
  const [bannerType, setBannerType] = React.useState("");

  React.useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      setShowBanner(true);
      setBannerType(fetcher.data.actionType || "update");
    }
  }, [fetcher.data]);

  return (
    <Page>
      <TitleBar title="Add Thread Colors" />
      <SuccessBanner
        show={showBanner}
        onDismiss={() => setShowBanner(false)}
        message={
          bannerType === "add"
            ? `Thread color ${fetcher.data?.threadColor?.name} added successfully!`
            : `Thread color ${fetcher.data?.threadColor?.name} updated successfully!`
        }
      />
      <Box paddingBlockEnd="400">
        <Layout>
          <Layout.Section variant="oneHalf">
            <AddEmbroideryThreadColorForm
              unlinkedIsacordNumbers={unlinkedIsacordNumbers}
              embroideryThreadColors={embroideryThreadColors}
              fetcher={fetcher}
            />
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <AddStitchingThreadColorForm
              stitchingThreadColors={stitchingThreadColors}
              fetcher={fetcher}
              unlinkedAmannNumbers={unlinkedAmannNumbers}
            />
          </Layout.Section>
        </Layout>
      </Box>
    </Page>
  );
}

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const base = await dataLoader({ admin });
  const shopifyEmbroidery = await getEmbroideryThreadColorDataFromShopify(admin);
  return {
    ...base,
    embroideryThreadColors: shopifyEmbroidery.embroideryThreadColors,
    unlinkedIsacordNumbers: shopifyEmbroidery.unlinkedIsacordNumbers,
  };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const type = formData.get("type");

  if (type === "updateEmbroidery") {
    const threadId = formData.get("threadId");
    const addIsacordIds = formData.getAll("addIsacordIds");
    const removeIsacordIds = formData.getAll("removeIsacordIds");

    try {
      const updated = await updateEmbroideryThreadIsacordLinks(admin, {
        threadId,
        addIsacordIds,
        removeIsacordIds,
      });
      return {
        success: true,
        threadColor: updated,
        actionType: "update",
      };
    } catch (error) {
      console.error("[action] updateEmbroidery error", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  if (type === "embroidery") {
    const name = formData.get("name");
    const abbreviation = formData.get("abbreviation");
    const isacordNumbers = formData.getAll("isacordNumbers");

    try {
      const created = await createEmbroideryThreadAndLinkIsacordNumbers(admin, {
        name,
        abbreviation,
        isacordIds: isacordNumbers,
      });
      return {
        success: true,
        threadColor: created,
        actionType: "add",
      };
    } catch (error) {
      console.error("[action] addEmbroidery error", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  if (type === "updateStitching") {
    const threadId = formData.get("threadId");
    const addAmannIds = formData.getAll("addAmannIds");
    const removeAmannIds = formData.getAll("removeAmannIds");

    try {
      const updated = await updateStitchingThreadAmannLinks(admin, {
        threadId,
        addAmannIds,
        removeAmannIds,
      });
      return {
        success: true,
        threadColor: updated,
        actionType: "update",
      };
    } catch (error) {
      console.error("[action] updateStitching error", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  if (type === "stitching") {
    const name = formData.get("name");
    const abbreviation = formData.get("abbreviation");
    const amannNumbers = formData.getAll("amannNumbers");

    try {
      const created = await createStitchingThreadAndLinkAmannNumbers(admin, {
        name,
        abbreviation,
        amannIds: amannNumbers,
      });
      return {
        success: true,
        threadColor: created,
        actionType: "add",
      };
    } catch (error) {
      console.error("[action] addStitching error", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
};
