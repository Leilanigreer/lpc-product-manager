import prisma from "../../db.server.js";
import { Prisma } from "@prisma/client";

/**
 * Updates an existing Embroidery Thread Color's linked Isacord numbers and ColorTags.
 * @param {Object} params
 * @param {string} params.threadId - The ID of the embroidery thread to update
 * @param {string[]} params.addIsacordIds - Isacord number IDs to add
 * @param {string[]} params.removeIsacordIds - Isacord number IDs to remove
 * @param {string[]} params.addColorTagIds - ColorTag IDs to add
 * @param {string[]} params.removeColorTagIds - ColorTag IDs to remove
 * @returns {Promise<Object>} The updated Embroidery Thread Color with tags and isacord numbers
 */
export async function updateEmbroideryThreadColorWithTagsAndNumbers({
  threadId,
  addIsacordIds = [],
  removeIsacordIds = [],
  addColorTagIds = [],
  removeColorTagIds = [],
}) {
  try {
    // Update the thread color
    const updated = await prisma.embroideryThread.update({
      where: { id: threadId },
      data: {
        isacordNumbers: {
          connect: addIsacordIds.map(id => ({ id })),
          disconnect: removeIsacordIds.map(id => ({ id })),
        },
        colorTags: {
          connect: addColorTagIds.map(id => ({ id })),
          disconnect: removeColorTagIds.map(id => ({ id })),
        },
      },
      include: {
        colorTags: true,
        isacordNumbers: true,
      },
    });
    return updated;
  } catch (error) {
    console.error('[threadColorOperations] Error updating embroidery thread:', error);
    throw error;
  }
} 

/**
 * Creates a new Embroidery Thread Color and associates it with ColorTags.
 * @param {Object} data - Thread color data (name, abbreviation, isacordNumber, etc.)
 * @param {string[]} colorTagIds - Array of ColorTag IDs to associate
 * @returns {Promise<Object>} The created Embroidery Thread Color with tags
 */
export async function createEmbroideryThreadColorWithTags(data, colorTagIds) {
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
    // Check for name uniqueness
    const existingThread = await prisma.embroideryThread.findUnique({
      where: { name: data.name }
    });
    if (existingThread) {
      throw new Error('Embroidery thread color name already exists.');
    }
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      if (error.meta && error.meta.target) {
        if (error.meta.target.includes('abbreviation')) {
          throw new Error('Embroidery thread abbreviation already exists.');
        }
      }
      throw new Error('Unique constraint violation.');
    }
    console.error('[threadColorOperations] Error creating EmbroideryThread:', error);
    throw error;
  }
}

/**
 * Creates a new Stitching Thread Color and associates it with ColorTags and an Amann number.
 * @param {Object} data - Thread color data (name, abbreviation, amannNumber, etc.)
 * @param {string[]} colorTagIds - Array of ColorTag IDs to associate
 * @returns {Promise<Object>} The created Stitching Thread Color with tags and amann number
 */
export async function createStitchingThreadColorWithTagsAndAmann(data, colorTagIds) {
  try {
    // Check if the Amann number is already linked
    if (data.amannNumber) {
      const amann = await prisma.amannNumber.findUnique({
        where: { id: data.amannNumber }
      });
      if (!amann) {
        throw new Error('Amann number not found.');
      }
      if (amann.threadId) {
        throw new Error('Amann number already linked to another thread.');
      }
    }
    // Check for name uniqueness
    const existingThread = await prisma.stitchingThread.findUnique({
      where: { name: data.name }
    });
    if (existingThread) {
      throw new Error('Stitching thread color name already exists.');
    }
    // Create new
    const thread = await prisma.stitchingThread.create({
      data: {
        name: data.name,
        abbreviation: data.abbreviation,
        colorTags: {
          connect: colorTagIds.map(id => ({ id }))
        },
        amannNumbers: data.amannNumber ? {
          connect: [{ id: data.amannNumber }]
        } : undefined
      },
      include: {
        colorTags: true,
        amannNumbers: true
      }
    });
    return thread;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      if (error.meta && error.meta.target) {
        if (error.meta.target.includes('abbreviation')) {
          throw new Error('Stitching thread abbreviation already exists.');
        }
      }
      throw new Error('Unique constraint violation.');
    }
    console.error('[threadColorOperations] Error creating StitchingThread:', error);
    throw error;
  }
}

/**
 * Updates an existing Stitching Thread Color's linked Amann numbers and ColorTags.
 * @param {Object} params
 * @param {string} params.threadId - The ID of the stitching thread to update
 * @param {string[]} params.addAmannIds - Amann number IDs to add
 * @param {string[]} params.removeAmannIds - Amann number IDs to remove
 * @param {string[]} params.addColorTagIds - ColorTag IDs to add
 * @param {string[]} params.removeColorTagIds - ColorTag IDs to remove
 * @returns {Promise<Object>} The updated Stitching Thread Color with tags and amann numbers
 */
export async function updateStitchingThreadColorWithTagsAndNumbers({
  threadId,
  addAmannIds = [],
  removeAmannIds = [],
  addColorTagIds = [],
  removeColorTagIds = [],
}) {
  try {
    // Update the thread color
    const updated = await prisma.stitchingThread.update({
      where: { id: threadId },
      data: {
        amannNumbers: {
          connect: addAmannIds.map(id => ({ id })),
          disconnect: removeAmannIds.map(id => ({ id })),
        },
        colorTags: {
          connect: addColorTagIds.map(id => ({ id })),
          disconnect: removeColorTagIds.map(id => ({ id })),
        },
      },
      include: {
        colorTags: true,
        amannNumbers: true,
      },
    });
    return updated;
  } catch (error) {
    console.error('[threadColorOperations] Error updating stitching thread:', error);
    throw error;
  }
}
