import prisma from "../../db.server.js";
import { Prisma } from "@prisma/client";

/**
 * Updates an existing Embroidery Thread Color's linked Isacord numbers.
 */
export async function updateEmbroideryThreadColorWithNumbers({
  threadId,
  addIsacordIds = [],
  removeIsacordIds = [],
}) {
  try {
    const updated = await prisma.embroideryThread.update({
      where: { id: threadId },
      data: {
        isacordNumbers: {
          connect: addIsacordIds.map((id) => ({ id })),
          disconnect: removeIsacordIds.map((id) => ({ id })),
        },
      },
      include: {
        isacordNumbers: true,
      },
    });
    return updated;
  } catch (error) {
    console.error("[threadColorOperations] Error updating embroidery thread:", error);
    throw error;
  }
}

/**
 * Creates a new Embroidery Thread Color.
 */
export async function createEmbroideryThreadColor(data) {
  try {
    if (data.isacordNumbers && data.isacordNumbers.length > 0) {
      for (const isacordId of data.isacordNumbers) {
        const isacord = await prisma.isacordNumber.findUnique({ where: { id: isacordId } });
        if (!isacord) {
          throw new Error("Isacord number not found.");
        }
        if (isacord.threadId) {
          throw new Error("Isacord number already linked to another thread.");
        }
      }
    }
    const existingThread = await prisma.embroideryThread.findUnique({
      where: { name: data.name },
    });
    if (existingThread) {
      throw new Error("Embroidery thread color name already exists.");
    }
    const thread = await prisma.embroideryThread.create({
      data: {
        name: data.name,
        abbreviation: data.abbreviation,
        isacordNumbers:
          data.isacordNumbers && data.isacordNumbers.length > 0
            ? {
                connect: data.isacordNumbers.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        isacordNumbers: true,
      },
    });
    return thread;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      if (error.meta && error.meta.target) {
        if (error.meta.target.includes("abbreviation")) {
          throw new Error("Embroidery thread abbreviation already exists.");
        }
      }
      throw new Error("Unique constraint violation.");
    }
    console.error("[threadColorOperations] Error creating EmbroideryThread:", error);
    throw error;
  }
}

/**
 * Creates a new Stitching Thread Color with Amann numbers.
 */
export async function createStitchingThreadColorWithAmann(data) {
  try {
    if (data.amannNumbers && data.amannNumbers.length > 0) {
      for (const amannId of data.amannNumbers) {
        const amann = await prisma.amannNumber.findUnique({ where: { id: amannId } });
        if (!amann) {
          throw new Error("Amann number not found.");
        }
        if (amann.threadId) {
          throw new Error("Amann number already linked to another thread.");
        }
      }
    }
    const existingThread = await prisma.stitchingThread.findUnique({
      where: { name: data.name },
    });
    if (existingThread) {
      throw new Error("Stitching thread color name already exists.");
    }
    const thread = await prisma.stitchingThread.create({
      data: {
        name: data.name,
        abbreviation: data.abbreviation,
        amannNumbers:
          data.amannNumbers && data.amannNumbers.length > 0
            ? {
                connect: data.amannNumbers.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        amannNumbers: true,
      },
    });
    return thread;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      if (error.meta && error.meta.target) {
        if (error.meta.target.includes("abbreviation")) {
          throw new Error("Stitching thread abbreviation already exists.");
        }
      }
      throw new Error("Unique constraint violation.");
    }
    console.error("[threadColorOperations] Error creating StitchingThread:", error);
    throw error;
  }
}

/**
 * Updates an existing Stitching Thread Color's linked Amann numbers.
 */
export async function updateStitchingThreadColorWithNumbers({
  threadId,
  addAmannIds = [],
  removeAmannIds = [],
}) {
  try {
    const updated = await prisma.stitchingThread.update({
      where: { id: threadId },
      data: {
        amannNumbers: {
          connect: addAmannIds.map((id) => ({ id })),
          disconnect: removeAmannIds.map((id) => ({ id })),
        },
      },
      include: {
        amannNumbers: true,
      },
    });
    return updated;
  } catch (error) {
    console.error("[threadColorOperations] Error updating stitching thread:", error);
    throw error;
  }
}

export async function unlinkIsacordFromThread(isacordId, fromThreadId) {
  await prisma.isacordNumber.updateMany({
    where: {
      id: isacordId,
      threadId: fromThreadId,
    },
    data: {
      threadId: null,
    },
  });
}

export async function unlinkAmannFromThread(amannId, fromThreadId) {
  await prisma.amannNumber.updateMany({
    where: {
      id: amannId,
      threadId: fromThreadId,
    },
    data: {
      threadId: null,
    },
  });
}
