import { json } from "@remix-run/node";
import { google } from 'googleapis/build/src/index.js';

export async function loader({ request }) {
  try {
    // Check environment variables
    const envVars = {
      GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
      GOOGLE_DRIVE_ROOT_FOLDER_ID: !!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    };
    
    // Check private key format
    let privateKeyFormat = "unknown";
    if (process.env.GOOGLE_PRIVATE_KEY) {
      const key = process.env.GOOGLE_PRIVATE_KEY;
      if (key.includes('-----BEGIN PRIVATE KEY-----')) {
        privateKeyFormat = "proper format";
      } else if (key.includes('\\n')) {
        privateKeyFormat = "escaped newlines";
      } else if (key.includes('\n')) {
        privateKeyFormat = "actual newlines";
      } else {
        privateKeyFormat = "no newlines";
      }
    }
    
    // Try to create auth client
    let authClientCreated = false;
    let authError = null;
    
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          project_id: process.env.GOOGLE_PROJECT_ID,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      
      // Try to get credentials
      await auth.getClient();
      authClientCreated = true;
    } catch (error) {
      authError = error.message;
    }
    
    return json({
      environment: process.env.NODE_ENV,
      envVars,
      privateKeyFormat,
      authClientCreated,
      authError,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 