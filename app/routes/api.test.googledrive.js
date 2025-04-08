import { json } from "@remix-run/node";
import { testGoogleDriveAuth } from "../lib/server/googleDrive";

export async function loader({ request }) {
  try {
    const authResult = await testGoogleDriveAuth();
    return json(authResult);
  } catch (error) {
    console.error("Google Drive authentication test error:", error);
    return json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 