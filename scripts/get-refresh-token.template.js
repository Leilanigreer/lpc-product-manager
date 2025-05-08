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

// Create OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

// ... rest of the implementation ... 