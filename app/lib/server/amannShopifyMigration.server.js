// app/lib/server/amannShopifyMigration.server.js
/**
 * Migrates AmannNumber records (number, WawakColorName) from Prisma to Shopify
 * as metaobjects: type amann_number with keys number (single line text) and wawak_color_name (single line text).
 * Uses the existing Amann Number metaobject definition created in Shopify admin.
 */
import prisma from "../../db.server.js";

/** Type of the existing Amann Number metaobject definition in Shopify. */
const METAOBJECT_TYPE = "amann_number";

/**
 * Migrate all AmannNumber records to Shopify as metaobjects.
 * Uses the existing amann_number definition (number = single line text, wawak_color_name = single line text).
 * Uses handle amann-{id} so re-runs skip already-migrated records (handle taken).
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @returns {Promise<{ success: boolean, created: number, skipped: number, errors: string[] }>}
 */
export async function migrateAmannNumbersToShopify(admin) {
  const result = { success: false, created: 0, skipped: 0, errors: [] };

  const amannRecords = await prisma.amannNumber.findMany({
    select: { id: true, number: true, WawakColorName: true },
  });

  for (const row of amannRecords) {
    const numberValue = row.number != null ? String(row.number).trim() : "";
    const wawakColorName = row.WawakColorName ?? "";
    const handle = `amann-${row.id}`;

    const response = await admin.graphql(
      `#graphql
      mutation CreateAmannMetaobject($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject { id handle }
          userErrors { field message code }
        }
      }`,
      {
        variables: {
          metaobject: {
            type: METAOBJECT_TYPE,
            handle,
            fields: [
              { key: "number", value: numberValue },
              { key: "wawak_color_name", value: wawakColorName },
            ],
          },
        },
      }
    );
    const json = await response.json();
    const createResult = json.data?.metaobjectCreate;

    if (createResult?.userErrors?.length > 0) {
      const msg = createResult.userErrors.map((e) => e.message).join(", ");
      if (msg.includes("taken") || msg.includes("already exists")) {
        result.skipped += 1;
        continue;
      }
      result.errors.push(`Amann ${row.number ?? row.id}: ${msg}`);
      continue;
    }
    if (createResult?.metaobject) {
      result.created += 1;
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Set all Amann Number metaobjects to ACTIVE status.
 * Uses the existing amann_number definition (requires publishable capability enabled).
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @returns {Promise<{ success: boolean, updated: number, skipped: number, errors: string[] }>}
 */
export async function activateAmannMetaobjects(admin) {
  const result = { success: false, updated: 0, skipped: 0, errors: [] };

  // 1. Fetch all amann_number metaobjects (96 total, fits in a single page)
  // Status lives under capabilities.publishable (not top-level on Metaobject)
  const listResponse = await admin.graphql(
    `#graphql
    query ListAmannMetaobjects($type: String!, $first: Int!) {
      metaobjects(type: $type, first: $first) {
        nodes {
          id
          handle
          capabilities {
            publishable {
              status
            }
          }
        }
      }
    }`,
    {
      variables: {
        type: METAOBJECT_TYPE,
        first: 250,
      },
    }
  );

  const listJson = await listResponse.json();
  const nodes = listJson.data?.metaobjects?.nodes || [];

  if (!nodes.length && listJson.errors?.length) {
    result.errors.push(listJson.errors.map(e => e.message).join(", "));
    return result;
  }

  const currentStatus = (node) => node.capabilities?.publishable?.status;

  // 2. Activate any metaobjects that are not already ACTIVE
  for (const node of nodes) {
    if (currentStatus(node) === "ACTIVE") {
      result.skipped += 1;
      continue;
    }

    const updateResponse = await admin.graphql(
      `#graphql
      mutation ActivateAmannMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
            capabilities {
              publishable {
                status
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        variables: {
          id: node.id,
          metaobject: {
            capabilities: {
              publishable: {
                status: "ACTIVE",
              },
            },
          },
        },
      }
    );

    const updateJson = await updateResponse.json();
    const updateResult = updateJson.data?.metaobjectUpdate;

    if (updateResult?.userErrors?.length > 0) {
      const msg = updateResult.userErrors.map(e => e.message).join(", ");
      result.errors.push(`Activate ${node.handle || node.id}: ${msg}`);
      continue;
    }

    if (currentStatus(updateResult?.metaobject) === "ACTIVE") {
      result.updated += 1;
    }
  }

  result.success = result.errors.length === 0;
  return result;
}
