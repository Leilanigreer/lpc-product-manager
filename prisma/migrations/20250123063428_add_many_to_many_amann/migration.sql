/*
  Warnings:

  - You are about to drop the column `amannId` on the `ProductDataLPC` table. All the data in the column will be lost.
  - You are about to drop the column `quiltedLeatherColorId` on the `ProductDataLPC` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_amannId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_quiltedLeatherColorId_fkey";

-- DropIndex
DROP INDEX "ProductDataLPC_amannId_idx";

-- DropIndex
DROP INDEX "ProductDataLPC_quiltedLeatherColorId_idx";

-- AlterTable
ALTER TABLE "ProductDataLPC" DROP COLUMN "amannId",
DROP COLUMN "quiltedLeatherColorId",
ADD COLUMN     "colorDesignationId" TEXT;

-- CreateTable
CREATE TABLE "ProductDataLPCToAmann" (
    "productDataLPCId" TEXT NOT NULL,
    "amannNumberId" TEXT NOT NULL,

    CONSTRAINT "ProductDataLPCToAmann_pkey" PRIMARY KEY ("productDataLPCId","amannNumberId")
);

-- CreateIndex
CREATE INDEX "ProductDataLPCToAmann_productDataLPCId_idx" ON "ProductDataLPCToAmann"("productDataLPCId");

-- CreateIndex
CREATE INDEX "ProductDataLPCToAmann_amannNumberId_idx" ON "ProductDataLPCToAmann"("amannNumberId");

-- CreateIndex
CREATE INDEX "ProductDataLPC_colorDesignationId_idx" ON "ProductDataLPC"("colorDesignationId");

-- AddForeignKey
ALTER TABLE "ProductDataLPCToAmann" ADD CONSTRAINT "ProductDataLPCToAmann_productDataLPCId_fkey" FOREIGN KEY ("productDataLPCId") REFERENCES "ProductDataLPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPCToAmann" ADD CONSTRAINT "ProductDataLPCToAmann_amannNumberId_fkey" FOREIGN KEY ("amannNumberId") REFERENCES "AmannNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_colorDesignationId_fkey" FOREIGN KEY ("colorDesignationId") REFERENCES "LeatherColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
