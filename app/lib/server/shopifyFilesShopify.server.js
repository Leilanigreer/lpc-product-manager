// app/lib/server/shopifyFilesShopify.server.js
/**
 * Two-step Shopify Files upload helper.
 *
 * 1. `stagedUploadsCreate` returns a signed POST target (S3-style multipart form).
 * 2. We POST the file's bytes to that target, embedding the returned `parameters`
 *    as form fields and ending with the `file` part. Shopify ignores the field
 *    ordering but requires the `file` field key, so it goes last.
 * 3. `fileCreate` registers the staged asset as a Shopify File and returns its
 *    `MediaImage` GID — which is exactly what a metaobject `file_reference`
 *    field stores.
 *
 * The `MediaImage` returned by `fileCreate` has `fileStatus: UPLOADED` initially
 * and asynchronously transitions to `READY`. For our metaobject create flow this
 * is fine: the GID is valid the moment `fileCreate` returns, and Shopify will
 * resolve it once processing completes. Callers that need the rendered image URL
 * should poll `file(id:)` afterward.
 */

const STAGED_UPLOADS_CREATE = `#graphql
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FILE_CREATE = `#graphql
  mutation FileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        fileStatus
        alt
        ... on MediaImage {
          id
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Upload an image `File` to Shopify Files and return its `MediaImage` GID.
 *
 * @param {Object} admin - Shopify Admin GraphQL client from `authenticate.admin(request)`.
 * @param {File} file - Browser/Remix `File` object (from `request.formData()`).
 * @param {Object} [opts]
 * @param {string} [opts.alt] - Optional alt text stored on the MediaImage.
 * @returns {Promise<{ id: string }>} The MediaImage GID, e.g. `gid://shopify/MediaImage/...`.
 */
export async function uploadShopifyImageFile(admin, file, { alt } = {}) {
  if (!admin?.graphql) {
    throw new Error("Shopify admin client is required to upload files.");
  }
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("A valid File is required to upload to Shopify Files.");
  }

  const filename = file.name && String(file.name).trim() ? String(file.name).trim() : "upload";
  const mimeType =
    file.type && String(file.type).trim() ? String(file.type).trim() : "image/jpeg";
  const fileSize = typeof file.size === "number" ? String(file.size) : null;

  const stagedInput = {
    filename,
    mimeType,
    resource: "IMAGE",
    httpMethod: "POST",
    ...(fileSize ? { fileSize } : {}),
  };

  const stagedResp = await admin.graphql(STAGED_UPLOADS_CREATE, {
    variables: { input: [stagedInput] },
  });
  const stagedJson = await stagedResp.json();
  const stagedResult = stagedJson?.data?.stagedUploadsCreate;

  if (stagedResult?.userErrors?.length) {
    const message = stagedResult.userErrors.map((e) => e.message).join(", ");
    throw new Error(`stagedUploadsCreate failed: ${message}`);
  }

  const target = stagedResult?.stagedTargets?.[0];
  if (!target?.url || !target?.resourceUrl) {
    throw new Error("stagedUploadsCreate returned no upload target.");
  }

  /** Build multipart form per Shopify staged-upload spec: every parameter, then the file last. */
  const form = new FormData();
  for (const param of target.parameters ?? []) {
    if (param?.name == null) continue;
    form.append(param.name, param.value ?? "");
  }
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: mimeType });
  form.append("file", blob, filename);

  const uploadResp = await fetch(target.url, { method: "POST", body: form });
  if (!uploadResp.ok) {
    const body = await uploadResp.text().catch(() => "");
    throw new Error(
      `Staged upload failed (${uploadResp.status} ${uploadResp.statusText}): ${body.slice(0, 200)}`
    );
  }

  const fileCreateResp = await admin.graphql(FILE_CREATE, {
    variables: {
      files: [
        {
          contentType: "IMAGE",
          originalSource: target.resourceUrl,
          ...(alt ? { alt: String(alt).slice(0, 512) } : {}),
        },
      ],
    },
  });
  const fileCreateJson = await fileCreateResp.json();
  const fileCreateResult = fileCreateJson?.data?.fileCreate;

  if (fileCreateResult?.userErrors?.length) {
    const message = fileCreateResult.userErrors.map((e) => e.message).join(", ");
    throw new Error(`fileCreate failed: ${message}`);
  }

  const created = fileCreateResult?.files?.[0];
  if (!created?.id) {
    throw new Error("fileCreate did not return a file id.");
  }
  return { id: created.id };
}
