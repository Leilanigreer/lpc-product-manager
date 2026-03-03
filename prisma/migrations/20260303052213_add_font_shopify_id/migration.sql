-- DropForeignKey
ALTER TABLE "ProductSetDataLPC" DROP CONSTRAINT "ProductSetDataLPC_fontId_fkey";

-- AlterTable
ALTER TABLE "ProductSetDataLPC" ADD COLUMN     "fontShopifyId" TEXT,
ALTER COLUMN "fontId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ProductSetDataLPC" ADD CONSTRAINT "ProductSetDataLPC_fontId_fkey" FOREIGN KEY ("fontId") REFERENCES "Font"("id") ON DELETE SET NULL ON UPDATE CASCADE;
