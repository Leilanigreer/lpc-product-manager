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
      try {
        console.log("Auth completed for shop:", session.shop);
        console.log("Session details:", {
          accessToken: session.accessToken ? 'Present' : 'Missing',
          isOnline: session.isOnline,
        });
      } catch (error) {
        console.error("Error in afterAuth:", error);
      }
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
  if (!headers || typeof headers.set !== 'function') {
    console.error('Invalid headers object received');
    return new Headers();
  }

  try {
    // Add security headers directly instead of relying on shopify.addDocumentResponseHeaders
    headers.set('Content-Security-Policy',
      "frame-ancestors https://*.myshopify.com https://admin.shopify.com;");
    headers.set('X-Frame-Options', 'ALLOW-FROM https://*.myshopify.com');

    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // Add security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-XSS-Protection', '1; mode=block');

    // Log headers for debugging
    console.log('Headers after customization:', Object.fromEntries(headers.entries()));

    return headers;
  } catch (error) {
    console.error('Error in customAddDocumentResponseHeaders:', error);
    return headers;
  }
};

export default shopify;
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = customAddDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;