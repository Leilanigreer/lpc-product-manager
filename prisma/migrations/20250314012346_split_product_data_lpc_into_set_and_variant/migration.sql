/*
  Warnings:

  - You are about to drop the column `productDataLPCId` on the `ProductImage` table. All the data in the column will be lost.
  - You are about to drop the column `productDataLPCId` on the `ProductStitching` table. All the data in the column will be lost.
  - You are about to drop the `ProductDataLPC` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[setId,imageType,marketplace]` on the table `ProductImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[variantId,imageType,marketplace]` on the table `ProductImage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `setId` to the `ProductStitching` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_colorDesignationId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_embroideryThreadId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_fontId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_isacordId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_leatherColor1Id_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_leatherColor2Id_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_shapeId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_styleId_fkey";

-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productDataLPCId_fkey";

-- DropForeignKey
ALTER TABLE "ProductStitching" DROP CONSTRAINT "ProductStitching_productDataLPCId_fkey";

-- DropIndex
DROP INDEX "ProductImage_productDataLPCId_idx";

-- DropIndex
DROP INDEX "ProductImage_productDataLPCId_imageType_marketplace_key";

-- DropIndex
DROP INDEX "ProductStitching_productDataLPCId_idx";

-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "productDataLPCId",
ADD COLUMN     "setId" TEXT,
ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "ProductStitching" DROP COLUMN "productDataLPCId",
ADD COLUMN     "setId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ProductDataLPC";

-- CreateTable
CREATE TABLE "ProductSetDataLPC" (
    "id" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "baseSKU" TEXT NOT NULL,
    "offeringType" TEXT NOT NULL,
    "fontId" TEXT NOT NULL,
    "leatherColor1Id" TEXT NOT NULL,
    "leatherColor2Id" TEXT,
    "mainHandle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSetDataLPC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantDataLPC" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "shopifyVariantId" TEXT NOT NULL,
    "shopifyInventoryId" TEXT NOT NULL,
    "SKU" TEXT NOT NULL,
    "shapeId" TEXT NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL,
    "embroideryThreadId" TEXT,
    "isacordId" TEXT,
    "styleId" TEXT,
    "colorDesignationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantDataLPC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSetCollection" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSetCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductSetDataLPC_fontId_idx" ON "ProductSetDataLPC"("fontId");

-- CreateIndex
CREATE INDEX "ProductSetDataLPC_leatherColor1Id_idx" ON "ProductSetDataLPC"("leatherColor1Id");

-- CreateIndex
CREATE INDEX "ProductSetDataLPC_leatherColor2Id_idx" ON "ProductSetDataLPC"("leatherColor2Id");

-- CreateIndex
CREATE INDEX "ProductVariantDataLPC_setId_idx" ON "ProductVariantDataLPC"("setId");

-- CreateIndex
CREATE INDEX "ProductVariantDataLPC_shapeId_idx" ON "ProductVariantDataLPC"("shapeId");

-- CreateIndex
CREATE INDEX "ProductVariantDataLPC_embroideryThreadId_idx" ON "ProductVariantDataLPC"("embroideryThreadId");

-- CreateIndex
CREATE INDEX "ProductVariantDataLPC_isacordId_idx" ON "ProductVariantDataLPC"("isacordId");

-- CreateIndex
CREATE INDEX "ProductVariantDataLPC_styleId_idx" ON "ProductVariantDataLPC"("styleId");

-- CreateIndex
CREATE INDEX "ProductVariantDataLPC_colorDesignationId_idx" ON "ProductVariantDataLPC"("colorDesignationId");

-- CreateIndex
CREATE INDEX "ProductSetCollection_setId_idx" ON "ProductSetCollection"("setId");

-- CreateIndex
CREATE INDEX "ProductSetCollection_collectionId_idx" ON "ProductSetCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSetCollection_setId_collectionId_key" ON "ProductSetCollection"("setId", "collectionId");

-- CreateIndex
CREATE INDEX "ProductImage_setId_idx" ON "ProductImage"("setId");

-- CreateIndex
CREATE INDEX "ProductImage_variantId_idx" ON "ProductImage"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_setId_imageType_marketplace_key" ON "ProductImage"("setId", "imageType", "marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_variantId_imageType_marketplace_key" ON "ProductImage"("variantId", "imageType", "marketplace");

-- CreateIndex
CREATE INDEX "ProductStitching_setId_idx" ON "ProductStitching"("setId");

-- AddForeignKey
ALTER TABLE "ProductStitching" ADD CONSTRAINT "ProductStitching_setId_fkey" FOREIGN KEY ("setId") REFERENCES "ProductSetDataLPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_setId_fkey" FOREIGN KEY ("setId") REFERENCES "ProductSetDataLPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariantDataLPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSetDataLPC" ADD CONSTRAINT "ProductSetDataLPC_fontId_fkey" FOREIGN KEY ("fontId") REFERENCES "Font"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSetDataLPC" ADD CONSTRAINT "ProductSetDataLPC_leatherColor1Id_fkey" FOREIGN KEY ("leatherColor1Id") REFERENCES "LeatherColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSetDataLPC" ADD CONSTRAINT "ProductSetDataLPC_leatherColor2Id_fkey" FOREIGN KEY ("leatherColor2Id") REFERENCES "LeatherColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantDataLPC" ADD CONSTRAINT "ProductVariantDataLPC_setId_fkey" FOREIGN KEY ("setId") REFERENCES "ProductSetDataLPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantDataLPC" ADD CONSTRAINT "ProductVariantDataLPC_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantDataLPC" ADD CONSTRAINT "ProductVariantDataLPC_embroideryThreadId_fkey" FOREIGN KEY ("embroideryThreadId") REFERENCES "EmbroideryThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantDataLPC" ADD CONSTRAINT "ProductVariantDataLPC_isacordId_fkey" FOREIGN KEY ("isacordId") REFERENCES "IsacordNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantDataLPC" ADD CONSTRAINT "ProductVariantDataLPC_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantDataLPC" ADD CONSTRAINT "ProductVariantDataLPC_colorDesignationId_fkey" FOREIGN KEY ("colorDesignationId") REFERENCES "LeatherColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSetCollection" ADD CONSTRAINT "ProductSetCollection_setId_fkey" FOREIGN KEY ("setId") REFERENCES "ProductSetDataLPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSetCollection" ADD CONSTRAINT "ProductSetCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ShopifyCollections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
