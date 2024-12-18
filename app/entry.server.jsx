import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { isbot } from "isbot";
import { addDocumentResponseHeaders } from "./shopify.server";

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
) {
  // Ensure we have valid headers object
  if (!responseHeaders) {
    responseHeaders = new Headers();
  }

  try {
    console.log('Server Request:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Add headers with error handling
    try {
      responseHeaders = addDocumentResponseHeaders(request, responseHeaders) || responseHeaders;
    } catch (headerError) {
      console.error('Error adding document headers:', headerError);
    }

    const userAgent = request.headers.get("user-agent");
    const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";

    return new Promise((resolve, reject) => {
      let didError = false;

      const { pipe, abort } = renderToPipeableStream(
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />,
        {
          [callbackName]: () => {
            const body = new PassThrough();
            const stream = createReadableStreamFromReadable(body);

            // Ensure Content-Type is set
            if (!responseHeaders.has("Content-Type")) {
              responseHeaders.set("Content-Type", "text/html");
            }

            resolve(
              new Response(stream, {
                headers: responseHeaders,
                status: didError ? 500 : responseStatusCode,
              }),
            );
            pipe(body);
          },
          onShellError(error) {
            console.error('Shell Error:', error);
            didError = true;
            reject(error);
          },
          onError(error) {
            didError = true;
            console.error('Streaming Error:', error);
            responseStatusCode = 500;
          },
        },
      );

      setTimeout(() => {
        abort();
        if (!didError) {
          console.error('Request timed out');
        }
      }, ABORT_DELAY);
    });
  } catch (error) {
    console.error('Top-level server error:', {
      message: error.message,
      stack: error.stack
    });
    return new Response('Internal Server Error', { 
      status: 500,
      headers: responseHeaders
    });
  }
}