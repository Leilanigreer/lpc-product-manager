// app/lib/server/amannShopifyMigration.server.js
/**
 * Bulk-activate Shopify metaobjects (e.g. isacord_number) that use the publishable capability.
 */

const METAOBJECT_TYPE_ISACORD_NUMBER = "isacord_number";

const PAGE_SIZE = 250;

/**
 * Set all metaobjects of a given type to ACTIVE status (paginated).
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @param {string} type - Metaobject type (e.g. isacord_number)
 * @returns {Promise<{ success: boolean, updated: number, skipped: number, errors: string[] }>}
 */
async function activateMetaobjectsByType(admin, type) {
  const result = { success: false, updated: 0, skipped: 0, errors: [] };

  const currentStatus = (node) => node?.capabilities?.publishable?.status;

  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const listResponse = await admin.graphql(
      `#graphql
      query ListMetaobjectsByType($type: String!, $first: Int!, $after: String) {
        metaobjects(type: $type, first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
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
          type,
          first: PAGE_SIZE,
          after,
        },
      }
    );

    const listJson = await listResponse.json();

    if (listJson.errors?.length) {
      result.errors.push(listJson.errors.map((e) => e.message).join(", "));
      break;
    }

    const connection = listJson.data?.metaobjects;
    const nodes = connection?.nodes || [];
    hasNextPage = connection?.pageInfo?.hasNextPage ?? false;
    after = connection?.pageInfo?.endCursor ?? null;

    for (const node of nodes) {
      if (currentStatus(node) === "ACTIVE") {
        result.skipped += 1;
        continue;
      }

      const updateResponse = await admin.graphql(
        `#graphql
        mutation ActivateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
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
        const msg = updateResult.userErrors.map((e) => e.message).join(", ");
        result.errors.push(`Activate ${node.handle || node.id}: ${msg}`);
        continue;
      }

      if (currentStatus(updateResult?.metaobject) === "ACTIVE") {
        result.updated += 1;
      }
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Set all Isacord Number metaobjects (type: isacord_number) to ACTIVE status.
 * @param {Object} admin - Shopify Admin API GraphQL client
 */
export async function activateIsacordMetaobjects(admin) {
  return activateMetaobjectsByType(admin, METAOBJECT_TYPE_ISACORD_NUMBER);
}
