// app/lib/server/productDrafts.server.js

import prisma from "../../db.server";
import {
  buildDraftLabel,
  serializeFormStateForDraft,
} from "../utils/draftFormState";

/**
 * @param {string} shop
 * @returns {Promise<{ id: string, label: string, updatedAt: string }[]>}
 */
export async function listProductCreationDrafts(shop) {
  if (!shop) return [];

  const rows = await prisma.productCreationDraft.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      label: true,
      updatedAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/**
 * @param {string} shop
 * @param {string} id
 */
export async function loadProductCreationDraft(shop, id) {
  if (!shop || !id) return null;

  return prisma.productCreationDraft.findFirst({
    where: { id, shop },
  });
}

/**
 * @param {string} shop
 * @param {string} id
 */
export async function deleteProductCreationDraft(shop, id) {
  if (!shop || !id) {
    return { count: 0 };
  }

  return prisma.productCreationDraft.deleteMany({
    where: { id, shop },
  });
}

/**
 * @param {string} shop
 * @param {{
 *   draftId?: string | null,
 *   formState: object,
 *   aiDescription?: string,
 *   googleDriveFolderUrl?: string | null,
 *   groupImageDriveFileId?: string | null,
 * }} payload
 */
export async function saveProductCreationDraft(shop, payload) {
  if (!shop) {
    throw new Error("Shop is required to save a draft.");
  }

  const formState = payload?.formState;
  const collectionValue = formState?.collection?.value;
  if (!collectionValue || !String(collectionValue).trim()) {
    throw new Error("Select a collection before saving a draft.");
  }

  const serialized = serializeFormStateForDraft(formState);
  const label = buildDraftLabel(serialized);
  const aiDescription = String(payload?.aiDescription ?? "");
  const googleDriveFolderUrl =
    typeof payload?.googleDriveFolderUrl === "string" &&
    payload.googleDriveFolderUrl.trim()
      ? payload.googleDriveFolderUrl.trim()
      : null;
  const groupImageDriveFileId =
    typeof payload?.groupImageDriveFileId === "string" &&
    payload.groupImageDriveFileId.trim()
      ? payload.groupImageDriveFileId.trim()
      : null;

  const draftId = payload?.draftId ? String(payload.draftId).trim() : "";

  if (draftId) {
    const existing = await prisma.productCreationDraft.findFirst({
      where: { id: draftId, shop },
    });
    if (!existing) {
      throw new Error("Draft not found.");
    }

    const updated = await prisma.productCreationDraft.update({
      where: { id: draftId },
      data: {
        label,
        formState: serialized,
        aiDescription,
        googleDriveFolderUrl,
        groupImageDriveFileId,
      },
    });

    return {
      draftId: updated.id,
      label: updated.label,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  const created = await prisma.productCreationDraft.create({
    data: {
      shop,
      label,
      formState: serialized,
      aiDescription,
      googleDriveFolderUrl,
      groupImageDriveFileId,
    },
  });

  return {
    draftId: created.id,
    label: created.label,
    updatedAt: created.updatedAt.toISOString(),
  };
}
