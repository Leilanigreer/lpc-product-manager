/*
  Warnings:

  - You are about to drop the column `isacordId` on the `ProductDataLPC` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_isacordId_fkey";

-- DropIndex
DROP INDEX "ProductDataLPC_isacordId_idx";

-- AlterTable
ALTER TABLE "ProductDataLPC" DROP COLUMN "isacordId";

-- CreateTable
CREATE TABLE "ProductDataLPCToEmbroidery" (
    "productDataLPCId" TEXT NOT NULL,
    "embroideryThreadId" TEXT NOT NULL,
    "isacordNumberId" TEXT NOT NULL,

    CONSTRAINT "ProductDataLPCToEmbroidery_pkey" PRIMARY KEY ("productDataLPCId","isacordNumberId")
);

-- CreateIndex
CREATE INDEX "ProductDataLPCToEmbroidery_productDataLPCId_idx" ON "ProductDataLPCToEmbroidery"("productDataLPCId");

-- CreateIndex
CREATE INDEX "ProductDataLPCToEmbroidery_embroideryThreadId_idx" ON "ProductDataLPCToEmbroidery"("embroideryThreadId");

-- CreateIndex
CREATE INDEX "ProductDataLPCToEmbroidery_isacordNumberId_idx" ON "ProductDataLPCToEmbroidery"("isacordNumberId");

-- AddForeignKey
ALTER TABLE "ProductDataLPCToEmbroidery" ADD CONSTRAINT "ProductDataLPCToEmbroidery_productDataLPCId_fkey" FOREIGN KEY ("productDataLPCId") REFERENCES "ProductDataLPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPCToEmbroidery" ADD CONSTRAINT "ProductDataLPCToEmbroidery_embroideryThreadId_fkey" FOREIGN KEY ("embroideryThreadId") REFERENCES "EmbroideryThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPCToEmbroidery" ADD CONSTRAINT "ProductDataLPCToEmbroidery_isacordNumberId_fkey" FOREIGN KEY ("isacordNumberId") REFERENCES "IsacordNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
