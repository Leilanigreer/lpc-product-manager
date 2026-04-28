/**
 * Shopify `shape` metaobjects for create-product.
 *
 * Field keys (Content → Metaobject definition) must match Shopify:
 *   shape, card_display_name, sizing_guide_group, is_representative, abbreviation,
 *   shape_type (single choice list), shape_group (single choice list), display_order
 *
 * Choice lists (`shape_type`, `shape_group`): Shopify may return `jsonValue` or `value` as a JSON
 * array string; we take the first choice. `shape_type` is normalized to Prisma `ShapeType` tokens;
 * `shape_group` is normalized to a single UPPER_SNAKE token (no fixed enum in app).
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
        cardDisplayNameField: field(key: "card_display_name") { value }
        sizingGuideGroupField: field(key: "sizing_guide_group") { value }
        isRepresentativeField: field(key: "is_representative") { value }
        abbreviationField: field(key: "abbreviation") { value }
        shapeTypeField: field(key: "shape_type") {
          value
          jsonValue
        }
        shapeGroupField: field(key: "shape_group") {
          value
          jsonValue
        }
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

function firstChoiceToken(el) {
  if (el == null) return null;
  if (typeof el === "object" && el !== null) {
    if (el.handle != null) {
      const h = String(el.handle).trim();
      if (h) return h;
    }
    if (el.value != null) {
      const s = String(el.value).trim();
      if (s) return s;
    }
  }
  const s = String(el).trim();
  return s.length ? s : null;
}

/**
 * Single choice-list fields: Shopify may expose `jsonValue` (array) or `value` as a JSON array string.
 * Also accepts a plain string (legacy single-line text).
 */
function choiceListSingleValueField(field) {
  if (field == null) return null;

  const jv = field.jsonValue;
  if (jv != null) {
    if (Array.isArray(jv) && jv.length > 0) {
      for (const el of jv) {
        const t = firstChoiceToken(el);
        if (t) return t;
      }
      return null;
    }
    if (typeof jv === "string") {
      const t = jv.trim();
      return t.length ? t : null;
    }
  }

  const v = field.value;
  if (v == null || v === "") return null;

  if (Array.isArray(v)) {
    for (const el of v) {
      const t = firstChoiceToken(el);
      if (t) return t;
    }
    return null;
  }

  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    if (t.startsWith("[")) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const el of parsed) {
            const t = firstChoiceToken(el);
            if (t) return t;
          }
          return null;
        }
      } catch {
        /* fall through to plain string */
      }
    }
    return t;
  }

  const s = String(v).trim();
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

/** Choice-list token for merchandising / style-family grouping; not restricted to a fixed enum here. */
function normalizeShapeGroupToken(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, "_");
  return s.length ? s : null;
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
  const cardDisplayName = stringField(node.cardDisplayNameField) || label;
  const abbreviation =
    stringField(node.abbreviationField) || fallbackAbbreviation(label);

  return {
    source: "shopify",
    value: node.id,
    label,
    cardDisplayName,
    sizingGuideGroup: stringField(node.sizingGuideGroupField),
    displayOrder: parseDisplayOrder(node.displayOrderField),
    abbreviation,
    shapeType: normalizeShapeType(choiceListSingleValueField(node.shapeTypeField)),
    shapeGroup: normalizeShapeGroupToken(
      choiceListSingleValueField(node.shapeGroupField)
    ),
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
 * @returns {Promise<object[]>} Sorted shape rows (includes non-representative rows for sizing-group expansion)
 */
export async function getShapesFromShopify(admin) {
  if (!admin?.graphql) {
    return [];
  }
  const nodes = await fetchAllShapePages(admin);
  return nodes
    .map(mapShapeMetaobjectNodeToFormShape)
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.label.localeCompare(b.label);
    });
}
