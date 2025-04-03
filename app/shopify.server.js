import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  hooks: {
    afterAuth: async (session) => {
      console.log("Auth completed for shop:", session.shop);
      console.log("Session details:", {
        accessToken: session.accessToken ? 'Present' : 'Missing',
        isOnline: session.isOnline,
      });
    },
    beforeAuth: async (request) => {
      console.log("Starting auth for request:", request.url);
      console.log("Request details:", {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        shop: request.url.searchParams?.get('shop')
      });
    },
    afterAuthFailed: async (error) => {
      console.error("Auth failed:", error);
    }
  },
  isEmbeddedApp: true,
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

const customAddDocumentResponseHeaders = (request, headers) => {
  console.log('Adding headers for request:', request.url);
  console.log('Initial headers:', Object.fromEntries(headers.entries()));

  try {
    // Apply Shopify's default headers
    shopify.addDocumentResponseHeaders(request, headers);
    
    // Add CSP headers for embedded app
    headers.set(
      "Content-Security-Policy",
      "frame-ancestors https://*.myshopify.com https://admin.shopify.com;"
    );
    
    // Add sandbox permissions for embedded app
    headers.set(
      "X-Frame-Options",
      "ALLOW-FROM https://*.myshopify.com https://admin.shopify.com"
    );
  } catch (error) {
    console.error('Error adding headers:', error);
  }

  console.log('Final headers:', Object.fromEntries(headers.entries()));
  return headers;
};

export default shopify;
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = customAddDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;