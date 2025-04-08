import { json } from "@remix-run/node";

export async function loader({ request }) {
  try {
    console.log("Starting Google Drive diagnostic...");
    
    // Check environment variables
    const envVars = {
      GOOGLE_CLIENT_EMAIL: {
        exists: !!process.env.GOOGLE_CLIENT_EMAIL,
        length: process.env.GOOGLE_CLIENT_EMAIL ? process.env.GOOGLE_CLIENT_EMAIL.length : 0,
        format: process.env.GOOGLE_CLIENT_EMAIL ? 
          (process.env.GOOGLE_CLIENT_EMAIL.includes('@') ? 'Valid email format' : 'Invalid email format') : 
          'Not available'
      },
      GOOGLE_PRIVATE_KEY: {
        exists: !!process.env.GOOGLE_PRIVATE_KEY,
        length: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0,
        containsBeginMarker: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.includes('-----BEGIN') : false,
        containsEndMarker: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.includes('-----END') : false,
        containsNewlines: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.includes('\n') : false,
        containsEscapedNewlines: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.includes('\\n') : false,
        firstChars: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.substring(0, 20) + '...' : 'Not available',
        lastChars: process.env.GOOGLE_PRIVATE_KEY ? '...' + process.env.GOOGLE_PRIVATE_KEY.substring(process.env.GOOGLE_PRIVATE_KEY.length - 20) : 'Not available'
      },
      GOOGLE_PROJECT_ID: {
        exists: !!process.env.GOOGLE_PROJECT_ID,
        length: process.env.GOOGLE_PROJECT_ID ? process.env.GOOGLE_PROJECT_ID.length : 0
      },
      GOOGLE_DRIVE_ROOT_FOLDER_ID: {
        exists: !!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
        length: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ? process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID.length : 0
      }
    };
    
    // Try to process the private key
    let processedKeyInfo = null;
    if (process.env.GOOGLE_PRIVATE_KEY) {
      try {
        // Import the processPrivateKey function
        const { processPrivateKey } = await import('../lib/server/googleDrive.js');
        const processedKey = processPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
        
        processedKeyInfo = {
          success: true,
          containsBeginMarker: processedKey ? processedKey.includes('-----BEGIN') : false,
          containsEndMarker: processedKey ? processedKey.includes('-----END') : false,
          containsNewlines: processedKey ? processedKey.includes('\n') : false,
          firstChars: processedKey ? processedKey.substring(0, 20) + '...' : 'Not available',
          lastChars: processedKey ? '...' + processedKey.substring(processedKey.length - 20) : 'Not available'
        };
      } catch (error) {
        processedKeyInfo = {
          success: false,
          error: error.message
        };
      }
    }
    
    return json({
      success: true,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      envVars,
      processedKeyInfo
    });
  } catch (error) {
    console.error("Google Drive diagnostic error:", error);
    return json({ 
      success: false, 
      error: error.message || "Diagnostic failed"
    }, { status: 500 });
  }
} 