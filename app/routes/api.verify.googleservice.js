import { json } from "@remix-run/node";
import { google } from 'googleapis/build/src/index.js';

export async function loader({ request }) {
  try {
    console.log("Starting Google Service Account verification...");
    
    // Check environment variables
    const envVars = {
      GOOGLE_CLIENT_EMAIL: {
        exists: !!process.env.GOOGLE_CLIENT_EMAIL,
        value: process.env.GOOGLE_CLIENT_EMAIL
      },
      GOOGLE_PRIVATE_KEY: {
        exists: !!process.env.GOOGLE_PRIVATE_KEY,
        length: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0
      },
      GOOGLE_PROJECT_ID: {
        exists: !!process.env.GOOGLE_PROJECT_ID,
        value: process.env.GOOGLE_PROJECT_ID
      }
    };
    
    // Process the private key
    let processedKey = null;
    if (process.env.GOOGLE_PRIVATE_KEY) {
      // Remove any surrounding quotes if they exist
      processedKey = process.env.GOOGLE_PRIVATE_KEY.trim();
      if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
        processedKey = processedKey.slice(1, -1);
      }
      
      // Replace escaped newlines with actual newlines
      processedKey = processedKey.replace(/\\n/g, '\n');
    }
    
    // Create a new auth client for this verification
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: processedKey,
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    
    // Try to get the access token
    let tokenInfo = null;
    try {
      const client = await auth.getClient();
      tokenInfo = {
        success: true,
        token_type: client.credentials.token_type,
        expiry_date: new Date(client.credentials.expiry_date).toISOString()
      };
    } catch (tokenError) {
      tokenInfo = {
        success: false,
        error: tokenError.message
      };
    }
    
    // Try to get the project information
    let projectInfo = null;
    if (tokenInfo.success) {
      try {
        const cloudresourcemanager = google.cloudresourcemanager('v1');
        const project = await cloudresourcemanager.projects.get({
          auth,
          name: `projects/${process.env.GOOGLE_PROJECT_ID}`
        });
        
        projectInfo = {
          success: true,
          project_number: project.data.projectNumber,
          project_id: project.data.projectId,
          name: project.data.name
        };
      } catch (projectError) {
        projectInfo = {
          success: false,
          error: projectError.message
        };
      }
    }
    
    return json({
      success: true,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      envVars,
      tokenInfo,
      projectInfo
    });
  } catch (error) {
    console.error("Google Service Account verification error:", error);
    return json({ 
      success: false, 
      error: error.message || "Verification failed"
    }, { status: 500 });
  }
} 