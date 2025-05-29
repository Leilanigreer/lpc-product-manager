import prisma from "../../db.server.js";

/**
 * Creates a new LeatherColor and associates it with ColorTags.
 * @param {Object} data - Leather color data (name, abbreviation, etc.)
 * @param {string[]} colorTagIds - Array of ColorTag IDs to associate
 * @returns {Promise<Object>} The created LeatherColor with tags
 */
export async function createLeatherColorWithTags(data, colorTagIds) {
  console.log('[leatherColorOperations] createLeatherColorWithTags called with:', { data, colorTagIds });
  try {
    const leatherColor = await prisma.leatherColor.create({
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
    console.log('[leatherColorOperations] Created leatherColor:', leatherColor);
    return leatherColor;
  } catch (error) {
    console.error("Error creating LeatherColor:", error);
    throw error;
  }
} 