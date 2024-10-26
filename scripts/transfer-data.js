import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function transferData() {
  try {
    // Get all threads with their color tags
    const threads = await prisma.thread.findMany({
      include: {
        colorTags: true,
      },
    });

    console.log(`Found ${threads.length} threads to transfer`);
    
    let stitchingCount = 0;
    let embroideryCount = 0;

    // Transfer each thread to both tables
    for (const thread of threads) {
      // Transfer to stitching threads
      try {
        await prisma.stitchingThread.create({
          data: {
            id: thread.id,
            name: thread.name,
            abbreviation: thread.abbreviation,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            colorTags: {
              connect: thread.colorTags.map(tag => ({ id: tag.id }))
            }
          }
        });
        stitchingCount++;
        console.log(`Transferred to stitching thread: ${thread.name}`);
      } catch (error) {
        console.error(`Error transferring stitching thread ${thread.name}:`, error);
      }

      // Transfer to embroidery threads
      try {
        await prisma.embroideryThread.create({
          data: {
            id: thread.id,
            name: thread.name,
            abbreviation: thread.abbreviation,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            colorTags: {
              connect: thread.colorTags.map(tag => ({ id: tag.id }))
            }
          }
        });
        embroideryCount++;
        console.log(`Transferred to embroidery thread: ${thread.name}`);
      } catch (error) {
        console.error(`Error transferring embroidery thread ${thread.name}:`, error);
      }
    }

    console.log(`Transfer complete:`);
    console.log(`  Stitching threads transferred: ${stitchingCount}`);
    console.log(`  Embroidery threads transferred: ${embroideryCount}`);

  } catch (error) {
    console.error('Error transferring data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

transferData()
  .catch(console.error);