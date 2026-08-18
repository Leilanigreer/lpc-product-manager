import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { presignPutObject } from "../lib/server/r2.js";
import { formatUnknownApiError } from "../lib/utils/formatApiError.js";

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

  const {
    key,
    collection,
    folder,
    sku,
    label,
    originalsFolderName,
    fileName,
    contentType,
  } = body ?? {};

  if (!key && !(collection && folder && sku && label)) {
    return json(
      { error: "Provide key, or collection, folder, sku, and label." },
      { status: 400 }
    );
  }

  try {
    const result = await presignPutObject({
      key,
      collection,
      folder,
      sku,
      label,
      originalsFolderName,
      fileName,
      contentType,
    });
    return json(result);
  } catch (error) {
    return json(
      { error: formatUnknownApiError(error) || "Failed to presign R2 upload." },
      { status: 500 }
    );
  }
}
