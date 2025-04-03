import prisma from '../db.server.js';
import { OAuth2Client } from 'google-auth-library';

// Initialize the OAuth2 client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

/**
 * Get or create OAuth token for a provider
 * @param {string} provider - The OAuth provider (e.g., 'google')
 * @returns {Promise<Object>} The OAuth token record
 */
export async function getOAuthToken(provider) {
  try {
    const token = await prisma.oAuthToken.findUnique({
      where: { provider },
    });

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`No OAuth token found for provider: ${provider}`);
      }
      return null;
    }

    // Check if token is expired
    if (token.expiresAt && token.expiresAt < new Date()) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Token for provider ${provider} is expired, refreshing...`);
      }
      
      // Set credentials with refresh token
      oauth2Client.setCredentials({
        refresh_token: token.refreshToken,
        access_token: token.accessToken,
        expiry_date: token.expiresAt.getTime()
      });

      // Force token refresh
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Successfully refreshed token for provider ${provider}`);
      }

      // Update token in database
      await updateOAuthToken(provider, {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || token.refreshToken,
        expiresAt: new Date(credentials.expiry_date)
      });

      return {
        ...token,
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || token.refreshToken,
        expiresAt: new Date(credentials.expiry_date)
      };
    }

    return token;
  } catch (error) {
    console.error(`Error getting OAuth token for provider ${provider}:`, error);
    throw error;
  }
}

/**
 * Update OAuth token
 * @param {string} provider - The OAuth provider
 * @param {Object} tokens - The new tokens
 * @returns {Promise<Object>} The updated OAuth token record
 */
export async function updateOAuthToken(provider, tokens) {
  try {
    if (!tokens.refreshToken) {
      console.warn('No refresh token provided in updateOAuthToken');
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Updating OAuth token for provider ${provider}:`, {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        expiresAt: tokens.expiresAt
      });
    }

    const updatedToken = await prisma.oAuthToken.upsert({
      where: { provider },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      },
      create: {
        provider,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`Successfully updated OAuth token for provider ${provider}`);
    }

    return updatedToken;
  } catch (error) {
    console.error(`Error updating OAuth token for provider ${provider}:`, error);
    throw error;
  }
} 