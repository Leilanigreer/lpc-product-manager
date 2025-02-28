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
  return { 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: new URL(request.url).searchParams.get("host")
  };
};

export default function App() {
  const { apiKey, host } = useLoaderData();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Ensure app-bridge is initialized after hydration
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const content = (
    <PolarisProvider i18n={en}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/createProducts">Create a new product</Link>
        <Link to="/app/updatePricing">Update Pricing</Link>
        <Link to="/app/websiteCustomOptions">Website Product Option Sets</Link>
      </NavMenu>
      <Outlet />
    </PolarisProvider>
  );

  // Only render app-bridge content after initial load
  return (
    <AppProvider 
      isEmbeddedApp 
      apiKey={apiKey}
      host={host}
      forceRedirect
    >
      {isLoaded ? content : <div style={{ opacity: 0 }}>{content}</div>}
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