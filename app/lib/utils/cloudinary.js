// app/lib/utils/cloudinary.js
/**
 * Cloudinary integration — **disabled** (`CLOUDINARY_DISABLED = true`).
 * Implementation is kept in this file; set `CLOUDINARY_DISABLED` to `false`, configure
 * `SHOPIFY_CLOUDINARY_*` (and root `window.ENV` for client), then restore any commented call sites.
 */
export const CLOUDINARY_DISABLED = true;

import { Cloudinary } from "@cloudinary/url-gen";

function disabledError() {
  return new Error(
    "Cloudinary is disabled. Set CLOUDINARY_DISABLED = false in app/lib/utils/cloudinary.js to re-enable."
  );
}

// Helper function to get environment-specific variables
const getEnvironmentConfig = () => {
  if (typeof window !== "undefined" && window.ENV) {
    return {
      cloud_name: window.ENV.CLOUDINARY_CLOUD_NAME,
      api_key: window.ENV.CLOUDINARY_API_KEY,
      api_secret: window.ENV.CLOUDINARY_API_SECRET,
    };
  }

  if (typeof process !== "undefined" && process.env) {
    return {
      cloud_name: process.env.SHOPIFY_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.SHOPIFY_CLOUDINARY_API_KEY,
      api_secret: process.env.SHOPIFY_CLOUDINARY_API_SECRET,
    };
  }

  throw new Error("Cloudinary configuration is not available in this context");
};

let config = null;
let cld = null;

if (!CLOUDINARY_DISABLED) {
  config = getEnvironmentConfig();
  const missingConfig = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingConfig.length > 0) {
    console.error("Missing Cloudinary configuration:", missingConfig);
    throw new Error(
      `Missing required Cloudinary configuration: ${missingConfig.join(", ")}`
    );
  }

  cld = new Cloudinary({
    cloud: {
      cloudName: config.cloud_name,
    },
  });
}

// Helper function to get folder path from Cloudinary
export const getCloudinaryFolderPath = async (assetFolder) => {
  if (CLOUDINARY_DISABLED) {
    return null;
  }
  try {
    const authHeader =
      "Basic " +
      Buffer.from(`${config.api_key}:${config.api_secret}`).toString("base64");

    const url = `https://api.cloudinary.com/v1_1/${config.cloud_name}/folders/search?expression=path=${assetFolder}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const responseText = await response.text();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to parse response:", parseError);
        console.error("Response text:", responseText);
      }
      return null;
    }

    if (!response.ok) {
      if (process.env.NODE_ENV === "development") {
        console.error("Search failed:", {
          status: response.status,
          statusText: response.statusText,
          result,
        });
      }
      return null;
    }

    if (!result.folders || result.folders.length === 0) {
      return null;
    }

    return result.folders[0].external_id;
  } catch (error) {
    console.error("Error getting folder path:", error);
    console.error("Error stack:", error.stack);
    return null;
  }
};

export const uploadToCloudinary = async (
  file,
  customPublicId = null,
  collection = null,
  productPictureFolder = null
) => {
  if (CLOUDINARY_DISABLED) {
    throw disabledError();
  }
  if (!config.cloud_name) {
    throw new Error("Cloudinary is not properly configured");
  }

  try {
    const formData = new FormData();

    const fileToUpload = customPublicId
      ? new File(
          [file],
          `${customPublicId}.${file.name.split(".").pop()}`,
          { type: file.type }
        )
      : file;

    formData.append("file", fileToUpload);
    formData.append("upload_preset", "product-images");

    if (collection) {
      const assetFolder = productPictureFolder
        ? `products/${collection}/${productPictureFolder}`
        : `products/${collection}`;
      formData.append("asset_folder", assetFolder);
    }

    if (customPublicId) {
      let fullPublicId = customPublicId;
      if (!fullPublicId.startsWith("products/")) {
        fullPublicId = `products/${fullPublicId}`;
      }
      formData.append("public_id", fullPublicId);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud_name}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary upload failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(
        `Upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export const updateCloudinaryImage = async (publicId, newImage) => {
  if (CLOUDINARY_DISABLED) {
    throw disabledError();
  }
  try {
    const formData = new FormData();

    const fileToUpload = new File(
      [newImage],
      `${publicId}.${newImage.name.split(".").pop()}`,
      { type: newImage.type }
    );

    formData.append("file", fileToUpload);
    formData.append("upload_preset", "product-images");
    formData.append("public_id", publicId);
    formData.append("overwrite", "true");
    formData.append("invalidate", "true");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud_name}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary update failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(
        `Update failed: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Cloudinary update error:", error);
    throw error;
  }
};

export const uploadToCloudinaryWithSignature = async (
  file,
  publicId,
  collection = null,
  productPictureFolder = null
) => {
  if (CLOUDINARY_DISABLED) {
    throw disabledError();
  }
  if (!config.cloud_name) {
    throw new Error("Cloudinary is not properly configured");
  }

  try {
    const signatureResponse = await fetch("/api/cloudinary/signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicId,
        collection,
        productPictureFolder,
      }),
    });

    if (!signatureResponse.ok) {
      const error = await signatureResponse.json();
      throw new Error(
        `Failed to get signature: ${error.error || signatureResponse.statusText}`
      );
    }

    const signatureData = await signatureResponse.json();

    const formData = new FormData();
    formData.append("file", file);

    Object.entries(signatureData).forEach(([key, value]) => {
      if (key !== "signature" && value !== undefined) {
        formData.append(key, value);
      }
    });

    formData.append("signature", signatureData.signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary upload failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(
        `Upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Cloudinary signed upload error:", error);
    throw error;
  }
};

export { cld };
