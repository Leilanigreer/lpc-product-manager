// app/lib/server/leatherColorShopify.server.js
/**
 * Helpers for creating and managing Shopify leather_color metaobjects.
 *
 * Metaobject type: leather_color
 * Expected fields:
 * - name (single line text)
 * - abbreviation (single line text)
 * - is_limited_edition (boolean)
 * - colors (list.reference to shopify--color-pattern metaobjects)
 */

const LEATHER_COLOR_METAOBJECT_TYPE = "leather_color";

/**
 * Create a single leather_color metaobject in Shopify.
 *
 * @param {Object} admin - Shopify Admin API GraphQL client (from authenticate.admin)
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.abbreviation
 * @param {boolean} params.isLimitedEditionLeather
 * @param {string[]} [params.colorMetaobjectIds] - Array of GIDs for shopify--color-pattern metaobjects
 * @returns {Promise<{ id: string, name: string, abbreviation: string }>}
 */
export async function createShopifyLeatherColor(admin, {
  name,
  abbreviation,
  isLimitedEditionLeather,
  colorMetaobjectIds = [],
}) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required to create leather_color metaobjects.");
  }

  const handle = `leather-${slugify(name)}`;
  const colorsValue = colorMetaobjectIds.length ? JSON.stringify(colorMetaobjectIds) : "";

  const response = await admin.graphql(
    `#graphql
    mutation CreateLeatherColor($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          handle
          displayName
          type
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
        metaobject: {
          type: LEATHER_COLOR_METAOBJECT_TYPE,
          handle,
          fields: [
            { key: "name", value: name },
            { key: "abbreviation", value: abbreviation },
            { key: "is_limited_edition", value: isLimitedEditionLeather ? "true" : "false" },
            ...(colorsValue ? [{ key: "colors", value: colorsValue }] : []),
          ],
          capabilities: {
            publishable: {
              status: "ACTIVE",
            },
          },
        },
      },
    }
  );

  const json = await response.json();
  const result = json.data?.metaobjectCreate;

  if (result?.userErrors?.length) {
    const message = result.userErrors.map(e => e.message).join(", ");
    throw new Error(`Failed to create leather_color metaobject: ${message}`);
  }

  const meta = result?.metaobject;
  if (!meta?.id) {
    throw new Error("Shopify did not return an ID for the created leather_color metaobject.");
  }

  return {
    id: meta.id,
    name: meta.displayName || name,
    abbreviation,
  };
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "leather-color";
}

