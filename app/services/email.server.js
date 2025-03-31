import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize the Gmail API client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments,
}) {
  try {
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
          attachment.content.toString('base64')
        );
      }
    }

    emailLines.push('--boundary--');

    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

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