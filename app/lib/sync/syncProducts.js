import { saveProductToDatabase } from '../server/productOperations.server.js';

/**
 * Syncs products from Shopify to your local Postgres DB.
 * @param {Object} params
 * @param {Object} params.admin - Shopify Admin API client (authenticated)
 * @param {Object} params.options - Optional sync options (e.g., limit, dryRun)
 * @returns {Promise<Object>} Sync summary/results
 */
export async function syncShopifyToDb({ admin, options = {} }) {
  // Fetch products from Shopify (filtered by vendor and category)
  const response = await admin.graphql(`
    query {
      products(
        first: 250,
        query: "vendor:'Little Prince Customs' category:'gid://shopify/TaxonomyCategory/sg-4-7-7-2'"
      ) {
        edges {
          node {
            id
            title
            handle
            variants(first: 100) {
              edges {
                node {
                  id
                  sku
                  title
                  weight
                }
              }
            }
            // Add more fields as needed
          }
        }
      }
    }
  `);
  const json = await response.json();
  const products = json.data.products.edges.map(e => e.node);

  let syncedCount = 0;
  let errors = [];

  for (const product of products) {
    // --- Derive baseSKU from first variant ---
    const baseSKU = product.variants.edges[0]?.node.sku || 'MISSING_BASE_SKU';

    // --- Use defaults for fields needing manual update ---
    const fontId = options.defaultFontId || 'REPLACE_WITH_DEFAULT_FONT_ID'; // TODO: Update manually later
    const leatherColor1Id = options.defaultLeatherColor1Id || 'REPLACE_WITH_DEFAULT_LEATHER_COLOR_ID'; // TODO: Update manually later
    const shapeId = options.defaultShapeId || 'REPLACE_WITH_DEFAULT_SHAPE_ID'; // TODO: Update manually later

    // --- Map variants ---
    const variants = product.variants.edges.map(({ node }) => ({
      sku: node.sku,
      weight: node.weight || 1, // If null, sub 1
      shapeValue: shapeId, // Default for now
      // Add more mappings as needed
    }));

    // --- Prepare productData for DB ---
    const productData = {
      title: product.title,
      mainHandle: product.handle,
      baseSKU,
      selectedFont: fontId,
      selectedLeatherColor1: leatherColor1Id,
      variants,
      // Add more fields as needed, using defaults where necessary
    };

    // --- Save to DB ---
    try {
      // Note: shopifyResponse is not available here, so you may need to adapt saveProductToDatabase
      // For now, just log what would be saved
      await saveProductToDatabase(productData, null, null); // shopifyResponse and cloudinaryFolderId are not available in this context
      syncedCount++;
    } catch (err) {
      errors.push({ product: product.title, error: err.message });
    }
  }

  return {
    channel: 'shopify',
    synced: syncedCount,
    errors,
    message: `Sync complete. ${syncedCount} products synced. ${errors.length} errors.`
  };
}

/**
 * Syncs products from your DB to Shopify.
 * (Stub for future use)
 */
export async function syncDbToShopify({ admin, options = {} }) {
  // TODO: implement
  return { channel: 'shopify', message: 'Not implemented yet' };
}

// Add similar stubs for Etsy, eBay, Amazon as you build them 