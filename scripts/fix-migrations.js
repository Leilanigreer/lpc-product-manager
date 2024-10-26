import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMigrations() {
  try {
    // Drop migrations history table
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;');
    
    // Recreate indices and constraints for all tables
    
    // Session table - no special indices needed as it only has @id
    
    // LeatherColor - no unique constraints except id
    
    // Shape - no unique constraints except id
    
    // Style - no unique constraints except id
    
    // Font - no unique constraints except id
    
    // ColorTag
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "ColorTag_name_key" ON "ColorTag"("name");');
    
    // ShopifyCollections
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "ShopifyCollections_handle_key" ON "ShopifyCollections"("handle");');
    
    // ProductPrice foreign keys
    await prisma.$executeRawUnsafe('ALTER TABLE "ProductPrice" DROP CONSTRAINT IF EXISTS "ProductPrice_shapeId_fkey";');
    await prisma.$executeRawUnsafe('ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
    
    await prisma.$executeRawUnsafe('ALTER TABLE "ProductPrice" DROP CONSTRAINT IF EXISTS "ProductPrice_shopifyCollectionId_fkey";');
    await prisma.$executeRawUnsafe('ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_shopifyCollectionId_fkey" FOREIGN KEY ("shopifyCollectionId") REFERENCES "ShopifyCollections"("id") ON DELETE SET NULL ON UPDATE CASCADE;');
    
    // Many-to-Many Relations
    
    // LeatherColor to ColorTag relation
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "_LeatherColorToTag_AB_unique";');
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "_LeatherColorToTag_B_index";');
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX "_LeatherColorToTag_AB_unique" ON "_LeatherColorToTag"("A", "B");');
    await prisma.$executeRawUnsafe('CREATE INDEX "_LeatherColorToTag_B_index" ON "_LeatherColorToTag"("B");');
    
    await prisma.$executeRawUnsafe('ALTER TABLE "_LeatherColorToTag" DROP CONSTRAINT IF EXISTS "_LeatherColorToTag_A_fkey";');
    await prisma.$executeRawUnsafe('ALTER TABLE "_LeatherColorToTag" DROP CONSTRAINT IF EXISTS "_LeatherColorToTag_B_fkey";');
    await prisma.$executeRawUnsafe('ALTER TABLE "_LeatherColorToTag" ADD CONSTRAINT "_LeatherColorToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;');
    await prisma.$executeRawUnsafe('ALTER TABLE "_LeatherColorToTag" ADD CONSTRAINT "_LeatherColorToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "LeatherColor"("id") ON DELETE CASCADE ON UPDATE CASCADE;');
    
    // StitchingThread to ColorTag relation
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "_StitchingThreadColorToTag_AB_unique";');
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "_StitchingThreadColorToTag_B_index";');
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX "_StitchingThreadColorToTag_AB_unique" ON "_StitchingThreadColorToTag"("A", "B");');
    await prisma.$executeRawUnsafe('CREATE INDEX "_StitchingThreadColorToTag_B_index" ON "_StitchingThreadColorToTag"("B");');
    
    await prisma.$executeRawUnsafe('ALTER TABLE "_StitchingThreadColorToTag" DROP CONSTRAINT IF EXISTS "_StitchingThreadColorToTag_A_fkey";');
    await prisma.$executeRawUnsafe('ALTER TABLE "_StitchingThreadColorToTag" DROP CONSTRAINT IF EXISTS "_StitchingThreadColorToTag_B_fkey";');
    await prisma.$executeRawUnsafe('ALTER TABLE "_StitchingThreadColorToTag" ADD CONSTRAINT "_StitchingThreadColorToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;');
    await prisma.$executeRawUnsafe('ALTER TABLE "_StitchingThreadColorToTag" ADD CONSTRAINT "_StitchingThreadColorToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "StitchingThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;');
    
    // EmbroideryThread to ColorTag relation
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "_EmbroideryThreadColorToTag_AB_unique";');
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "_EmbroideryThreadColorToTag_B_index";');
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX "_EmbroideryThreadColorToTag_AB_unique" ON "_EmbroideryThreadColorToTag"("A", "B");');
    await prisma.$executeRawUnsafe('CREATE INDEX "_EmbroideryThreadColorToTag_B_index" ON "_EmbroideryThreadColorToTag"("B");');
    
    await prisma.$executeRawUnsafe('ALTER TABLE "_EmbroideryThreadColorToTag" DROP CONSTRAINT IF EXISTS "_EmbroideryThreadColorToTag_A_fkey";');
    await prisma.$executeRawUnsafe('ALTER TABLE "_EmbroideryThreadColorToTag" DROP CONSTRAINT IF EXISTS "_EmbroideryThreadColorToTag_B_fkey";');
    await prisma.$executeRawUnsafe('ALTER TABLE "_EmbroideryThreadColorToTag" ADD CONSTRAINT "_EmbroideryThreadColorToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;');
    await prisma.$executeRawUnsafe('ALTER TABLE "_EmbroideryThreadColorToTag" ADD CONSTRAINT "_EmbroideryThreadColorToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "EmbroideryThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;');

    console.log('Migration fixes applied successfully');
  } catch (error) {
    console.error('Error:', error);
    console.log('Specific error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigrations()
  .catch(console.error);