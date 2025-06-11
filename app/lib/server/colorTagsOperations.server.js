import prisma from "../../db.server.js";

// Create a new color tag
export async function createColorTag({ name, stitchingThreadIds = [], embroideryThreadIds = [], leatherColorIds = [] }) {
  // Check for unique name
  const existing = await prisma.colorTag.findUnique({ where: { name } });
  if (existing) throw new Error('A color tag with this name already exists.');
  return prisma.colorTag.create({
    data: {
      name,
      stitchingColors: { connect: stitchingThreadIds.map(id => ({ id })) },
      embroideryColors: { connect: embroideryThreadIds.map(id => ({ id })) },
      leatherColors: { connect: leatherColorIds.map(id => ({ id })) },
    },
    include: {
      stitchingColors: true,
      embroideryColors: true,
      leatherColors: true,
    },
  });
}

// Update an existing color tag
export async function updateColorTag(id, { name, stitchingThreadIds = [], embroideryThreadIds = [], leatherColorIds = [] }) {
  // Check for unique name (if changing)
  if (name) {
    const existing = await prisma.colorTag.findUnique({ where: { name } });
    if (existing && existing.id !== id) throw new Error('A color tag with this name already exists.');
  }
  return prisma.colorTag.update({
    where: { id },
    data: {
      name,
      stitchingColors: { set: stitchingThreadIds.map(id => ({ id })) },
      embroideryColors: { set: embroideryThreadIds.map(id => ({ id })) },
      leatherColors: { set: leatherColorIds.map(id => ({ id })) },
    },
    include: {
      stitchingColors: true,
      embroideryColors: true,
      leatherColors: true,
    },
  });
} 