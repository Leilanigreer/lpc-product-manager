// app/routes/api.testgoogleauth.js
import { json } from "@remix-run/node";
import { google } from 'googleapis';

export async function loader() {
  try {
    console.log('Testing Google Auth in Remix context');
    
    // Log env vars (redacted for security)
    console.log('GOOGLE_CLIENT_EMAIL is set:', !!process.env.GOOGLE_CLIENT_EMAIL);
    console.log('GOOGLE_PRIVATE_KEY is set:', !!process.env.GOOGLE_PRIVATE_KEY);
    console.log('GOOGLE_PRIVATE_KEY length:', process.env.GOOGLE_PRIVATE_KEY?.length || 0);
    
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    
    // Try to get a client
    const authClient = await auth.getClient();
    
    // Try to get a token
    const token = await authClient.getAccessToken();
    
    return json({ 
      success: true, 
      message: "Google authentication successful!",
      tokenStart: token.token?.substring(0, 5) + '...'
    });
  } catch (error) {
    console.error('Google Auth Test Error:', error);
    
    return json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}