/**
 * Shopify `shape` metaobjects for create-product.
 *
 * Field keys (Content → Metaobject definition) must match Shopify:
 *   shape, is_representative, abbreviation, shape_type, display_order
 *
 * DB save: variants still connect to Prisma `Shape` by id. When `value` is a metaobject GID,
 * `productOperations.server.js` resolves via `Shape.name` === variant shape label (the `shape`
 * field text should match your Postgres `Shape.name` during hybrid use).
 */

const TYPE_SHAPE = "shape";
const PAGE_SIZE = 250;

const VALID_SHAPE_TYPES = new Set([
  "DRIVER",
  "WOOD",
  "HYBRID",
  "PUTTER",
  "ZERO_MALLET",
  "OTHER",
]);

const LIST_SHAPES = `#graphql
  query ListShapeMetaobjects($type: String!, $first: Int!, $after: String) {
    metaobjects(type: $type, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        displayName
        shapeField: field(key: "shape") { value }
        isRepresentativeField: field(key: "is_representative") { value }
        abbreviationField: field(key: "abbreviation") { value }
        shapeTypeField: field(key: "shape_type") { value }
        displayOrderField: field(key: "display_order") { value }
      }
    }
  }
`;

function stringField(field) {
  if (field == null || field.value == null) return null;
  const s = String(field.value).trim();
  return s.length ? s : null;
}

function parseBoolField(field) {
  const v = field?.value;
  if (v === true || v === false) return v;
  if (typeof v !== "string") return false;
  const s = v.trim().toLowerCase();
  return s === "true" || s === "1";
}

/**
 * When unset, treat as active (same as legacy default). Explicit false hides the shape.
 */
function parseRepresentativeAsActive(field) {
  if (field == null || field.value == null || field.value === "") return true;
  return parseBoolField(field);
}

function parseDisplayOrder(field) {
  const raw = field?.value;
  if (raw == null || raw === "") return 0;
  const n = parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function normalizeShapeType(raw) {
  const s = (raw || "OTHER").toString().trim().toUpperCase().replace(/\s+/g, "_");
  if (VALID_SHAPE_TYPES.has(s)) return s;
  return "OTHER";
}

function fallbackAbbreviation(label) {
  if (!label || typeof label !== "string") return "SHP";
  const cleaned = label.replace(/[^a-zA-Z0-9]+/g, "").slice(0, 8);
  return cleaned.length ? cleaned.toUpperCase() : "SHP";
}

/**
 * Maps a GraphQL metaobject node to the shape list item used by ShapeSelector / formState.
 */
export function mapShapeMetaobjectNodeToFormShape(node) {
  const shapeName = stringField(node.shapeField);
  const label = shapeName || node.displayName || node.handle || node.id;
  const abbreviation =
    stringField(node.abbreviationField) || fallbackAbbreviation(label);

  return {
    source: "shopify",
    value: node.id,
    label,
    displayOrder: parseDisplayOrder(node.displayOrderField),
    abbreviation,
    shapeType: normalizeShapeType(stringField(node.shapeTypeField)),
    isActive: parseRepresentativeAsActive(node.isRepresentativeField),
    url_id: node.handle || null,
  };
}

async function fetchAllShapePages(admin) {
  const allNodes = [];
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(LIST_SHAPES, {
      variables: { type: TYPE_SHAPE, first: PAGE_SIZE, after },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const conn = json.data?.metaobjects;
    allNodes.push(...(conn?.nodes ?? []));
    hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
    after = conn?.pageInfo?.endCursor ?? null;
  }

  return allNodes;
}

/**
 * @param {Object} admin - Shopify authenticate.admin() client
 * @returns {Promise<object[]>} Sorted, active-only shape rows (same general shape as getShapes())
 */
export async function getShapesFromShopify(admin) {
  if (!admin?.graphql) {
    return [];
  }
  const nodes = await fetchAllShapePages(admin);
  return nodes
    .map(mapShapeMetaobjectNodeToFormShape)
    .filter((s) => s.isActive)
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.label.localeCompare(b.label);
    });
}
