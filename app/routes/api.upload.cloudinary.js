import { json } from "@remix-run/node";
import { uploadToCloudinary } from "../lib/utils/cloudinary";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
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