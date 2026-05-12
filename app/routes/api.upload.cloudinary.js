import { json } from "@remix-run/node";
import { CLOUDINARY_DISABLED, uploadToCloudinary } from "../lib/utils/cloudinary.js";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  if (CLOUDINARY_DISABLED) {
    return json({ error: "Cloudinary is disabled." }, { status: 503 });
  }

  try {
    const { file, folderName } = await request.json();
    const result = await uploadToCloudinary(file, folderName);
    return json(result);
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return json({ error: error.message }, { status: 500 });
  }
} 