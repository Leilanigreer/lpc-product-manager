// app/lib/server/amannShopifyMigration.server.js
/**
 * Migrates thread/number data from Postgres to Shopify metaobjects:
 * - AmannNumber → amann_number
 * - EmbroideryThread → embroidery_thread (name, abbreviation with _E transform); handle embroidery-{id}
 * - IsacordNumber → isacord_number (number, embroidery_thread_name as reference to embroidery_thread via embroidery-{threadId}, wawak_color_name, wawak_item_number)
 */
import prisma from "../../db.server.js";

const METAOBJECT_TYPE_AMANN = "amann_number";
const METAOBJECT_TYPE_EMBROIDERY_THREAD = "embroidery_thread";
const METAOBJECT_TYPE_ISACORD_NUMBER = "isacord_number";

/** Transform abbreviation: add _ before final E (e.g. XYZE → XYZ_E). */
function transformEmbroideryAbbreviation(abbr) {
  if (abbr == null || abbr === "") return "";
  const s = String(abbr).trim();
  if (s.endsWith("E")) return s.slice(0, -1) + "_E";
  return s;
}

/**
 * Resolve a metaobject's Shopify GID by type and handle (e.g. embroidery_thread + embroidery-{id}).
 * @returns {Promise<string|null>} Metaobject GID or null if not found
 */
async function getMetaobjectIdByHandle(admin, type, handle) {
  const response = await admin.graphql(
    `#graphql
    query GetMetaobjectByHandle($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) {
        id
      }
    }`,
    { variables: { handle: { type, handle } } }
  );
  const json = await response.json();
  return json.data?.metaobjectByHandle?.id ?? null;
}

/** Generic metaobject create; returns { created, skipped, errors }. */
async function createMetaobject(admin, type, handle, fields) {
  const response = await admin.graphql(
    `#graphql
    mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject { id handle }
        userErrors { field message code }
      }
    }`,
    { variables: { metaobject: { type, handle, fields } } }
  );
  const json = await response.json();
  const createResult = json.data?.metaobjectCreate;
  if (createResult?.userErrors?.length > 0) {
    const msg = createResult.userErrors.map((e) => e.message).join(", ");
    return { created: false, skipped: msg.includes("taken") || msg.includes("already exists"), error: msg };
  }
  return { created: !!createResult?.metaobject, skipped: false, error: null };
}

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
    const out = await createMetaobject(admin, METAOBJECT_TYPE_AMANN, handle, [
      { key: "number", value: numberValue },
      { key: "wawak_color_name", value: wawakColorName },
    ]);
    if (out.error && !out.skipped) result.errors.push(`Amann ${row.number ?? row.id}: ${out.error}`);
    if (out.created) result.created += 1;
    if (out.skipped) result.skipped += 1;
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Migrate EmbroideryThread records to Shopify as metaobjects (type: embroidery_thread).
 * Fields: name, abbreviation (with _E transform: trailing E → _E).
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @returns {Promise<{ success: boolean, created: number, skipped: number, errors: string[] }>}
 */
export async function migrateEmbroideryThreadsToShopify(admin) {
  const result = { success: false, created: 0, skipped: 0, errors: [] };
  const records = await prisma.embroideryThread.findMany({
    select: { id: true, name: true, abbreviation: true },
  });
  for (const row of records) {
    const name = row.name != null ? String(row.name).trim() : "";
    const abbreviation = transformEmbroideryAbbreviation(row.abbreviation);
    const handle = `embroidery-${row.id}`;
    const out = await createMetaobject(admin, METAOBJECT_TYPE_EMBROIDERY_THREAD, handle, [
      { key: "name", value: name },
      { key: "abbreviation", value: abbreviation },
    ]);
    if (out.error && !out.skipped) result.errors.push(`Embroidery ${row.name ?? row.id}: ${out.error}`);
    if (out.created) result.created += 1;
    if (out.skipped) result.skipped += 1;
  }
  result.success = result.errors.length === 0;
  return result;
}

/**
 * Migrate IsacordNumber records to Shopify as metaobjects (type: isacord_number).
 * Fields: number, embroidery_thread_name (reference to embroidery_thread via handle embroidery-{threadId}), wawak_color_name, wawak_item_number.
 * Run "Migrate embroidery threads" first so the reference can be resolved.
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @returns {Promise<{ success: boolean, created: number, skipped: number, errors: string[] }>}
 */
export async function migrateIsacordNumbersToShopify(admin) {
  const result = { success: false, created: 0, skipped: 0, errors: [] };
  const records = await prisma.isacordNumber.findMany({
    select: {
      id: true,
      number: true,
      threadId: true,
      wawakColorName: true,
      wawakItemNumber: true,
    },
  });
  for (const row of records) {
    const number = row.number != null ? String(row.number).trim() : "";
    const wawakColorName = row.wawakColorName != null ? String(row.wawakColorName).trim() : "";
    const wawakItemNumber = row.wawakItemNumber != null ? String(row.wawakItemNumber).trim() : "";
    // Resolve embroidery_thread_name as metaobject reference (GID) using handle embroidery-{threadId}
    let embroideryThreadNameValue = "";
    if (row.threadId) {
      const embroideryHandle = `embroidery-${row.threadId}`;
      const refGid = await getMetaobjectIdByHandle(admin, METAOBJECT_TYPE_EMBROIDERY_THREAD, embroideryHandle);
      if (refGid) embroideryThreadNameValue = refGid;
    }
    const handle = `isacord-${row.id}`;
    const fields = [
      { key: "number", value: number },
      { key: "embroidery_thread_name", value: embroideryThreadNameValue },
      { key: "wawak_color_name", value: wawakColorName },
      { key: "wawak_item_number", value: wawakItemNumber },
    ];
    const out = await createMetaobject(admin, METAOBJECT_TYPE_ISACORD_NUMBER, handle, fields);
    if (out.error && !out.skipped) result.errors.push(`Isacord ${row.number ?? row.id}: ${out.error}`);
    if (out.created) result.created += 1;
    if (out.skipped) result.skipped += 1;
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
        type: METAOBJECT_TYPE_AMANN,
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
