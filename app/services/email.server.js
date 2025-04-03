import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getOAuthToken, updateOAuthToken } from './oauth.server.js';

// Initialize the Gmail API client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

let gmail = null;

// Initialize credentials from database
async function initializeOAuthClient() {
  try {
    const token = await getOAuthToken('google');
    if (!token) {
      throw new Error('No OAuth token found in database');
    }

    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: token.refreshToken,
      access_token: token.accessToken,
      expiry_date: token.expiresAt.getTime()
    });

    // Create Gmail API instance
    gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Listen for token refresh events
    oauth2Client.on('tokens', async (tokens) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Token refresh event received:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiryDate: tokens.expiry_date
        });
      }

      // Update token in database
      await updateOAuthToken('google', {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || token.refreshToken,
        expiresAt: new Date(tokens.expiry_date)
      });
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Gmail API initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing OAuth client:', error);
    throw error;
  }
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments,
}) {
  try {
    // Ensure Gmail API is initialized
    if (!gmail) {
      await initializeOAuthClient();
    }

    // Create email in base64 format
    const emailLines = [
      `To: ${to}`,
      'From: Leilani@lpcgolf.com',
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/mixed; boundary="boundary"',
      '',
      '--boundary',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      text,
    ];

    if (html) {
      emailLines.push(
        '--boundary',
        'Content-Type: text/html; charset="UTF-8"',
        '',
        html
      );
    }

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        emailLines.push(
          '--boundary',
          `Content-Type: ${attachment.contentType}`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          'Content-Transfer-Encoding: base64',
          '',
          attachment.content
        );
      }
    }

    emailLines.push('--boundary--');

    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    console.log('Sending email:', {
      to,
      subject,
      hasHtml: !!html,
      attachmentCount: attachments?.length || 0
    });

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log('Email sent successfully:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Convenience functions for specific email types
export async function sendInternalEmail(subject, text, html) {
  return sendEmail({
    to: 'Leilani@lpcgolf.com',
    subject,
    text,
    html,
  });
}

export async function sendExternalEmail(
  to,
  subject,
  text,
  attachments
) {
  return sendEmail({
    to,
    subject,
    text,
    attachments,
  });
} 