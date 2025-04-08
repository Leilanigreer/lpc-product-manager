import { json } from "@remix-run/node";
import { testGoogleDriveAuth } from "../lib/server/googleDrive";

export async function loader({ request }) {
  try {
    console.log("Starting Google Drive authentication test...");
    
    // Check for required environment variables
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Missing GOOGLE_PRIVATE_KEY environment variable");
      return json({ 
        success: false, 
        error: "Missing GOOGLE_PRIVATE_KEY environment variable" 
      }, { status: 500 });
    }
    
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      console.error("Missing GOOGLE_CLIENT_EMAIL environment variable");
      return json({ 
        success: false, 
        error: "Missing GOOGLE_CLIENT_EMAIL environment variable" 
      }, { status: 500 });
    }
    
    if (!process.env.GOOGLE_PROJECT_ID) {
      console.error("Missing GOOGLE_PROJECT_ID environment variable");
      return json({ 
        success: false, 
        error: "Missing GOOGLE_PROJECT_ID environment variable" 
      }, { status: 500 });
    }
    
    // Test authentication
    const authResult = await testGoogleDriveAuth();
    console.log("Authentication test result:", authResult.success ? "Success" : "Failed");
    
    return json(authResult);
  } catch (error) {
    console.error("Google Drive authentication test error:", error);
    console.error("Error stack:", error.stack);
    
    return json({ 
      success: false, 
      error: error.message || "Authentication test failed",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 