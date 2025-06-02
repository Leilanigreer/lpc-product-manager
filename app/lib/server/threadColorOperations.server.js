import prisma from "../../db.server.js";
import { Prisma } from "@prisma/client";

/**
 * Creates a new Embroidery Thread Color and associates it with ColorTags.
 * @param {Object} data - Thread color data (name, abbreviation, isacordNumber, etc.)
 * @param {string[]} colorTagIds - Array of ColorTag IDs to associate
 * @returns {Promise<Object>} The created Embroidery Thread Color with tags
 */
export async function createEmbroideryThreadColorWithTags(data, colorTagIds) {
  console.log('[threadColorOperations] ENTER createEmbroideryThreadColorWithTags');
  console.log('[threadColorOperations] Received data:', data);
  console.log('[threadColorOperations] Received colorTagIds:', colorTagIds);
  try {
    // Check if the Isacord number is already linked
    if (data.isacordNumber) {
      const isacord = await prisma.isacordNumber.findUnique({
        where: { id: data.isacordNumber }
      });
      if (!isacord) {
        throw new Error('Isacord number not found.');
      }
      if (isacord.threadId) {
        throw new Error('Isacord number already linked to another thread.');
      }
    }
    // Use findUnique if name is unique, otherwise use findFirst
    let existingThread;
    try {
      existingThread = await prisma.embroideryThread.findUnique({
        where: { name: data.name }
      });
    } catch (e) {
      // fallback for dev environments where migration/client may be out of sync
      existingThread = await prisma.embroideryThread.findFirst({
        where: { name: data.name }
      });
    }

    if (existingThread) {
      // Only update: add the new Isacord number and any new tags
      await prisma.embroideryThread.update({
        where: { id: existingThread.id },
        data: {
          isacordNumbers: {
            connect: [{ id: data.isacordNumber }]
          },
          colorTags: {
            connect: colorTagIds.map(id => ({ id }))
          }
        }
      });
      return await prisma.embroideryThread.findUnique({
        where: { id: existingThread.id },
        include: { colorTags: true, isacordNumbers: true }
      });
    } else {
      // Create new
      const thread = await prisma.embroideryThread.create({
        data: {
          name: data.name,
          abbreviation: data.abbreviation,
          colorTags: {
            connect: colorTagIds.map(id => ({ id }))
          },
          isacordNumbers: data.isacordNumber ? {
            connect: [{ id: data.isacordNumber }]
          } : undefined
        },
        include: {
          colorTags: true,
          isacordNumbers: true
        }
      });
      return thread;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      if (error.meta && error.meta.target) {
        if (error.meta.target.includes('abbreviation')) {
          throw new Error('Embroidery thread abbreviation already exists.');
        }
      }
      throw new Error('Unique constraint violation.');
    }
    console.error('[threadColorOperations] Error creating/linking EmbroideryThread:', error);
    throw error;
  }
}

/**
 * Creates a new Stitching Thread Color and associates it with ColorTags.
 * @param {Object} data - Thread color data (name, abbreviation, amannNumber, etc.)
 * @param {string[]} colorTagIds - Array of ColorTag IDs to associate
 * @returns {Promise<Object>} The created Stitching Thread Color with tags
 */
export async function createStitchingThreadColorWithTags(data, colorTagIds) {
  console.log('[threadColorOperations] createStitchingThreadColorWithTags called with:', { data, colorTagIds });
  try {
    // Check for name uniqueness
    const existing = await prisma.stitchingThreadColor.findUnique({
      where: { name: data.name }
    });
    if (existing) {
      throw new Error('Stitching thread color name already exists.');
    }
    // Check for amann number uniqueness
    if (data.amannNumber) {
      const amannExists = await prisma.stitchingThreadColor.findFirst({
        where: { amannNumber: data.amannNumber }
      });
      if (amannExists) {
        throw new Error('Amann number already linked to another thread color.');
      }
    }
    const threadColor = await prisma.stitchingThreadColor.create({
      data: {
        ...data,
        colorTags: {
          connect: colorTagIds.map(id => ({ id }))
        }
      },
      include: {
        colorTags: true
      }
    });
    console.log('[threadColorOperations] Created stitchingThreadColor:', threadColor);
    return threadColor;
  } catch (error) {
    console.error("Error creating StitchingThreadColor:", error);
    throw error;
  }
}

/**
 * Links an Amann number to an existing Stitching Thread Color.
 * @param {string} threadColorId - The ID of the existing stitching thread color
 * @param {string} amannNumber - The Amann number to link
 * @returns {Promise<Object>} The updated Stitching Thread Color
 */
export async function linkAmannNumberToStitchingThreadColor(threadColorId, amannNumber) {
  console.log('[threadColorOperations] linkAmannNumberToStitchingThreadColor called with:', { threadColorId, amannNumber });
  try {
    // Check for amann number uniqueness
    const amannExists = await prisma.stitchingThreadColor.findFirst({
      where: { amannNumber }
    });
    if (amannExists) {
      throw new Error('Amann number already linked to another thread color.');
    }
    const updated = await prisma.stitchingThreadColor.update({
      where: { id: threadColorId },
      data: { amannNumber },
      include: { colorTags: true }
    });
    console.log('[threadColorOperations] Updated stitchingThreadColor:', updated);
    return updated;
  } catch (error) {
    console.error("Error linking Amann number:", error);
    throw error;
  }
}

/**
 * Links an Isacord number to an existing Embroidery Thread.
 * @param {string} threadId - The ID of the existing embroidery thread
 * @param {string} isacordNumberId - The Isacord number ID to link
 * @returns {Promise<Object>} The updated Embroidery Thread
 */
export async function linkIsacordNumberToEmbroideryThread(threadId, isacordNumberId) {
  console.log('[threadColorOperations] linkIsacordNumberToEmbroideryThread called with:', { threadId, isacordNumberId });
  try {
    // Check for isacord number uniqueness
    const isacord = await prisma.isacordNumber.findUnique({
      where: { id: isacordNumberId }
    });
    if (!isacord) {
      throw new Error('Isacord number not found.');
    }
    if (isacord.threadId) {
      throw new Error('Isacord number already linked to another thread.');
    }
    const updated = await prisma.embroideryThread.update({
      where: { id: threadId },
      data: {
        isacordNumbers: {
          connect: [{ id: isacordNumberId }]
        }
      },
      include: { colorTags: true, isacordNumbers: true }
    });
    console.log('[threadColorOperations] Updated embroideryThread:', updated);
    return updated;
  } catch (error) {
    console.error('[threadColorOperations] Error linking Isacord number:', error);
    throw error;
  }
} 