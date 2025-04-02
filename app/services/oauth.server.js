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
      console.log(`No OAuth token found for provider: ${provider}`);
      return null;
    }

    // Check if token is expired
    if (token.expiresAt && token.expiresAt < new Date()) {
      console.log(`Token for provider ${provider} is expired, refreshing...`);
      
      // Set credentials with refresh token
      oauth2Client.setCredentials({
        refresh_token: token.refreshToken,
      });

      // Refresh the token
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update the token in the database
      const updatedToken = await prisma.oAuthToken.update({
        where: { provider },
        data: {
          accessToken: credentials.access_token,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        },
      });

      console.log(`Successfully refreshed token for provider ${provider}`);
      return updatedToken;
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
    if (!tokens.refresh_token) {
      console.warn('No refresh token provided in updateOAuthToken');
      return;
    }

    const expiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + (tokens.expires_in * 1000));

    console.log(`Updating OAuth token for provider ${provider}:`, {
      hasRefreshToken: !!tokens.refresh_token,
      hasAccessToken: !!tokens.access_token,
      expiresAt
    });

    await prisma.oAuthToken.upsert({
      where: { provider },
      update: {
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresAt,
      },
      create: {
        provider,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresAt,
      },
    });

    console.log(`Successfully updated OAuth token for provider ${provider}`);
  } catch (error) {
    console.error(`Error updating OAuth token for provider ${provider}:`, error);
    throw error;
  }
} 