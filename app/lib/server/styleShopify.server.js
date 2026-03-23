/**
 * Shopify `style` metaobjects for create-product.
 *
 * Field keys (Content → Metaobject definition) must match Shopify:
 *   style, abbreviation, category, use_opposite_leather, leather_phrase, name_pattern,
 *   needs_secondary_leather, needs_stitching_color, needs_color_designation
 *
 * Styles are matched to collections by exact string equality:
 *   metaobject.category === collection.category (same choice-list value as custom.category).
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
        categoryField: field(key: "category") { value }
        useOppositeLeatherField: field(key: "use_opposite_leather") { value }
        leatherPhraseField: field(key: "leather_phrase") { value }
        namePatternField: field(key: "name_pattern") { value }
        needsSecondaryLeatherField: field(key: "needs_secondary_leather") { value }
        needsStitchingColorField: field(key: "needs_stitching_color") { value }
        needsColorDesignationField: field(key: "needs_color_designation") { value }
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
  const category = stringField(node.categoryField);

  return {
    source: "shopify",
    value: node.id,
    id: node.id,
    label,
    abbreviation,
    url_id: node.handle || null,
    category,
    styleChoice,
    useOppositeLeather: parseBoolField(node.useOppositeLeatherField),
    leatherPhrase: stringField(node.leatherPhraseField) ?? null,
    namePattern: normalizeNamePattern(stringField(node.namePatternField)),
    customNamePattern: null,
    overrideSecondaryLeather: parseBoolField(node.needsSecondaryLeatherField),
    overrideStitchingColor: parseBoolField(node.needsStitchingColorField),
    overrideColorDesignation: parseBoolField(node.needsColorDesignationField),
    skuPattern: null,
    titleTemplate: null,
    seoTemplate: null,
    handleTemplate: null,
    validation: null,
    overrideNamePattern: null,
    overrideCustomNamePattern: null,
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
 * Temporary UI/debug payload for collection custom.category vs style category matching.
 * Remove when matching is verified.
 */
export function buildStyleCategoryDebug(collectionsAfterAttach, formStyles, rawNodes) {
  const shopifyCols = collectionsAfterAttach.filter((c) => c.source === "shopify");
  return {
    metaobjectType: TYPE_STYLE,
    collections: shopifyCols.map((c) => ({
      title: c.label,
      handle: c.handle,
      mappedCategory: c.category,
      metafield_value: c.metafields?.category?.value ?? null,
      metafield_type: c.metafields?.category?.type ?? null,
    })),
    stylesGraphql: (rawNodes ?? []).map((n) => ({
      handle: n.handle,
      displayName: n.displayName,
      categoryField_value: n.categoryField?.value ?? null,
      categoryField_type: n.categoryField?.type ?? null,
      categoryAfterTrim: stringField(n.categoryField),
    })),
    stylesMapped: formStyles.map((s) => ({
      label: s.label,
      handle: s.url_id,
      category: s.category,
      categoryStringified:
        s.category == null ? null : JSON.stringify(s.category),
    })),
    matchResults: shopifyCols.map((c) => {
      const collCat = c.category != null ? String(c.category).trim() : "";
      return {
        collection: c.label,
        collectionHandle: c.handle,
        collectionCategoryCompared: collCat || "(empty — no styles attached)",
        matchedCount: c.styles?.length ?? 0,
        matchedStyleLabels: (c.styles ?? []).map((s) => s.label),
      };
    }),
  };
}

/**
 * Attaches `styles` and flags to each Shopify-sourced collection.
 * Category match is exact after trim on both sides.
 *
 * - `styles`: metaobjects whose `category` equals the collection's `category`.
 * - `needsStyle`: true only if more than one matching style — same as legacy collections where
 *   `needsStyle === false` when there is no real “pick a style” step. A single style is still
 *   attached in `styles[]` and auto-applied in form state (`globalStyle`), but flags, validation,
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
          const sc = s.category != null ? String(s.category).trim() : "";
          return sc === collCat;
        });

    filtered.sort((a, b) => a.label.localeCompare(b.label));

    const n = filtered.length;
    return {
      ...c,
      styles: filtered,
      needsStyle: n > 1,
    };
  });
}
