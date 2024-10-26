import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dropOldTables() {
  try {
    // Execute raw SQL to drop the old tables
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "_ThreadColorToTag" CASCADE;');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "Thread" CASCADE;');
    
    console.log('Old tables successfully dropped');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

dropOldTables()
  .catch(console.error);