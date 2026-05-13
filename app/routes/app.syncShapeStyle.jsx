import { useCallback, useEffect, useMemo, useState } from "react";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  Banner,
  Box,
  InlineStack,
  Badge,
  Checkbox,
  Divider,
  Select,
} from "@shopify/polaris";
import {
  scanShapeStyleVariantMetafieldDrift,
  syncShapeStyleVariantMetafields,
} from "../lib/server/shapeStyleMetafieldSyncShopify.server.js";
import {
  fetchCreationCollectionsForSkuSync,
  collectionIsInCreationDropdown,
} from "../lib/server/skuSyncShopify.server.js";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop ?? "";
  const storeHandle = shop.replace(/\.myshopify\.com$/i, "");
  const creationCollections = await fetchCreationCollectionsForSkuSync((query, options) =>
    admin.graphql(query, options)
  );
  return json({ shop, storeHandle, creationCollections });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const graphql = (query, options) => admin.graphql(query, options);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "scan") {
    try {
      const rawScope = formData.get("scopeCollectionId");
      const scope =
        typeof rawScope === "string" && rawScope.trim() ? rawScope.trim() : "all";

      let collectionIds;
      if (scope === "all") {
        const creationRows = await fetchCreationCollectionsForSkuSync(graphql);
        collectionIds = creationRows.map((c) => c.id);
      } else {
        const allowed = await collectionIsInCreationDropdown(graphql, scope);
        if (!allowed) {
          return json(
            {
              ok: false,
              phase: "scan",
              error: "That collection is not in the create-product set.",
            },
            { status: 400 }
          );
        }
        collectionIds = [scope];
      }

      const { rows, totalProducts } = await scanShapeStyleVariantMetafieldDrift(
        graphql,
        collectionIds
      );
      return json({
        ok: true,
        phase: "scan",
        rows,
        totalProducts,
      });
    } catch (e) {
      return json(
        { ok: false, phase: "scan", error: e?.message ?? String(e) },
        { status: 500 }
      );
    }
  }

  if (intent === "sync") {
    const raw = formData.get("productIds");
    let productIds = [];
    try {
      productIds = JSON.parse(typeof raw === "string" ? raw : "[]");
    } catch {
      return json(
        { ok: false, phase: "sync", error: "Invalid productIds payload." },
        { status: 400 }
      );
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return json(
        { ok: false, phase: "sync", error: "No products selected." },
        { status: 400 }
      );
    }
    try {
      const result = await syncShapeStyleVariantMetafields(graphql, productIds);
      return json({ ok: true, phase: "sync", ...result });
    } catch (e) {
      return json(
        { ok: false, phase: "sync", error: e?.message ?? String(e) },
        { status: 500 }
      );
    }
  }

  return json({ ok: false, error: "Unknown intent." }, { status: 400 });
};

function productGidToNumericId(gid) {
  const m = typeof gid === "string" ? gid.match(/\/(\d+)$/) : null;
  return m ? m[1] : "";
}

function kindLabel(kind) {
  switch (kind) {
    case "needs_sync":
      return "Needs variant sync";
    case "ambiguous":
      return "Ambiguous lists";
    case "no_source":
      return "No product lists";
    default:
      return kind;
  }
}

function kindTone(kind) {
  switch (kind) {
    case "needs_sync":
      return "attention";
    case "ambiguous":
      return "warning";
    case "no_source":
      return "new";
    default:
      return "new";
  }
}

export default function SyncShapeStyle() {
  const { storeHandle, creationCollections } = useLoaderData();
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";

  const [rows, setRows] = useState([]);
  const [totalProducts, setTotalProducts] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [scopeCollectionId, setScopeCollectionId] = useState("all");

  const scopeOptions = useMemo(() => {
    return [
      { label: "All creation collections", value: "all" },
      ...creationCollections.map((c) => ({
        label: c.title,
        value: c.id,
      })),
    ];
  }, [creationCollections]);

  useEffect(() => {
    const data = fetcher.data;
    if (!data || data.phase !== "scan" || !data.ok) return;
    const list = data.rows ?? [];
    setRows(list);
    setTotalProducts(data.totalProducts ?? null);
    const syncable = list
      .filter((r) => r.kind === "needs_sync")
      .map((r) => r.productId);
    setSelected(new Set(syncable));
  }, [fetcher.data]);

  useEffect(() => {
    const data = fetcher.data;
    if (!data || data.phase !== "sync" || !data.ok) return;
    setRows([]);
    setTotalProducts(null);
    setSelected(new Set());
  }, [fetcher.data]);

  const adminProductUrl = useCallback(
    (productGid) => {
      const id = productGidToNumericId(productGid);
      if (!storeHandle || !id) return null;
      return `https://admin.shopify.com/store/${storeHandle}/products/${id}`;
    },
    [storeHandle]
  );

  const syncableIds = useMemo(
    () => rows.filter((r) => r.kind === "needs_sync").map((r) => r.productId),
    [rows]
  );

  const toggleOne = useCallback((productId, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const selectAllSyncable = useCallback(() => {
    setSelected(new Set(syncableIds));
  }, [syncableIds]);

  const selectNone = useCallback(() => {
    setSelected(new Set());
  }, []);

  const runScan = () => {
    const fd = new FormData();
    fd.set("intent", "scan");
    fd.set("scopeCollectionId", scopeCollectionId);
    fetcher.submit(fd, { method: "post" });
  };

  const runSync = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const fd = new FormData();
    fd.set("intent", "sync");
    fd.set("productIds", JSON.stringify(ids));
    fetcher.submit(fd, { method: "post" });
  };

  const scanError =
    fetcher.data?.phase === "scan" && !fetcher.data?.ok
      ? fetcher.data?.error
      : null;
  const syncError =
    fetcher.data?.phase === "sync" && !fetcher.data?.ok
      ? fetcher.data?.error
      : null;
  const syncOk =
    fetcher.data?.phase === "sync" && fetcher.data?.ok ? fetcher.data : null;

  return (
    <Page>
      <TitleBar title="Sync variant shape/style" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Product lists → variant metafields
              </Text>
              <Text as="p" variant="bodyMd">
                Reads{" "}
                <Text as="span" fontWeight="semibold">
                  custom.shape
                </Text>{" "}
                and{" "}
                <Text as="span" fontWeight="semibold">
                  custom.style
                </Text>{" "}
                (list metaobject references) on each product. When each list has at most one GID,
                writes matching{" "}
                <Text as="span" fontWeight="semibold">
                  custom.single_shape
                </Text>{" "}
                /{" "}
                <Text as="span" fontWeight="semibold">
                  custom.single_style
                </Text>{" "}
                on every variant that differs. Products with more than one entry in either list are
                skipped. Scope matches{" "}
                <Text as="span" fontWeight="semibold">
                  Sync base SKUs
                </Text>{" "}
                (creation collections only).
              </Text>
              <Select
                label="Collection scope"
                options={scopeOptions}
                value={scopeCollectionId}
                onChange={setScopeCollectionId}
                disabled={busy}
              />
              <InlineStack gap="300" blockAlign="center">
                <Button onClick={runScan} loading={busy} disabled={busy}>
                  Scan products
                </Button>
                <Button
                  variant="primary"
                  onClick={runSync}
                  loading={busy}
                  disabled={busy || selected.size === 0}
                >
                  Apply sync to selected
                </Button>
                <Text as="span" variant="bodySm" tone="subdued">
                  {totalProducts != null
                    ? `Last scan: ${totalProducts} unique product(s) in scope.`
                    : "Run a scan to load results."}
                </Text>
              </InlineStack>
              {scanError && (
                <Banner tone="critical" title="Scan failed">
                  {scanError}
                </Banner>
              )}
              {syncError && (
                <Banner tone="critical" title="Sync failed">
                  {syncError}
                </Banner>
              )}
              {syncOk && (
                <Banner tone="success" title="Sync completed">
                  Updated {syncOk.updated?.length ?? 0} product(s).
                  {(syncOk.skipped?.length ?? 0) > 0 && (
                    <Text as="p" variant="bodySm">
                      {`Skipped ${syncOk.skipped.length} (ambiguous, no source, or already aligned).`}
                    </Text>
                  )}
                  {(syncOk.errors?.length ?? 0) > 0 && (
                    <Text as="p" variant="bodySm">
                      {syncOk.errors.join(" ")}
                    </Text>
                  )}
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {rows.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingMd">
                    Results ({rows.length})
                  </Text>
                  <InlineStack gap="200">
                    <Button size="slim" onClick={selectAllSyncable}>
                      Select all syncable
                    </Button>
                    <Button size="slim" onClick={selectNone}>
                      Clear selection
                    </Button>
                  </InlineStack>
                </InlineStack>
                <Divider />
                <Box overflowX="auto">
                  <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px" }}>
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            Sync
                          </Text>
                        </th>
                        <th style={{ textAlign: "left", padding: "8px" }}>
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            Product
                          </Text>
                        </th>
                        <th style={{ textAlign: "left", padding: "8px" }}>
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            Status
                          </Text>
                        </th>
                        <th style={{ textAlign: "left", padding: "8px" }}>
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            Notes
                          </Text>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const canSync = row.kind === "needs_sync";
                        const href = adminProductUrl(row.productId);
                        return (
                          <tr key={row.productId}>
                            <td style={{ padding: "8px", verticalAlign: "top" }}>
                              <Checkbox
                                label="Sync"
                                labelHidden
                                checked={selected.has(row.productId)}
                                disabled={!canSync || busy}
                                onChange={(checked) =>
                                  toggleOne(row.productId, checked)
                                }
                              />
                            </td>
                            <td style={{ padding: "8px", verticalAlign: "top" }}>
                              <BlockStack gap="100">
                                {href ? (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {row.title || "(Untitled)"}
                                  </a>
                                ) : (
                                  <Text as="span">{row.title || "(Untitled)"}</Text>
                                )}
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {row.handle}
                                </Text>
                              </BlockStack>
                            </td>
                            <td style={{ padding: "8px", verticalAlign: "top" }}>
                              <Badge tone={kindTone(row.kind)}>
                                {kindLabel(row.kind)}
                              </Badge>
                              {row.shapeCount != null && (
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {`Shape list: ${row.shapeCount} · Style list: ${row.styleCount}`}
                                </Text>
                              )}
                              {row.variantsToTouch != null && (
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {`${row.variantsToTouch} variant metafield write(s)`}
                                </Text>
                              )}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                verticalAlign: "top",
                                fontSize: "13px",
                                maxWidth: "420px",
                              }}
                            >
                              {row.detail ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Box>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
