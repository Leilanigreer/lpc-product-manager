import prisma from '../app/db.server.js';
import dotenv from 'dotenv';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';

// Load environment variables from .env.development.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') });

async function setupOAuthToken() {
  try {
    const callbackUrl = process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!callbackUrl) {
      console.error('No GOOGLE_REFRESH_TOKEN found in environment variables');
      process.exit(1);
    }

    // Extract the authorization code from the callback URL
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');

    if (!code) {
      console.error('No code found in callback URL');
      process.exit(1);
    }

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: 'http://localhost:3001/oauth2callback'
    });

    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      console.error('No refresh token received from Google');
      process.exit(1);
    }

    // Create or update the OAuth token
    const token = await prisma.oAuthToken.upsert({
      where: { provider: 'google' },
      update: {
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      },
      create: {
        provider: 'google',
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });

    console.log('Successfully set up OAuth token:', {
      id: token.id,
      provider: token.provider,
      hasRefreshToken: !!token.refreshToken,
      hasAccessToken: !!token.accessToken,
      expiresAt: token.expiresAt
    });

    process.exit(0);
  } catch (error) {
    console.error('Error setting up OAuth token:', error);
    process.exit(1);
  }
}

setupOAuthToken(); 