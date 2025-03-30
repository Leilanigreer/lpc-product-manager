// debug-remix-env.js
import * as fs from 'fs';
import * as path from 'path';

// Try to read .env.development.local directly
try {
  const envPath = path.resolve(process.cwd(), '.env.development.local');
  console.log('Trying to read env file at:', envPath);
  
  if (fs.existsSync(envPath)) {
    const contents = fs.readFileSync(envPath, 'utf8');
    console.log('File exists, contents length:', contents.length);
    
    // Simple parsing of key=value pairs
    const envVars = {};
    contents.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim();
          envVars[key] = value;
        }
      }
    });
    
    console.log('Parsed environment variables:');
    console.log('- GOOGLE_CLIENT_EMAIL:', envVars.GOOGLE_CLIENT_EMAIL ? 'set' : 'not set');
    console.log('- GOOGLE_PRIVATE_KEY:', envVars.GOOGLE_PRIVATE_KEY ? 'set' : 'not set');
    console.log('- GOOGLE_PROJECT_ID:', envVars.GOOGLE_PROJECT_ID ? 'set' : 'not set');
    console.log('- GOOGLE_DRIVE_ROOT_FOLDER_ID:', envVars.GOOGLE_DRIVE_ROOT_FOLDER_ID ? 'set' : 'not set');
  } else {
    console.log('Environment file not found');
  }
} catch (error) {
  console.error('Error reading environment file:', error);
}

// Also check process.env directly
console.log('\nChecking process.env directly:');
console.log('- GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'set' : 'not set');
console.log('- GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'set' : 'not set');
console.log('- GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? 'set' : 'not set');
console.log('- GOOGLE_DRIVE_ROOT_FOLDER_ID:', process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ? 'set' : 'not set');