import {
  json,
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
} from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { putObject } from "../lib/server/r2.js";
import { buildR2ObjectKey, fileExtensionFromName } from "../lib/utils/r2Paths.js";
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

  try {
    const uploadHandler = unstable_createMemoryUploadHandler({
      maxPartSize: 40_000_000,
    });
    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const file = formData.get("file");
    const keyInput = String(formData.get("key") || "").trim();
    const collection = formData.get("collection");
    const folder = formData.get("folder");
    const sku = formData.get("sku");
    const label = formData.get("label");
    const originalsFolderName = String(formData.get("originalsFolderName") || "").trim();

    if (!file) {
      return json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name || "image.jpg";
    const contentType = file.type || "application/octet-stream";
    const key =
      keyInput.replace(/^\/+/, "") ||
      buildR2ObjectKey({
        collection,
        folder,
        sku,
        label,
        originalsFolderName,
        ext: fileExtensionFromName(fileName, contentType),
      });

    if (!key || key === "products//-.") {
      return json(
        { error: "Provide key, or collection, folder, sku, and label." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await putObject({
      key,
      body: buffer,
      contentType,
    });
    return json({ key: result.key, url: result.publicUrl });
  } catch (error) {
    return json(
      { error: formatUnknownApiError(error) || "R2 upload failed." },
      { status: 500 }
    );
  }
}
