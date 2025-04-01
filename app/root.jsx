import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  json,
} from "@remix-run/react";

export const loader = async ({ request }) => {
  const env = {
    CLOUDINARY_CLOUD_NAME: process.env.SHOPIFY_CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.SHOPIFY_CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.SHOPIFY_CLOUDINARY_API_SECRET,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    HAS_GOOGLE_CREDENTIALS: !!process.env.GOOGLE_PRIVATE_KEY,
  };

  return json({
    env,
  });
};

export default function App() {
  const data = useLoaderData();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.env)}`,
          }}
        />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }) {
  console.error(error);
  return (
    <html>
      <head>
        <title>Error!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <Scripts />
      </body>
    </html>
  );
}