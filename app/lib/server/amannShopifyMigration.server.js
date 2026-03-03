// app/lib/server/amannShopifyMigration.server.js
/**
 * Migrates AmannNumber records (number, WawakColorName) from Prisma to Shopify
 * as metaobjects: type amann_number with keys number (integer) and wawak_color_name (single line text).
 * Uses the existing Amann Number metaobject definition created in Shopify admin.
 */
import prisma from "../../db.server.js";

/** Type of the existing Amann Number metaobject definition in Shopify. */
const METAOBJECT_TYPE = "amann_number";

/**
 * Parse number for the integer field. API expects integer values as string.
 * @param {string|number} raw
 * @returns {string} String representation of integer, or empty string if invalid
 */
function numberFieldValue(raw) {
  if (raw == null || raw === "") return "";
  const n = typeof raw === "number" ? raw : parseInt(String(raw).trim(), 10);
  return Number.isNaN(n) ? "" : String(n);
}

/**
 * Migrate all AmannNumber records to Shopify as metaobjects.
 * Uses the existing amann_number definition (number = integer, wawak_color_name = single line text).
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
    const numberStr = numberFieldValue(row.number);
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
              { key: "number", value: numberStr },
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
