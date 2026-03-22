// app/lib/server/stitchingThreadShopify.server.js
/**
 * Stitching threads + Amann numbers via Shopify metaobjects.
 *
 * Types: stitching_thread, amann_number
 * amann_number fields: number, wawak_color_name, wawak_item_number, single_stitching_thread_name
 */

const TYPE_STITCHING_THREAD = "stitching_thread";
const TYPE_AMANN_NUMBER = "amann_number";

const KEY_NAME = "name";
const KEY_ABBREVIATION = "abbreviation";
const KEY_NUMBER = "number";
const KEY_WAWAK_COLOR = "wawak_color_name";
const KEY_WAWAK_ITEM = "wawak_item_number";
const KEY_SINGLE_THREAD_REF = "single_stitching_thread_name";

const PAGE_SIZE = 250;

const LIST_STITCHING_THREADS = `#graphql
  query ListStitchingThreads($type: String!, $first: Int!, $after: String) {
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

const LIST_AMANN_NUMBERS = `#graphql
  query ListAmannNumbers($type: String!, $first: Int!, $after: String) {
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
        threadRefField: field(key: "single_stitching_thread_name") {
          value
        }
      }
    }
  }
`;

const GET_AMANN_FOR_UPDATE = `#graphql
  query GetAmannMetaobject($id: ID!) {
    metaobject(id: $id) {
      id
      numberField: field(key: "number") { value }
      wawakColorField: field(key: "wawak_color_name") { value }
      wawakItemField: field(key: "wawak_item_number") { value }
    }
  }
`;

const CREATE_STITCHING_THREAD = `#graphql
  mutation CreateStitchingThread($metaobject: MetaobjectCreateInput!) {
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

const UPDATE_AMANN = `#graphql
  mutation UpdateAmannNumber($id: ID!, $metaobject: MetaobjectUpdateInput!) {
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

const GET_STITCHING_THREAD_LABEL = `#graphql
  query StitchingThreadLabel($id: ID!) {
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
      .replace(/^-+|-+$/g, "") || "stitching-thread"
  );
}

function uniqueStitchingHandle(name) {
  const base = `stitch-${slugify(name)}`;
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

function linkedThreadIdFromAmannNode(node) {
  const raw = node?.threadRefField?.value;
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
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
 * Loader data: stitching threads with linked Amann numbers + unlinked Amann.
 * Shape expected by AddStitchingThreadColorForm and ThreadColorSelector (value/label + amannNumbers).
 */
export async function getStitchingThreadColorDataFromShopify(admin) {
  if (!admin?.graphql) {
    return { stitchingThreadColors: [], unlinkedAmannNumbers: [] };
  }

  const [threadNodes, amannNodes] = await Promise.all([
    fetchAllMetaobjectPages(admin, LIST_STITCHING_THREADS, {
      type: TYPE_STITCHING_THREAD,
    }),
    fetchAllMetaobjectPages(admin, LIST_AMANN_NUMBERS, {
      type: TYPE_AMANN_NUMBER,
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
      amannNumbers: [],
    });
  }

  const unlinkedAmannNumbers = [];

  for (const node of amannNodes) {
    const numLabel = node.numberField?.value ?? "";
    const amannEntry = {
      value: node.id,
      label: numLabel || node.id,
    };
    const threadId = linkedThreadIdFromAmannNode(node);
    if (threadId && threadMap.has(threadId)) {
      threadMap.get(threadId).amannNumbers.push(amannEntry);
    } else if (threadId && !threadMap.has(threadId)) {
      unlinkedAmannNumbers.push({ ...amannEntry, threadId, threadName: null });
    } else {
      unlinkedAmannNumbers.push(amannEntry);
    }
  }

  const stitchingThreadColors = Array.from(threadMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  unlinkedAmannNumbers.sort((a, b) => a.label.localeCompare(b.label));

  return { stitchingThreadColors, unlinkedAmannNumbers };
}

function threadRefFieldValue(threadGid) {
  if (!threadGid) return "";
  return String(threadGid).trim();
}

async function fetchAmannFieldsForUpdate(admin, amannGid) {
  const response = await admin.graphql(GET_AMANN_FOR_UPDATE, {
    variables: { id: amannGid },
  });
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  const mo = json.data?.metaobject;
  if (!mo?.id) {
    throw new Error(`Amann metaobject not found: ${amannGid}`);
  }
  return {
    number: mo.numberField?.value ?? "",
    wawakColorName: mo.wawakColorField?.value ?? "",
    wawakItemNumber: mo.wawakItemField?.value ?? "",
  };
}

async function runAmannMetaobjectUpdate(admin, amannGid, fields) {
  const response = await admin.graphql(UPDATE_AMANN, {
    variables: {
      id: amannGid,
      metaobject: { fields },
    },
  });
  const json = await response.json();
  if (json.errors?.length) {
    console.error("[stitchingThreadShopify] metaobjectUpdate GraphQL errors", json.errors);
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data?.metaobjectUpdate?.userErrors ?? [];
}

/**
 * Point amann_number at a stitching_thread (or clear link when threadGid is null/empty).
 */
export async function setAmannStitchingThreadLink(admin, amannGid, threadGid) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required.");
  }

  const refValue = threadRefFieldValue(threadGid);

  const partialErrors = await runAmannMetaobjectUpdate(admin, amannGid, [
    { key: KEY_SINGLE_THREAD_REF, value: refValue },
  ]);
  if (!partialErrors.length) return;

  const { number, wawakColorName, wawakItemNumber } = await fetchAmannFieldsForUpdate(admin, amannGid);
  const scalarFields = [
    { key: KEY_NUMBER, value: number },
    { key: KEY_WAWAK_COLOR, value: wawakColorName },
    { key: KEY_WAWAK_ITEM, value: wawakItemNumber },
  ];

  let fullErrors = await runAmannMetaobjectUpdate(admin, amannGid, [
    ...scalarFields,
    { key: KEY_SINGLE_THREAD_REF, value: refValue },
  ]);

  if (fullErrors.length && refValue) {
    const listEncoded = JSON.stringify([refValue]);
    fullErrors = await runAmannMetaobjectUpdate(admin, amannGid, [
      ...scalarFields,
      { key: KEY_SINGLE_THREAD_REF, value: listEncoded },
    ]);
  }

  if (fullErrors.length) {
    console.error("[stitchingThreadShopify] metaobjectUpdate userErrors (after merge)", fullErrors);
    throw new Error(fullErrors.map((e) => e.message).join(", "));
  }
}

/**
 * Create stitching_thread (ACTIVE) and link existing amann_number entries.
 */
export async function createStitchingThreadAndLinkAmannNumbers(admin, { name, abbreviation, amannIds }) {
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

  const createResponse = await admin.graphql(CREATE_STITCHING_THREAD, {
    variables: {
      metaobject: {
        type: TYPE_STITCHING_THREAD,
        handle: uniqueStitchingHandle(nameTrim),
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
    throw new Error("Shopify did not return the new stitching_thread id.");
  }

  const ids = Array.isArray(amannIds) ? amannIds.filter(Boolean) : [];
  const linkErrors = [];
  for (const amannGid of ids) {
    try {
      await setAmannStitchingThreadLink(admin, amannGid, threadId);
    } catch (err) {
      const msg = err?.message || String(err);
      linkErrors.push(`${amannGid}: ${msg}`);
      console.error("[stitchingThreadShopify] link amann failed", amannGid, err);
    }
  }
  if (linkErrors.length) {
    throw new Error(
      `Stitching thread was created but ${linkErrors.length} Amann link(s) failed: ${linkErrors.join("; ")}`
    );
  }

  return {
    id: threadId,
    name: nameTrim,
    abbreviation: abbrTrim,
  };
}

/**
 * Update links only: add/remove amann_number → thread references.
 */
export async function updateStitchingThreadAmannLinks(admin, { threadId, addAmannIds = [], removeAmannIds = [] }) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required.");
  }
  if (!threadId) throw new Error("Thread id is required.");

  for (const id of removeAmannIds) {
    if (id) await setAmannStitchingThreadLink(admin, id, null);
  }
  for (const id of addAmannIds) {
    if (id) await setAmannStitchingThreadLink(admin, id, threadId);
  }

  const labelRes = await admin.graphql(GET_STITCHING_THREAD_LABEL, { variables: { id: threadId } });
  const labelJson = await labelRes.json();
  const mo = labelJson.data?.metaobject;
  const name = mo?.nameField?.value ?? "";
  const abbreviation = mo?.abbreviationField?.value ?? "";

  return { id: threadId, name, abbreviation };
}
