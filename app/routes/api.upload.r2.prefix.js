import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { resolveExistingProductR2Prefix } from "../lib/server/r2.js";
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

  const collection = String(body?.collection || "").trim();
  const folder = String(body?.folder || "").trim();
  if (!collection || !folder) {
    return json(
      { error: "Provide collection and folder." },
      { status: 400 }
    );
  }

  try {
    const result = await resolveExistingProductR2Prefix({ collection, folder });
    return json(result);
  } catch (error) {
    return json(
      { error: formatUnknownApiError(error) || "Failed to look up R2 prefix." },
      { status: 500 }
    );
  }
}
