import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import url from 'url';
import destroyer from 'server-destroy';
import dotenv from 'dotenv';
import path from 'path';
import prisma from '../app/db.server.js';

// Load environment variables from .env.development.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') });

// Verify required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Replace these with your OAuth 2.0 credentials
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3001/oauth2callback'
);

// Generate the url that will be used for the consent dialog.
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.send']
});

// Create an HTTP server to accept the oauth callback.
const server = http
  .createServer(async (req, res) => {
    try {
      if (req.url.indexOf('/oauth2callback') > -1) {
        // Acquire the code from the redirected request
        const code = url.parse(req.url, true).query.code;

        if (!code) {
          console.error('No code received in callback');
          res.end('No code received in callback');
          return;
        }

        // Get and store tokens using the code
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        if (!tokens.refresh_token) {
          console.error('No refresh token received. This usually means the user has already authorized the app.');
          res.end('No refresh token received. Please try again.');
          return;
        }

        // Store tokens in database
        try {
          await prisma.oAuthToken.upsert({
            where: { provider: 'google' },
            update: {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
            },
            create: {
              provider: 'google',
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
            }
          });
        } catch (dbError) {
          console.error('Error storing tokens in database:', dbError);
          res.end('Error storing tokens in database');
          return;
        }

        res.end('Success! You can close this window.');
      }
    } catch (e) {
      console.error('Error in OAuth callback:', e);
      res.end('Error in OAuth callback');
    }
  })
  .listen(3001, () => {
    console.log('Please visit this URL to authorize the application:');
    console.log(authorizeUrl);
  });

destroyer(server); 