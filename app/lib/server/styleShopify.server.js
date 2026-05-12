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
  const s = (raw || "STYLE_PHRASE_COLOR")
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (s === "STYLE_WITH_COLOR_PHRASE" || s === "STYLE_PHRASE_COLOR") return s;
  return "STYLE_PHRASE_COLOR";
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

// ---------------------------------------------------------------------------
// Write-side: create a new style, ensure new choice values exist, fetch dropdown
// options off the style metaobject definition.
// ---------------------------------------------------------------------------

const STYLE_DEFINITION_QUERY = `#graphql
  query GetStyleDefinition {
    metaobjectDefinitionByType(type: "style") {
      id
      fieldDefinitions {
        key
        name
        type {
          name
        }
        validations {
          name
          value
        }
      }
    }
  }
`;

const METAOBJECT_DEFINITION_UPDATE = `#graphql
  mutation UpdateStyleDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition {
        id
        fieldDefinitions {
          key
          validations {
            name
            value
          }
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const STYLE_METAOBJECT_CREATE = `#graphql
  mutation CreateStyle($metaobject: MetaobjectCreateInput!) {
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
  }
`;

/** Choice-list value normalizer: trim and collapse whitespace, but keep case. */
function normalizeChoiceValue(value) {
  if (value == null) return "";
  return String(value).trim();
}

function slugifyStyleHandle(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "style"
  );
}

/**
 * Reads the style metaobject definition and returns choice-list options for
 * dropdown fields plus the definition's GID (needed to extend the `style`
 * choice list when Karl types a brand-new name).
 *
 * @param {Object} admin - Shopify Admin GraphQL client.
 * @returns {Promise<{
 *   definitionId: string|null,
 *   style: Array<{label:string,value:string}>,
 *   category: Array<{label:string,value:string}>,
 *   collectionCategory: Array<{label:string,value:string}>,
 *   shapeGroup: Array<{label:string,value:string}>,
 *   namePattern: Array<{label:string,value:string}>,
 * }>}
 */
export async function getStyleMetaobjectChoiceOptions(admin) {
  const empty = {
    definitionId: null,
    style: [],
    category: [],
    collectionCategory: [],
    shapeGroup: [],
    namePattern: [],
  };
  if (!admin?.graphql) return empty;

  try {
    const resp = await admin.graphql(STYLE_DEFINITION_QUERY);
    const json = await resp.json();
    const def = json?.data?.metaobjectDefinitionByType;
    if (!def) return empty;

    const fieldChoices = (fieldKey) => {
      const field = (def.fieldDefinitions ?? []).find((f) => f.key === fieldKey);
      if (!field) return [];
      const choicesValidation = (field.validations ?? []).find((v) => v.name === "choices");
      if (!choicesValidation?.value) return [];
      let parsed;
      try {
        parsed = JSON.parse(choicesValidation.value);
      } catch {
        return [];
      }
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((v) => normalizeChoiceValue(v))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map((label) => ({ label, value: label }));
    };

    return {
      definitionId: def.id,
      style: fieldChoices("style"),
      category: fieldChoices("category"),
      collectionCategory: fieldChoices("collection_category"),
      shapeGroup: fieldChoices("shape_group"),
      namePattern: fieldChoices("name_pattern"),
    };
  } catch (error) {
    console.error("getStyleMetaobjectChoiceOptions failed:", error);
    return empty;
  }
}

/**
 * Ensures `newValue` exists in the choices validation of the style metaobject's
 * `fieldKey` field. If absent, merges it in via `metaobjectDefinitionUpdate`.
 *
 * Used to auto-extend the `style` choice list when Karl types a brand-new
 * style name. Returns `{ added: boolean }` so the route can surface whether
 * it actually mutated the definition.
 *
 * @param {Object} admin
 * @param {string} fieldKey - e.g. "style"
 * @param {string} newValue
 * @returns {Promise<{ added: boolean }>}
 */
export async function ensureStyleChoiceListValue(admin, fieldKey, newValue) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required.");
  }
  const trimmed = normalizeChoiceValue(newValue);
  if (!trimmed) return { added: false };

  const resp = await admin.graphql(STYLE_DEFINITION_QUERY);
  const json = await resp.json();
  const def = json?.data?.metaobjectDefinitionByType;
  if (!def?.id) {
    throw new Error(`Could not find metaobject definition for type "style".`);
  }
  const field = (def.fieldDefinitions ?? []).find((f) => f.key === fieldKey);
  if (!field) {
    throw new Error(`Style metaobject definition has no field "${fieldKey}".`);
  }

  const existingValidations = Array.isArray(field.validations) ? field.validations : [];
  const choicesValidation = existingValidations.find((v) => v.name === "choices");
  let currentChoices = [];
  if (choicesValidation?.value) {
    try {
      const parsed = JSON.parse(choicesValidation.value);
      if (Array.isArray(parsed)) {
        currentChoices = parsed.map((v) => normalizeChoiceValue(v)).filter(Boolean);
      }
    } catch {
      currentChoices = [];
    }
  }

  if (currentChoices.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    return { added: false };
  }

  const nextChoices = [...currentChoices, trimmed];

  /**
   * Preserve every other validation untouched (e.g. min/max len) and only swap
   * the `choices` entry. Shopify replaces the entire `validations` array, so
   * omitting any preserved validation drops it.
   */
  const nextValidations = [
    ...existingValidations.filter((v) => v?.name !== "choices"),
    { name: "choices", value: JSON.stringify(nextChoices) },
  ].map(({ name, value }) => ({ name, value }));

  const updateResp = await admin.graphql(METAOBJECT_DEFINITION_UPDATE, {
    variables: {
      id: def.id,
      definition: {
        fieldDefinitions: [
          {
            update: {
              key: fieldKey,
              validations: nextValidations,
            },
          },
        ],
      },
    },
  });
  const updateJson = await updateResp.json();
  const result = updateJson?.data?.metaobjectDefinitionUpdate;
  if (result?.userErrors?.length) {
    const message = result.userErrors.map((e) => e.message).join(", ");
    throw new Error(`Failed to extend choice list "${fieldKey}": ${message}`);
  }
  return { added: true };
}

/**
 * Create a new `style` metaobject.
 *
 * - Booleans serialized as `"true"` / `"false"` strings.
 * - Choice-list values written as plain strings (Shopify accepts the raw choice).
 * - `preview_image` is a `file_reference` field — value is the MediaImage GID
 *   returned by `uploadShopifyImageFile`.
 * - `sort_number` is a numeric_integer field — sent as a string.
 *
 * All conditional fields (needsColorDesignation, namePattern, leatherPhrase,
 * useOppositeLeather) are only attached when `useInVariantTitle === true` so the
 * metaobject doesn't carry stale variant-naming flags for styles that don't
 * participate in variant titles.
 *
 * @returns {Promise<{ id: string, label: string, abbreviation: string }>}
 */
export async function createShopifyStyle(admin, params) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required to create style metaobjects.");
  }

  const {
    style,
    category,
    description,
    previewImageId,
    sortNumber,
    collectionCategory,
    shapeGroup,
    abbreviation,
    useInVariantTitle,
    needsColorDesignation,
    namePattern,
    leatherPhrase,
    useOppositeLeather,
  } = params || {};

  const styleName = normalizeChoiceValue(style);
  if (!styleName) throw new Error("Style name is required.");
  const categoryValue = normalizeChoiceValue(category);
  if (!categoryValue) throw new Error("Category is required.");
  const collectionCategoryValue = normalizeChoiceValue(collectionCategory);
  if (!collectionCategoryValue) throw new Error("Collection category is required.");
  const shapeGroupValue = normalizeChoiceValue(shapeGroup);
  if (!shapeGroupValue) throw new Error("Shape group is required.");
  const abbreviationValue = normalizeChoiceValue(abbreviation) || fallbackAbbreviation(styleName);
  const useInVariantTitleBool = useInVariantTitle === true || useInVariantTitle === "true";

  const fields = [
    { key: "style", value: styleName },
    { key: "category", value: JSON.stringify([categoryValue]) },
    { key: "collection_category", value: JSON.stringify([collectionCategoryValue]) },
    { key: "shape_group", value: JSON.stringify([shapeGroupValue]) },
    { key: "abbreviation", value: abbreviationValue },
    { key: "use_in_variant_title", value: useInVariantTitleBool ? "true" : "false" },
  ];

  const descriptionTrimmed = description != null ? String(description).trim() : "";
  if (descriptionTrimmed) {
    fields.push({ key: "description", value: descriptionTrimmed });
  }
  if (previewImageId) {
    fields.push({ key: "preview_image", value: String(previewImageId) });
  }
  if (sortNumber != null && String(sortNumber).trim() !== "") {
    const parsed = Number.parseInt(String(sortNumber), 10);
    if (Number.isFinite(parsed)) {
      fields.push({ key: "sort_number", value: String(parsed) });
    }
  }

  if (useInVariantTitleBool) {
    const namePatternValue = normalizeChoiceValue(namePattern);
    if (!namePatternValue) throw new Error("Name pattern is required when used in variant title.");
    const leatherPhraseValue = normalizeChoiceValue(leatherPhrase);
    if (!leatherPhraseValue) throw new Error("Leather phrase is required when used in variant title.");
    if (needsColorDesignation !== true && needsColorDesignation !== false) {
      throw new Error("Needs color designation must be answered when used in variant title.");
    }
    if (useOppositeLeather !== true && useOppositeLeather !== false) {
      throw new Error("Use opposite leather must be answered when used in variant title.");
    }
    fields.push({ key: "name_pattern", value: JSON.stringify([namePatternValue]) });
    fields.push({ key: "leather_phrase", value: leatherPhraseValue });
    fields.push({ key: "needs_color_designation", value: needsColorDesignation ? "true" : "false" });
    fields.push({ key: "use_opposite_leather", value: useOppositeLeather ? "true" : "false" });
  }

  const handle = slugifyStyleHandle(styleName);

  const response = await admin.graphql(STYLE_METAOBJECT_CREATE, {
    variables: {
      metaobject: {
        type: TYPE_STYLE,
        handle,
        fields,
        capabilities: {
          publishable: { status: "ACTIVE" },
        },
      },
    },
  });
  const json = await response.json();
  const result = json?.data?.metaobjectCreate;
  if (result?.userErrors?.length) {
    const message = result.userErrors.map((e) => e.message).join(", ");
    throw new Error(`Failed to create style metaobject: ${message}`);
  }
  const meta = result?.metaobject;
  if (!meta?.id) {
    throw new Error("Shopify did not return an ID for the created style metaobject.");
  }
  return {
    id: meta.id,
    label: meta.displayName || styleName,
    abbreviation: abbreviationValue,
  };
}
