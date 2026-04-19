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
} from "@shopify/polaris";
import {
  scanBaseSkuDrift,
  syncBaseSkuMetafields,
} from "../lib/server/skuSyncShopify.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop ?? "";
  const storeHandle = shop.replace(/\.myshopify\.com$/i, "");
  return json({ shop, storeHandle });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "scan") {
    try {
      const { discrepancies, totalProducts } = await scanBaseSkuDrift(
        (query, options) => admin.graphql(query, options)
      );
      return json({
        ok: true,
        phase: "scan",
        discrepancies,
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
      const result = await syncBaseSkuMetafields(
        (query, options) => admin.graphql(query, options),
        productIds
      );
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
    case "missing":
      return "Missing metafield";
    case "mismatch":
      return "Mismatch";
    case "no_variant_sku":
      return "No variant SKU";
    case "cannot_derive_base":
      return "Cannot derive base";
    default:
      return kind;
  }
}

function kindTone(kind) {
  switch (kind) {
    case "missing":
      return "attention";
    case "mismatch":
      return "warning";
    case "no_variant_sku":
      return "critical";
    case "cannot_derive_base":
      return "critical";
    default:
      return "new";
  }
}

export default function SyncSkus() {
  const { storeHandle } = useLoaderData();
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";

  const [rows, setRows] = useState([]);
  const [totalProducts, setTotalProducts] = useState(null);
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    const data = fetcher.data;
    if (!data || data.phase !== "scan" || !data.ok) return;
    const disc = data.discrepancies ?? [];
    setRows(disc);
    setTotalProducts(data.totalProducts ?? null);
    const syncable = disc
      .filter(
        (r) =>
          r.kind !== "no_variant_sku" &&
          r.kind !== "cannot_derive_base" &&
          r.derivedBaseSku
      )
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
    () =>
      rows
        .filter(
          (r) =>
            r.kind !== "no_variant_sku" &&
            r.kind !== "cannot_derive_base" &&
            r.derivedBaseSku
        )
        .map((r) => r.productId),
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
      <TitleBar title="Sync base SKU metafields" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                custom.base_sku vs derived base (variant SKU minus shape)
              </Text>
              <Text as="p" variant="bodyMd">
                Only products with vendor{" "}
                <Text as="span" fontWeight="semibold">
                  Little Prince Customs
                </Text>{" "}
                are scanned. The target base is the first variant’s SKU
                (by position) with the last{" "}
                <Text as="span" fontWeight="semibold">
                  -
                </Text>{" "}
                segment removed (shape suffix), e.g.{" "}
                <Text as="span" fontWeight="semibold">
                  Classic-BRG-HP-V2-Driver
                </Text>{" "}
                →{" "}
                <Text as="span" fontWeight="semibold">
                  Classic-BRG-HP-V2
                </Text>
                . Rows list a missing{" "}
                <Text as="span" fontWeight="semibold">
                  custom.base_sku
                </Text>
                , a mismatch, no variant SKU, or a SKU we cannot derive a base
                from. Apply sync writes the derived base into{" "}
                <Text as="span" fontWeight="semibold">
                  custom.base_sku
                </Text>
                .
              </Text>
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
                    ? `Last scan: ${totalProducts} product(s) scanned.`
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
                      {`Skipped ${syncOk.skipped.length} (no SKU or cannot derive base).`}
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
                    Review ({rows.length})
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
                            Issue
                          </Text>
                        </th>
                        <th style={{ textAlign: "left", padding: "8px" }}>
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            custom.base_sku
                          </Text>
                        </th>
                        <th style={{ textAlign: "left", padding: "8px" }}>
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            Derived base (sync target)
                          </Text>
                        </th>
                        <th style={{ textAlign: "left", padding: "8px" }}>
                          <Text as="span" variant="bodySm" fontWeight="semibold">
                            First variant SKU (raw)
                          </Text>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const canSync =
                          row.kind !== "no_variant_sku" &&
                          row.kind !== "cannot_derive_base" &&
                          row.derivedBaseSku;
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
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                verticalAlign: "top",
                                fontFamily: "monospace",
                                fontSize: "12px",
                              }}
                            >
                              {row.currentMetafield ?? "—"}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                verticalAlign: "top",
                                fontFamily: "monospace",
                                fontSize: "12px",
                              }}
                            >
                              {row.derivedBaseSku ?? "—"}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                verticalAlign: "top",
                                fontFamily: "monospace",
                                fontSize: "12px",
                              }}
                            >
                              {row.firstVariantSkuRaw ?? "—"}
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
