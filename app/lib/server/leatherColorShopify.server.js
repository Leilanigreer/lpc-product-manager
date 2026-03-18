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
  const abbrValue =
    abbreviation != null && String(abbreviation).trim() !== ""
      ? String(abbreviation).trim()
      : fallbackAbbreviation(name);

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
            { key: "abbreviation", value: abbrValue },
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
    abbreviation: abbrValue,
  };
}

/**
 * Update an existing leather_color metaobject in Shopify (stock type and colors only).
 * Optionally adjust publishable status via setActive (maps to capabilities.publishable.status).
 *
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @param {Object} params
 * @param {string} params.id - Metaobject GID (e.g. gid://shopify/Metaobject/123)
 * @param {boolean} params.isLimitedEditionLeather
 * @param {string[]} [params.colorMetaobjectIds] - Full list of Color metaobject GIDs to set
 * @param {boolean} [params.setActive] - When true/false, sets status to ACTIVE/DRAFT; when undefined, leaves status unchanged
 * @returns {Promise<{ id: string, name: string }>}
 */
export async function updateShopifyLeatherColor(
  admin,
  { id, isLimitedEditionLeather, colorMetaobjectIds = [], setActive }
) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required to update leather_color metaobjects.");
  }
  if (!id) {
    throw new Error("Leather color metaobject id is required for update.");
  }

  const colorsValue = colorMetaobjectIds.length ? JSON.stringify(colorMetaobjectIds) : "[]";
  const fields = [
    { key: "is_limited_edition", value: isLimitedEditionLeather ? "true" : "false" },
    { key: "colors", value: colorsValue },
  ];

  const metaobjectInput = { fields };
  if (typeof setActive === "boolean") {
    metaobjectInput.capabilities = {
      publishable: {
        status: setActive ? "ACTIVE" : "DRAFT",
      },
    };
  }

  const response = await admin.graphql(
    `#graphql
    mutation UpdateLeatherColor($id: ID!, $metaobject: MetaobjectUpdateInput!) {
      metaobjectUpdate(id: $id, metaobject: $metaobject) {
        metaobject {
          id
          displayName
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
        id,
        metaobject: metaobjectInput,
      },
    }
  );

  const json = await response.json();
  const result = json.data?.metaobjectUpdate;

  if (result?.userErrors?.length) {
    const message = result.userErrors.map((e) => e.message).join(", ");
    throw new Error(`Failed to update leather_color metaobject: ${message}`);
  }

  const meta = result?.metaobject;
  if (!meta?.id) {
    throw new Error("Shopify did not return the updated leather_color metaobject.");
  }

  return {
    id: meta.id,
    name: meta.displayName ?? "",
  };
}

/**
 * Reactivate a leather_color metaobject (set publishable status to ACTIVE).
 * Use for metaobjects that are in DRAFT.
 *
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @param {Object} params
 * @param {string} params.id - Metaobject GID (e.g. gid://shopify/Metaobject/123)
 * @returns {Promise<{ id: string, name: string }>}
 */
export async function reactivateShopifyLeatherColor(admin, { id }) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required to reactivate leather_color metaobjects.");
  }
  if (!id) {
    throw new Error("Leather color metaobject id is required for reactivate.");
  }

  const response = await admin.graphql(
    `#graphql
    mutation ReactivateLeatherColor($id: ID!, $metaobject: MetaobjectUpdateInput!) {
      metaobjectUpdate(id: $id, metaobject: $metaobject) {
        metaobject {
          id
          displayName
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
        id,
        metaobject: {
          capabilities: {
            publishable: { status: "ACTIVE" },
          },
        },
      },
    }
  );

  const json = await response.json();
  const result = json.data?.metaobjectUpdate;

  if (result?.userErrors?.length) {
    const message = result.userErrors.map((e) => e.message).join(", ");
    throw new Error(`Failed to reactivate leather_color metaobject: ${message}`);
  }

  const meta = result?.metaobject;
  if (!meta?.id) {
    throw new Error("Shopify did not return the reactivated leather_color metaobject.");
  }

  return {
    id: meta.id,
    name: meta.displayName ?? "",
  };
}

function fallbackAbbreviation(name) {
  const s = String(name || "").trim();
  if (!s) return "LC";
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 10) || "LC";
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "leather-color";
}

