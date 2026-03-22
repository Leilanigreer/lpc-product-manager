import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { Page, Layout, Box } from "@shopify/polaris";
import AddEmbroideryThreadColorForm from "../components/AddEmbroideryThreadColorForm";
import AddStitchingThreadColorForm from "../components/AddStitchingThreadColorForm";
import { authenticate } from "../shopify.server";
import { loader as dataLoader } from "../lib/loaders";
import {
  updateEmbroideryThreadColorWithNumbers,
  createEmbroideryThreadColor,
  updateStitchingThreadColorWithNumbers,
  createStitchingThreadColorWithAmann,
  unlinkIsacordFromThread,
  unlinkAmannFromThread,
} from "../lib/server/threadColorOperations.server";
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
  return dataLoader({ admin });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const type = formData.get("type");

  if (type === "updateEmbroidery") {
    const threadId = formData.get("threadId");
    const addIsacordIds = formData.getAll("addIsacordIds");
    const removeIsacordIds = formData.getAll("removeIsacordIds");

    const reassignments = (
      Array.isArray(formData.getAll("reassignIsacordNumbers[]"))
        ? formData.getAll("reassignIsacordNumbers[]")
        : formData.get("reassignIsacordNumbers[]")
          ? [formData.get("reassignIsacordNumbers[]")]
          : []
    ).map((str) => JSON.parse(str));

    try {
      for (const { isacordId, fromThreadId } of reassignments) {
        await unlinkIsacordFromThread(isacordId, fromThreadId);
      }

      const updated = await updateEmbroideryThreadColorWithNumbers({
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

    const reassignments = (
      Array.isArray(formData.getAll("reassignIsacordNumbers[]"))
        ? formData.getAll("reassignIsacordNumbers[]")
        : formData.get("reassignIsacordNumbers[]")
          ? [formData.get("reassignIsacordNumbers[]")]
          : []
    ).map((str) => JSON.parse(str));

    try {
      for (const { isacordId, fromThreadId } of reassignments) {
        await unlinkIsacordFromThread(isacordId, fromThreadId);
      }

      const created = await createEmbroideryThreadColor({
        name,
        abbreviation,
        isacordNumbers,
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

    const reassignments = (
      Array.isArray(formData.getAll("reassignAmannNumbers[]"))
        ? formData.getAll("reassignAmannNumbers[]")
        : formData.get("reassignAmannNumbers[]")
          ? [formData.get("reassignAmannNumbers[]")]
          : []
    ).map((str) => JSON.parse(str));

    try {
      for (const { amannId, fromThreadId } of reassignments) {
        await unlinkAmannFromThread(amannId, fromThreadId);
      }

      const updated = await updateStitchingThreadColorWithNumbers({
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

    const reassignments = (
      Array.isArray(formData.getAll("reassignAmannNumbers[]"))
        ? formData.getAll("reassignAmannNumbers[]")
        : formData.get("reassignAmannNumbers[]")
          ? [formData.get("reassignAmannNumbers[]")]
          : []
    ).map((str) => JSON.parse(str));

    try {
      for (const { amannId, fromThreadId } of reassignments) {
        await unlinkAmannFromThread(amannId, fromThreadId);
      }

      const created = await createStitchingThreadColorWithAmann({
        name,
        abbreviation,
        amannNumbers,
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
