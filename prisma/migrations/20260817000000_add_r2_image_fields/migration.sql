-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN "r2Url" TEXT,
ADD COLUMN "r2Key" TEXT;

-- AlterTable
ALTER TABLE "ProductSetDataLPC" ADD COLUMN "r2Prefix" TEXT;
