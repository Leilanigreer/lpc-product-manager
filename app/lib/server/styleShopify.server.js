/**
 * Shopify `style` metaobjects for create-product.
 *
 * Field keys (Content → Metaobject definition) must match Shopify:
 *   style, abbreviation, collection_category, shape_group,
 *   use_opposite_leather, leather_phrase, name_pattern, custom_name_pattern, needs_color_designation,
 *   use_in_variant_title (boolean, default true when omitted)
 *
 * Collection-level flags (e.g. needs_secondary_leather, stitching/thread rules) live on collection
 * metafields — not on style.
 *
 * Styles are matched to collections by exact string equality:
 *   metaobject.collection_category === collection.category (same choice-list value as custom.category).
 */

const TYPE_STYLE = "style";
const PAGE_SIZE = 250;

const LIST_STYLES = `#graphql
  query ListStyleMetaobjects($type: String!, $first: Int!, $after: String) {
    metaobjects(type: $type, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        displayName
        styleField: field(key: "style") { value }
        abbreviationField: field(key: "abbreviation") { value }
        collectionCategoryField: field(key: "collection_category") {
          value
          jsonValue
        }
        shapeGroupField: field(key: "shape_group") {
          value
          jsonValue
        }
        useOppositeLeatherField: field(key: "use_opposite_leather") { value }
        leatherPhraseField: field(key: "leather_phrase") { value }
        namePatternField: field(key: "name_pattern") { value }
        customNamePatternField: field(key: "custom_name_pattern") { value }
        needsColorDesignationField: field(key: "needs_color_designation") { value }
        useInVariantTitleField: field(key: "use_in_variant_title") { value }
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

/** Shopify choice list single value (jsonValue array or value as JSON array string). */
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
            const token = firstChoiceToken(el);
            if (token) return token;
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

function normalizeNamePattern(raw) {
  const s = (raw || "STANDARD").toString().trim().toUpperCase().replace(/\s+/g, "_");
  if (s === "STYLE_FIRST" || s === "CUSTOM" || s === "STANDARD") return s;
  return "STANDARD";
}

function fallbackAbbreviation(label) {
  if (!label || typeof label !== "string") return "STY";
  const cleaned = label.replace(/[^a-zA-Z0-9]+/g, "").slice(0, 8);
  return cleaned.length ? cleaned.toUpperCase() : "STY";
}

/**
 * Maps a GraphQL metaobject node to the shape expected by ShapeSelector / generators (legacy-compatible).
 */
export function mapStyleMetaobjectNodeToFormStyle(node) {
  const styleChoice = stringField(node.styleField);
  const label = styleChoice || node.displayName || node.handle || node.id;
  const abbreviation = stringField(node.abbreviationField) || fallbackAbbreviation(label);
  const collectionCategory = choiceListSingleValueField(node.collectionCategoryField);
  const shapeGroup = choiceListSingleValueField(node.shapeGroupField);

  const useInVariantTitleRaw = node.useInVariantTitleField;
  const useInVariantTitle =
    useInVariantTitleRaw == null ||
    useInVariantTitleRaw.value === null ||
    useInVariantTitleRaw.value === ""
      ? true
      : parseBoolField(useInVariantTitleRaw);

  return {
    source: "shopify",
    value: node.id,
    id: node.id,
    label,
    abbreviation,
    url_id: node.handle || null,
    collectionCategory,
    shapeGroup,
    styleChoice,
    useOppositeLeather: parseBoolField(node.useOppositeLeatherField),
    leatherPhrase: stringField(node.leatherPhraseField) ?? null,
    namePattern: normalizeNamePattern(stringField(node.namePatternField)),
    customNamePattern: stringField(node.customNamePatternField) ?? null,
    needsColorDesignation: parseBoolField(node.needsColorDesignationField),
    useInVariantTitle,
  };
}

/** @param {Object} admin - Shopify admin client */
export async function fetchStyleMetaobjectNodes(admin) {
  if (!admin?.graphql) {
    return [];
  }
  return fetchAllStylePages(admin);
}

async function fetchAllStylePages(admin) {
  const allNodes = [];
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(LIST_STYLES, {
      variables: { type: TYPE_STYLE, first: PAGE_SIZE, after },
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
 * @returns {Promise<object[]>} Form-shaped style rows (unsorted)
 */
export async function getStylesFromShopify(admin) {
  const nodes = await fetchStyleMetaobjectNodes(admin);
  return nodes.map(mapStyleMetaobjectNodeToFormStyle);
}

/**
 * Attaches `styles` and flags to each Shopify-sourced collection.
 * Category match is exact after trim on both sides.
 *
 * - `styles`: metaobjects whose `collectionCategory` equals the collection's `category`.
 * - `needsStyle`: true only if more than one matching style — same as legacy collections where
 *   `needsStyle === false` when there is no real “pick a style” step. A single style is still
 *   attached in `styles[]` and auto-applied per shape in form state when unambiguous, but flags, validation,
 *   DB style FK, thread/shape UI, and wood collapse behave like the old false case.
 *
 * @param {object[]} collections - From getProductCollectionsFromShopify
 * @param {object[]} formStyles - From getStylesFromShopify
 * @returns {object[]}
 */
export function attachStylesToShopifyCollections(collections, formStyles) {
  return collections.map((c) => {
    if (c.source !== "shopify") {
      return c;
    }
    const collCat = c.category != null ? String(c.category).trim() : "";
    const filtered = !collCat
      ? []
      : formStyles.filter((s) => {
          const sc =
            s.collectionCategory != null
              ? String(s.collectionCategory).trim()
              : "";
          return sc === collCat;
        });

    filtered.sort((a, b) => a.label.localeCompare(b.label));

    const groupCounts = filtered.reduce((acc, s) => {
      const key = s.shapeGroup != null && String(s.shapeGroup).trim() !== ''
        ? String(s.shapeGroup).trim()
        : 'UNKNOWN';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    // Only require user style selection when any shape_group has >1 valid styles
    // within the current collection_category.
    const needsStyle = Object.values(groupCounts).some((count) => count > 1);

    return {
      ...c,
      styles: filtered,
      needsStyle,
    };
  });
}
