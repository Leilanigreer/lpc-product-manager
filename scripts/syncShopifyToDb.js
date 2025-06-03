// scripts/syncShopifyToDb.js
// Script to sync all Shopify products to the local Postgres DB
// Run manually: `node scripts/syncShopifyToDb.js`

import dotenv from 'dotenv';
import { createShopifyProduct } from '../app/lib/server/shopifyOperations.server.js';
import { saveProductToDatabase } from '../app/lib/server/productOperations.server.js';
import prisma from '../app/db.server.js';
// TODO: Replace with your actual Shopify admin API client import/initialization
import getShopifyAdmin from '../app/lib/shopifyAdmin.js'; // Placeholder, update as needed

dotenv.config();

// --- CONFIGURABLE DEFAULTS ---
const DEFAULT_FONT_ID = 'REPLACE_WITH_DEFAULT_FONT_ID';
const DEFAULT_LEATHER_COLOR_ID = 'REPLACE_WITH_DEFAULT_LEATHER_COLOR_ID';
const DEFAULT_SHAPE_ID = 'REPLACE_WITH_DEFAULT_SHAPE_ID';

async function fetchAllShopifyProducts(admin) {
  // Filter by vendor and category
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
  return json.data.products.edges.map(e => e.node);
}

async function main() {
  const admin = getShopifyAdmin(); // TODO: Implement this or import from your codebase
  const products = await fetchAllShopifyProducts(admin);

  for (const product of products) {
    // --- Derive baseSKU from first variant ---
    const baseSKU = product.variants.edges[0]?.node.sku || 'MISSING_BASE_SKU';

    // --- Use defaults for fields needing manual update ---
    const fontId = DEFAULT_FONT_ID; // TODO: Update manually later
    const leatherColor1Id = DEFAULT_LEATHER_COLOR_ID; // TODO: Update manually later
    const shapeId = DEFAULT_SHAPE_ID; // TODO: Update manually later

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
      console.log('Prepared productData for DB:', productData);
      // await saveProductToDatabase(productData, shopifyResponse, null);
    } catch (err) {
      console.error('Error saving product:', product.title, err);
    }

    // --- Log manual update needs ---
    console.log(`NOTE: Product "${product.title}" needs manual update for font, leatherColor1, and possibly shape.`);
  }
}

main().then(() => {
  console.log('Sync complete. Review logs for manual update notes.');
  process.exit(0);
}).catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
}); 