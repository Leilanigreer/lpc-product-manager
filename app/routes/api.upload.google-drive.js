import { json } from "@remix-run/node";
import { uploadToGoogleDrive } from "../lib/server/googleDrive";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { file, folderName } = await request.json();
    const result = await uploadToGoogleDrive(file, folderName);
    return json(result);
  } catch (error) {
    console.error("Google Drive upload error:", error);
    return json({ error: error.message }, { status: 500 });
  }
} 