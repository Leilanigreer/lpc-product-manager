import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildR2ObjectKey,
  buildR2Prefix,
  fileExtensionFromName,
  joinPublicUrl,
} from "../utils/r2Paths.js";

function trimEnv(value) {
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export function readR2Env() {
  return {
    accountId: trimEnv(process.env.R2_ACCOUNT_ID),
    accessKeyId: trimEnv(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: trimEnv(process.env.R2_SECRET_ACCESS_KEY),
    bucket: trimEnv(process.env.R2_BUCKET_NAME),
    publicBaseUrl: trimEnv(process.env.R2_PUBLIC_BASE_URL).replace(/\/+$/, ""),
  };
}

export function isR2Configured() {
  const env = readR2Env();
  return Boolean(
    env.accountId &&
      env.accessKeyId &&
      env.secretAccessKey &&
      env.bucket &&
      env.publicBaseUrl
  );
}

export function assertR2Configured() {
  const env = readR2Env();
  const missing = Object.entries({
    R2_ACCOUNT_ID: env.accountId,
    R2_ACCESS_KEY_ID: env.accessKeyId,
    R2_SECRET_ACCESS_KEY: env.secretAccessKey,
    R2_BUCKET_NAME: env.bucket,
    R2_PUBLIC_BASE_URL: env.publicBaseUrl,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing R2 configuration: ${missing.join(", ")}`);
  }
  return env;
}

let cachedClient = null;
let cachedClientKey = "";

export function getR2Client() {
  const env = assertR2Configured();
  const cacheKey = `${env.accountId}:${env.accessKeyId}:${env.bucket}`;
  if (cachedClient && cachedClientKey === cacheKey) {
    return { client: cachedClient, env };
  }
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
  cachedClientKey = cacheKey;
  return { client: cachedClient, env };
}

export function publicUrlForKey(key) {
  const { publicBaseUrl } = assertR2Configured();
  return joinPublicUrl(publicBaseUrl, key);
}

export function publicPrefixUrl({ collection, folder }) {
  const { publicBaseUrl } = assertR2Configured();
  return joinPublicUrl(publicBaseUrl, buildR2Prefix({ collection, folder }));
}

/**
 * True when at least one object exists under `products/{collection}/{folder}/`.
 * R2 has no empty folders — a prefix exists only after the first PUT.
 */
export async function resolveExistingProductR2Prefix({ collection, folder }) {
  const prefix = buildR2Prefix({ collection, folder });
  if (!prefix || prefix === "products/" || prefix === "products//") {
    return { exists: false, prefix: "", prefixUrl: "" };
  }
  if (!isR2Configured()) {
    return { exists: false, prefix, prefixUrl: "" };
  }

  const { client, env } = getR2Client();
  const listPrefix = `${prefix.replace(/\/+$/, "")}/`;
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: env.bucket,
      Prefix: listPrefix,
      MaxKeys: 1,
    })
  );
  const exists =
    (response.KeyCount ?? 0) > 0 || (response.Contents?.length ?? 0) > 0;
  if (!exists) {
    return { exists: false, prefix, prefixUrl: "" };
  }
  return {
    exists: true,
    prefix,
    prefixUrl: joinPublicUrl(env.publicBaseUrl, prefix),
  };
}

/**
 * Cloudflare dashboard URL that lists objects under a prefix (browsable folder).
 * Public r2.dev prefix URLs do not list files.
 */
export function buildR2DashboardFolderUrl(prefix) {
  const env = readR2Env();
  const objectPrefix = String(prefix || "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  if (!env.accountId || !env.bucket || !objectPrefix) return "";
  const query = new URLSearchParams({ prefix: `${objectPrefix}/` });
  return `https://dash.cloudflare.com/${env.accountId}/r2/default/buckets/${env.bucket}?${query.toString()}`;
}

export async function presignPutObject({
  key,
  contentType,
  collection,
  folder,
  sku,
  label,
  originalsFolderName,
  fileName,
}) {
  const { client, env } = getR2Client();
  const resolvedKey =
    typeof key === "string" && key.trim()
      ? key.replace(/^\/+/, "")
      : buildR2ObjectKey({
          collection,
          folder,
          sku,
          label,
          originalsFolderName,
          ext: fileExtensionFromName(fileName, contentType),
        });

  const command = new PutObjectCommand({
    Bucket: env.bucket,
    Key: resolvedKey,
    ContentType: contentType || "application/octet-stream",
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  return {
    uploadUrl,
    key: resolvedKey,
    publicUrl: publicUrlForKey(resolvedKey),
    contentType: contentType || "application/octet-stream",
  };
}

export async function getObjectBuffer(key) {
  const { client, env } = getR2Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: env.bucket,
      Key: key,
    })
  );
  const bytes = await response.Body?.transformToByteArray?.();
  if (!bytes) {
    throw new Error(`R2 object ${key} had no body.`);
  }
  return Buffer.from(bytes);
}

export async function putObject({ key, body, contentType }) {
  const { client, env } = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
    })
  );
  return { key, publicUrl: publicUrlForKey(key) };
}

/** Browser PUT to the S3 endpoint is cross-origin; allow the app hosts plus local/dev tunnels. */
export async function applyR2Cors() {
  const { client, env } = getR2Client();
  await client.send(
    new PutBucketCorsCommand({
      Bucket: env.bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [
              "http://localhost:3000",
              "http://127.0.0.1:3000",
              "https://lpc-product-management-staging.up.railway.app",
              "https://product-management-lpc-production.up.railway.app",
              "*",
            ],
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag", "Location"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    })
  );
}
