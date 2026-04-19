// app/lib/server/embroideryThreadShopify.server.js
/**
 * Embroidery threads + Isacord numbers via Shopify metaobjects.
 *
 * Types: embroidery_thread, isacord_number
 * isacord_number fields: number, wawak_color_name, wawak_item_number, single_embroidery_thread_name
 */

const TYPE_EMBROIDERY_THREAD = "embroidery_thread";
const TYPE_ISACORD_NUMBER = "isacord_number";

const KEY_NAME = "name";
const KEY_ABBREVIATION = "abbreviation";
const KEY_NUMBER = "number";
const KEY_WAWAK_COLOR = "wawak_color_name";
const KEY_WAWAK_ITEM = "wawak_item_number";
const KEY_SINGLE_THREAD_REF = "single_embroidery_thread_name";

const PAGE_SIZE = 250;

const LIST_EMBROIDERY_THREADS = `#graphql
  query ListEmbroideryThreads($type: String!, $first: Int!, $after: String) {
    metaobjects(type: $type, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        displayName
        nameField: field(key: "name") { value }
        abbreviationField: field(key: "abbreviation") { value }
      }
    }
  }
`;

const LIST_ISACORD_NUMBERS = `#graphql
  query ListIsacordNumbers($type: String!, $first: Int!, $after: String) {
    metaobjects(type: $type, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        numberField: field(key: "number") { value }
        wawakColorField: field(key: "wawak_color_name") { value }
        wawakItemField: field(key: "wawak_item_number") { value }
        threadRefField: field(key: "single_embroidery_thread_name") {
          value
        }
      }
    }
  }
`;

const GET_ISACORD_FOR_UPDATE = `#graphql
  query GetIsacordMetaobject($id: ID!) {
    metaobject(id: $id) {
      id
      numberField: field(key: "number") { value }
      wawakColorField: field(key: "wawak_color_name") { value }
      wawakItemField: field(key: "wawak_item_number") { value }
    }
  }
`;

const CREATE_EMBROIDERY_THREAD = `#graphql
  mutation CreateEmbroideryThread($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
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
  }
`;

const UPDATE_ISACORD = `#graphql
  mutation UpdateIsacordNumber($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const GET_EMBROIDERY_THREAD_LABEL = `#graphql
  query EmbroideryThreadLabel($id: ID!) {
    metaobject(id: $id) {
      nameField: field(key: "name") { value }
      abbreviationField: field(key: "abbreviation") { value }
    }
  }
`;

function slugify(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "embroidery-thread"
  );
}

function uniqueEmbroideryHandle(name) {
  const base = `emb-${slugify(name)}`;
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/** Resolve linked embroidery thread GID from isacord reference field value. */
function linkedThreadIdFromIsacordNode(node) {
  const raw = node?.threadRefField?.value;
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  // Single metaobject_reference is often stored as the raw GID.
  if (trimmed.startsWith("gid://")) return trimmed;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]);
    if (typeof parsed === "string" && parsed.startsWith("gid://")) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

async function fetchAllMetaobjectPages(admin, query, variablesBase) {
  const allNodes = [];
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(query, {
      variables: { ...variablesBase, first: PAGE_SIZE, after },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const conn = json.data?.metaobjects;
    const nodes = conn?.nodes ?? [];
    allNodes.push(...nodes);
    hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
    after = conn?.pageInfo?.endCursor ?? null;
  }

  return allNodes;
}

/**
 * Loader data: embroidery threads with linked isacord numbers + unlinked isacords.
 * Shape matches legacy Postgres mapping for AddEmbroideryThreadColorForm.
 *
 * @returns {Promise<{ embroideryThreadColors: object[], unlinkedIsacordNumbers: object[], loadError?: string }>}
 */
export async function getEmbroideryThreadColorDataFromShopify(admin) {
  if (!admin?.graphql) {
    return {
      embroideryThreadColors: [],
      unlinkedIsacordNumbers: [],
      loadError: "No Shopify admin GraphQL client available.",
    };
  }

  try {
    const [threadNodes, isacordNodes] = await Promise.all([
      fetchAllMetaobjectPages(admin, LIST_EMBROIDERY_THREADS, {
        type: TYPE_EMBROIDERY_THREAD,
      }),
      fetchAllMetaobjectPages(admin, LIST_ISACORD_NUMBERS, {
        type: TYPE_ISACORD_NUMBER,
      }),
    ]);

    const threadMap = new Map();
    for (const node of threadNodes) {
      const name = node.nameField?.value ?? node.displayName ?? "";
      const abbreviation = node.abbreviationField?.value ?? "";
      threadMap.set(node.id, {
        value: node.id,
        label: name,
        abbreviation,
        isacordNumbers: [],
      });
    }

    const unlinkedIsacordNumbers = [];

    for (const node of isacordNodes) {
      const numLabel = node.numberField?.value ?? "";
      const isacordEntry = {
        value: node.id,
        label: numLabel || node.id,
      };
      const threadId = linkedThreadIdFromIsacordNode(node);
      if (threadId && threadMap.has(threadId)) {
        threadMap.get(threadId).isacordNumbers.push(isacordEntry);
      } else if (threadId && !threadMap.has(threadId)) {
        unlinkedIsacordNumbers.push({ ...isacordEntry, threadId, threadName: null });
      } else {
        unlinkedIsacordNumbers.push(isacordEntry);
      }
    }

    const embroideryThreadColors = Array.from(threadMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
    unlinkedIsacordNumbers.sort((a, b) => a.label.localeCompare(b.label));

    return { embroideryThreadColors, unlinkedIsacordNumbers };
  } catch (error) {
    const msg = error?.message ?? String(error);
    console.error("[getEmbroideryThreadColorDataFromShopify]", error);
    return {
      embroideryThreadColors: [],
      unlinkedIsacordNumbers: [],
      loadError: msg,
    };
  }
}

/**
 * Value for single metaobject_reference: plain GID string (not a JSON array — that is for list references).
 * Clear with empty string.
 */
function threadRefFieldValue(threadGid) {
  if (!threadGid) return "";
  return String(threadGid).trim();
}

async function fetchIsacordFieldsForUpdate(admin, isacordGid) {
  const response = await admin.graphql(GET_ISACORD_FOR_UPDATE, {
    variables: { id: isacordGid },
  });
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  const mo = json.data?.metaobject;
  if (!mo?.id) {
    throw new Error(`Isacord metaobject not found: ${isacordGid}`);
  }
  return {
    number: mo.numberField?.value ?? "",
    wawakColorName: mo.wawakColorField?.value ?? "",
    wawakItemNumber: mo.wawakItemField?.value ?? "",
  };
}

async function runIsacordMetaobjectUpdate(admin, isacordGid, fields) {
  const response = await admin.graphql(UPDATE_ISACORD, {
    variables: {
      id: isacordGid,
      metaobject: { fields },
    },
  });
  const json = await response.json();
  if (json.errors?.length) {
    console.error("[embroideryThreadShopify] metaobjectUpdate GraphQL errors", json.errors);
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data?.metaobjectUpdate?.userErrors ?? [];
}

/**
 * Point isacord_number at an embroidery_thread (or clear link when threadGid is null/empty).
 * Tries reference-only update first (avoids sending empty strings for required text fields).
 * Falls back to read-merge of number + Wawak fields if Shopify requires a full row.
 */
export async function setIsacordEmbroideryThreadLink(admin, isacordGid, threadGid) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required.");
  }

  const refValue = threadRefFieldValue(threadGid);

  const partialErrors = await runIsacordMetaobjectUpdate(admin, isacordGid, [
    { key: KEY_SINGLE_THREAD_REF, value: refValue },
  ]);
  if (!partialErrors.length) return;

  const { number, wawakColorName, wawakItemNumber } = await fetchIsacordFieldsForUpdate(admin, isacordGid);
  const scalarFields = [
    { key: KEY_NUMBER, value: number },
    { key: KEY_WAWAK_COLOR, value: wawakColorName },
    { key: KEY_WAWAK_ITEM, value: wawakItemNumber },
  ];

  let fullErrors = await runIsacordMetaobjectUpdate(admin, isacordGid, [
    ...scalarFields,
    { key: KEY_SINGLE_THREAD_REF, value: refValue },
  ]);

  // If definition is still list.metaobject_reference, Shopify expects a JSON array string.
  if (fullErrors.length && refValue) {
    const listEncoded = JSON.stringify([refValue]);
    fullErrors = await runIsacordMetaobjectUpdate(admin, isacordGid, [
      ...scalarFields,
      { key: KEY_SINGLE_THREAD_REF, value: listEncoded },
    ]);
  }

  if (fullErrors.length) {
    console.error("[embroideryThreadShopify] metaobjectUpdate userErrors (after merge)", fullErrors);
    throw new Error(fullErrors.map((e) => e.message).join(", "));
  }
}

/**
 * Create embroidery_thread (ACTIVE) and link existing isacord_number entries.
 */
export async function createEmbroideryThreadAndLinkIsacordNumbers(admin, { name, abbreviation, isacordIds }) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required.");
  }
  const nameTrim = String(name || "").trim();
  const abbrTrim = String(abbreviation || "").trim();
  if (!nameTrim) throw new Error("Name is required.");
  if (!abbrTrim) throw new Error("Abbreviation is required.");

  const fields = [
    { key: KEY_NAME, value: nameTrim },
    { key: KEY_ABBREVIATION, value: abbrTrim },
  ];

  const createResponse = await admin.graphql(CREATE_EMBROIDERY_THREAD, {
    variables: {
      metaobject: {
        type: TYPE_EMBROIDERY_THREAD,
        handle: uniqueEmbroideryHandle(nameTrim),
        fields,
        capabilities: {
          publishable: { status: "ACTIVE" },
        },
      },
    },
  });
  const createJson = await createResponse.json();
  const createResult = createJson.data?.metaobjectCreate;

  if (createJson.errors?.length) {
    throw new Error(createJson.errors.map((e) => e.message).join("; "));
  }
  if (createResult?.userErrors?.length) {
    throw new Error(createResult.userErrors.map((e) => e.message).join(", "));
  }

  const threadId = createResult?.metaobject?.id;
  if (!threadId) {
    throw new Error("Shopify did not return the new embroidery_thread id.");
  }

  const ids = Array.isArray(isacordIds) ? isacordIds.filter(Boolean) : [];
  const linkErrors = [];
  for (const isacordGid of ids) {
    try {
      await setIsacordEmbroideryThreadLink(admin, isacordGid, threadId);
    } catch (err) {
      const msg = err?.message || String(err);
      linkErrors.push(`${isacordGid}: ${msg}`);
      console.error("[embroideryThreadShopify] link isacord failed", isacordGid, err);
    }
  }
  if (linkErrors.length) {
    throw new Error(
      `Embroidery thread was created but ${linkErrors.length} Isacord link(s) failed: ${linkErrors.join("; ")}`
    );
  }

  return {
    id: threadId,
    name: nameTrim,
    abbreviation: abbrTrim,
  };
}

/**
 * Update links only: add/remove isacord_number → thread references. Does not change thread name/abbreviation.
 */
export async function updateEmbroideryThreadIsacordLinks(admin, { threadId, addIsacordIds = [], removeIsacordIds = [] }) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required.");
  }
  if (!threadId) throw new Error("Thread id is required.");

  for (const id of removeIsacordIds) {
    if (id) await setIsacordEmbroideryThreadLink(admin, id, null);
  }
  for (const id of addIsacordIds) {
    if (id) await setIsacordEmbroideryThreadLink(admin, id, threadId);
  }

  const labelRes = await admin.graphql(GET_EMBROIDERY_THREAD_LABEL, { variables: { id: threadId } });
  const labelJson = await labelRes.json();
  const mo = labelJson.data?.metaobject;
  const name = mo?.nameField?.value ?? "";
  const abbreviation = mo?.abbreviationField?.value ?? "";

  return { id: threadId, name, abbreviation };
}
