import { json } from "@remix-run/node";
import { testGoogleDriveAuth } from "../lib/server/googleDrive";

export async function loader({ request }) {
  try {
    console.log("Starting Google Drive authentication test...");
    const authResult = await testGoogleDriveAuth();
    return json(authResult);
  } catch (error) {
    console.error("Google Drive authentication test error:", error);
    return json({ 
      success: false, 
      error: error.message || "Authentication test failed"
    }, { status: 500 });
  }
} 