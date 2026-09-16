import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
} from "@remix-run/react";

export const loader = async ({ request }) => {
  return json({});
};

export default function App() {
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
        <title>Something went wrong</title>
        <Meta />
        <Links />
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f6f6f7;
          }
          .error-container {
            text-align: center;
            padding: 2rem;
            max-width: 500px;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #202223;
            margin-bottom: 1rem;
          }
          p {
            color: #6d7175;
            line-height: 1.5;
            margin-bottom: 1.5rem;
          }
          a {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #008060;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
          }
          a:hover {
            background: #006e52;
          }
        `}</style>
      </head>
      <body>
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>
            We're sorry, but something unexpected happened. Please try refreshing the page or access the app through your Shopify admin.
          </p>
          <a href="/auth/login">Return to Login</a>
        </div>
        <Scripts />
      </body>
    </html>
  );
}