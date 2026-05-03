import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  generateProductDescriptionViaClaude,
  summarizeExamplesMetaForLog,
} from "../lib/server/anthropicProductDescription.server.js";

/** Authenticated POST — Claude vision description (create-product only calls when examples metafield is non-null). */
export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await authenticate.admin(request);
  } catch {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, examples, imageBase64, mediaType } = body ?? {};

  if (examples == null) {
    return json(
      { error: "examples is required and must not be null for this endpoint." },
      { status: 400 }
    );
  }

  if (typeof imageBase64 !== "string" || !imageBase64.trim()) {
    return json({ error: "imageBase64 is required." }, { status: 400 });
  }

  if (mediaType !== "image/jpeg" && mediaType !== "image/png") {
    return json({ error: "mediaType must be image/jpeg or image/png." }, { status: 400 });
  }

  const trimmedB64 = typeof imageBase64 === "string" ? imageBase64.trim() : "";
  console.info(
    `[generate-product-description] payloadType ${JSON.stringify({
      kind: "remix.action.body",
      route: "app.api.generate-product-description",
      title: {
        type: typeof title,
        length: typeof title === "string" ? title.length : null,
      },
      examples: summarizeExamplesMetaForLog(examples),
      imageBase64: {
        charLength: trimmedB64.length,
        approxDecodedBytes: trimmedB64.length
          ? Math.ceil((trimmedB64.length * 3) / 4)
          : 0,
      },
      mediaType,
    })}`
  );

  try {
    const description = await generateProductDescriptionViaClaude({
      title,
      examples,
      imageBase64,
      mediaType,
    });
    return json({ description });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const upstream =
      err && typeof err === "object" && typeof err.status === "number" ? err.status : null;

    let status = 502;
    if (message.includes("ANTHROPIC_API_KEY")) {
      status = 503;
    } else if (upstream === 429) {
      status = 429;
    } else if (upstream != null && upstream >= 400 && upstream < 500) {
      status = 400;
    }

    return json({ error: message }, { status });
  }
}

export default function GenerateProductDescriptionApi() {
  return null;
}
