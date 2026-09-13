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
  Tabs,
  Select,
  TextField,
  DataTable,
} from "@shopify/polaris";
import { comparePostgresShopifyThreadNumbers } from "../lib/server/postgresShopifyThreadCompare.server.js";

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

  if (intent !== "compare") {
    return json({ ok: false, error: "Unknown intent." }, { status: 400 });
  }

  try {
    const result = await comparePostgresShopifyThreadNumbers(admin);
    return json({ ok: true, ...result });
  } catch (e) {
    return json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
};

function productGidToNumericId(gid) {
  const m = typeof gid === "string" ? gid.match(/\/(\d+)$/) : null;
  return m ? m[1] : "";
}

function statusLabel(status) {
  if (status === "match") return "Match";
  if (status === "mismatch") return "Mismatch";
  if (status === "missing") return "Missing on Shopify";
  return status;
}

function statusTone(status) {
  if (status === "match") return "success";
  if (status === "mismatch") return "attention";
  if (status === "missing") return "warning";
  return "new";
}

function formatNumbers(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return "—";
  return numbers.join(", ");
}

const FILTER_OPTIONS = [
  { label: "Problems only (mismatch + missing)", value: "problems" },
  { label: "All", value: "all" },
  { label: "Mismatch", value: "mismatch" },
  { label: "Missing on Shopify", value: "missing" },
];

export default function CompareThreadNumbers() {
  const { storeHandle } = useLoaderData();
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";

  const [result, setResult] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filter, setFilter] = useState("problems");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const data = fetcher.data;
    if (!data?.ok) return;
    setResult(data);
  }, [fetcher.data]);

  const runCompare = () => {
    const fd = new FormData();
    fd.set("intent", "compare");
    fetcher.submit(fd, { method: "post" });
  };

  const adminProductUrl = useCallback(
    (productGid) => {
      const id = productGidToNumericId(productGid);
      if (!storeHandle || !id) return null;
      return `https://admin.shopify.com/store/${storeHandle}/products/${id}`;
    },
    [storeHandle]
  );

  const compareError =
    fetcher.data && fetcher.data.ok === false ? fetcher.data.error : null;

  const amannCounts = result?.amann?.counts;
  const isacordCounts = result?.isacord?.counts;

  const tabs = [
    {
      id: "amann",
      content: amannCounts
        ? `Amann (${amannCounts.match}/${amannCounts.total})`
        : "Amann",
      panelID: "amann-panel",
    },
    {
      id: "isacord",
      content: isacordCounts
        ? `Isacord (${isacordCounts.match}/${isacordCounts.total})`
        : "Isacord",
      panelID: "isacord-panel",
    },
  ];

  const activeDataset = selectedTab === 1 ? result?.isacord : result?.amann;
  const activeCounts = activeDataset?.counts;

  const filteredRows = useMemo(() => {
    const rows = activeDataset?.rows ?? [];
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "problems" && row.status === "match") return false;
      if (filter === "mismatch" && row.status !== "mismatch") return false;
      if (filter === "missing" && row.status !== "missing") return false;
      if (!needle) return true;
      const haystack = [
        row.sku,
        row.productTitle,
        row.productHandle,
        ...(row.postgresNumbers || []),
        ...(row.shopifyNumbers || []),
        ...(row.missingNumbers || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [activeDataset, filter, query]);

  const tableRows = useMemo(
    () =>
      filteredRows.map((row) => {
        const href = adminProductUrl(row.productId);
        const extraCount = Math.max((row.products?.length || 0) - 1, 0);
        const productCell = row.productId ? (
          <BlockStack gap="100" key={`${row.sku}-product`}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {row.productTitle || "(Untitled)"}
              </a>
            ) : (
              <Text as="span">{row.productTitle || "(Untitled)"}</Text>
            )}
            <Text as="p" variant="bodySm" tone="subdued">
              {row.productHandle || ""}
              {extraCount > 0 ? ` · +${extraCount} more product(s)` : ""}
            </Text>
          </BlockStack>
        ) : (
          "—"
        );

        return [
          row.sku,
          <Badge tone={statusTone(row.status)} key={`${row.sku}-status`}>
            {statusLabel(row.status)}
          </Badge>,
          formatNumbers(row.postgresNumbers),
          formatNumbers(row.shopifyNumbers),
          formatNumbers(row.missingNumbers),
          productCell,
        ];
      }),
    [adminProductUrl, filteredRows]
  );

  const bothMatched =
    amannCounts &&
    isacordCounts &&
    amannCounts.total > 0 &&
    amannCounts.match === amannCounts.total &&
    isacordCounts.match === isacordCounts.total;

  return (
    <Page>
      <TitleBar title="Compare Postgres vs Shopify thread numbers" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Archive Amann / Isacord vs Shopify
              </Text>
              <Text as="p" variant="bodyMd">
                Checks leftover Postgres product-archive SKUs against Shopify{" "}
                <Text as="span" fontWeight="semibold">
                  custom.old_skus
                </Text>
                . A SKU matches when every Postgres number is present on the
                Shopify product. Extra Shopify numbers are expected and do not
                fail a row. Shopify products with no Postgres SKU are ignored.
              </Text>
              <Banner tone="info" title="How this compare works">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm">
                    Isacord SKUs drop one trailing hyphen segment before matching
                    (`foo-BLK-DR` → `foo-BLK`).
                  </Text>
                  <Text as="p" variant="bodySm">
                    `custom.old_skus` holds previous bases; thread metafields are
                    the current Shopify values.
                  </Text>
                  <Text as="p" variant="bodySm">
                    This page only reads archive tables so they can be dropped
                    after every Postgres number is present on Shopify.
                  </Text>
                </BlockStack>
              </Banner>
              <InlineStack gap="300" blockAlign="center">
                <Button variant="primary" onClick={runCompare} loading={busy} disabled={busy}>
                  Compare
                </Button>
                <Text as="span" variant="bodySm" tone="subdued">
                  {result
                    ? `Last scan: ${result.shopifyProductCount ?? 0} active Shopify product(s), ${result.shopifyProductsWithOldSkus ?? 0} with old_skus.`
                    : "Run a compare to load results."}
                </Text>
              </InlineStack>
              {compareError && (
                <Banner tone="critical" title="Compare failed">
                  {compareError}
                </Banner>
              )}
              {result && amannCounts && isacordCounts && (
                <Banner
                  tone={bothMatched ? "success" : "warning"}
                  title="Drop-tables readiness"
                >
                  {`Amann: ${amannCounts.match} of ${amannCounts.total} Postgres SKUs matched. Isacord: ${isacordCounts.match} of ${isacordCounts.total} Postgres SKUs matched.`}
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {result && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Tabs
                  tabs={tabs}
                  selected={selectedTab}
                  onSelect={setSelectedTab}
                />
                {activeCounts && (
                  <InlineStack gap="200" wrap>
                    <Badge tone="success">{`Match ${activeCounts.match}`}</Badge>
                    <Badge tone="attention">{`Mismatch ${activeCounts.mismatch}`}</Badge>
                    <Badge tone="warning">{`Missing ${activeCounts.missing}`}</Badge>
                  </InlineStack>
                )}
                <InlineStack gap="300" blockAlign="end" wrap>
                  <Box minWidth="220px">
                    <Select
                      label="Filter"
                      options={FILTER_OPTIONS}
                      value={filter}
                      onChange={setFilter}
                    />
                  </Box>
                  <Box minWidth="240px">
                    <TextField
                      label="Search"
                      value={query}
                      onChange={setQuery}
                      autoComplete="off"
                      placeholder="SKU, product, or number"
                      clearButton
                      onClearButtonClick={() => setQuery("")}
                    />
                  </Box>
                </InlineStack>
                {tableRows.length === 0 ? (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No rows for this filter.
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <DataTable
                      columnContentTypes={[
                        "text",
                        "text",
                        "text",
                        "text",
                        "text",
                        "text",
                      ]}
                      headings={[
                        "SKU",
                        "Status",
                        "Postgres numbers",
                        "Shopify numbers",
                        "Missing from Shopify",
                        "Shopify product",
                      ]}
                      rows={tableRows}
                      footerContent={`${filteredRows.length} of ${activeCounts?.total ?? 0} Postgres SKUs`}
                    />
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
