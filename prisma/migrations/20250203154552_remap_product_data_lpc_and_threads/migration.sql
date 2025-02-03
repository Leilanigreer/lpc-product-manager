/*
  Warnings:

  - You are about to drop the `ProductDataLPCToAmann` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductDataLPCToEmbroidery` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductDataLPCToAmann" DROP CONSTRAINT "ProductDataLPCToAmann_amannNumberId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPCToAmann" DROP CONSTRAINT "ProductDataLPCToAmann_productDataLPCId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPCToEmbroidery" DROP CONSTRAINT "ProductDataLPCToEmbroidery_embroideryThreadId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPCToEmbroidery" DROP CONSTRAINT "ProductDataLPCToEmbroidery_isacordNumberId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPCToEmbroidery" DROP CONSTRAINT "ProductDataLPCToEmbroidery_productDataLPCId_fkey";

-- AlterTable
ALTER TABLE "ProductDataLPC" ADD COLUMN     "embroideryThreadId" TEXT,
ADD COLUMN     "isacordId" TEXT;

-- DropTable
DROP TABLE "ProductDataLPCToAmann";

-- DropTable
DROP TABLE "ProductDataLPCToEmbroidery";

-- CreateTable
CREATE TABLE "ProductStitching" (
    "id" TEXT NOT NULL,
    "productDataLPCId" TEXT NOT NULL,
    "stitchingThreadId" TEXT NOT NULL,
    "amannId" TEXT NOT NULL,

    CONSTRAINT "ProductStitching_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductStitching_productDataLPCId_idx" ON "ProductStitching"("productDataLPCId");

-- CreateIndex
CREATE INDEX "ProductStitching_stitchingThreadId_idx" ON "ProductStitching"("stitchingThreadId");

-- CreateIndex
CREATE INDEX "ProductStitching_amannId_idx" ON "ProductStitching"("amannId");

-- CreateIndex
CREATE INDEX "ProductDataLPC_embroideryThreadId_idx" ON "ProductDataLPC"("embroideryThreadId");

-- CreateIndex
CREATE INDEX "ProductDataLPC_isacordId_idx" ON "ProductDataLPC"("isacordId");

-- AddForeignKey
ALTER TABLE "ProductStitching" ADD CONSTRAINT "ProductStitching_productDataLPCId_fkey" FOREIGN KEY ("productDataLPCId") REFERENCES "ProductDataLPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStitching" ADD CONSTRAINT "ProductStitching_stitchingThreadId_fkey" FOREIGN KEY ("stitchingThreadId") REFERENCES "StitchingThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStitching" ADD CONSTRAINT "ProductStitching_amannId_fkey" FOREIGN KEY ("amannId") REFERENCES "AmannNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_embroideryThreadId_fkey" FOREIGN KEY ("embroideryThreadId") REFERENCES "EmbroideryThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_isacordId_fkey" FOREIGN KEY ("isacordId") REFERENCES "IsacordNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
