// app/app.jsx
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { useEffect, useState } from 'react';

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({ 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: new URL(request.url).searchParams.get("host")
  });
};

export default function App() {
  const { apiKey, host } = useLoaderData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const errorMessage = args[0]?.toString() || '';
      
      const suppressPatterns = [
        'Extra attributes from the server',
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'Hydration failed because',
        'There was an error while hydrating',
        'The server could not finish this Suspense boundary'
      ];

      if (suppressPatterns.some(pattern => errorMessage.includes(pattern))) {
        return;
      }

      originalError.call(console, ...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!isClient) {
    return (
      <AppProvider isEmbeddedApp apiKey={apiKey}>
        <PolarisProvider i18n={en}>
          <div className="loading-state">Loading...</div>
        </PolarisProvider>
      </AppProvider>
    );
  }

  return (
    <AppProvider 
      isEmbeddedApp 
      apiKey={apiKey}
      host={host}
      forceRedirect
    >
      <PolarisProvider i18n={en}>
        <div suppressHydrationWarning>
          <NavMenu>
            <Link to="/app" rel="home">
              Home
            </Link>
            <Link to="/app/createProducts">Create a new product</Link>
          </NavMenu>
          <Outlet />
        </div>
      </PolarisProvider>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);
  
  return boundary.error(error);
}

export const headers = (headersArgs) => {
  const securityHeaders = {
    'Content-Security-Policy': 
      "frame-ancestors https://*.myshopify.com https://admin.shopify.com;",
    'X-Frame-Options': 'ALLOW-FROM https://*.myshopify.com',
  };
  
  return {
    ...boundary.headers(headersArgs),
    ...securityHeaders,
  };
};