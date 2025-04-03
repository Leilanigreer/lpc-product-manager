-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY', 'BACK', 'INSIDE');

-- CreateEnum
CREATE TYPE "Marketplace" AS ENUM ('SHOPIFY', 'ETSY', 'EBAY');

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productDataLPCId" TEXT NOT NULL,
    "imageType" "ImageType" NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductImage_productDataLPCId_idx" ON "ProductImage"("productDataLPCId");

-- CreateIndex
CREATE INDEX "ProductImage_marketplace_idx" ON "ProductImage"("marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productDataLPCId_imageType_marketplace_key" ON "ProductImage"("productDataLPCId", "imageType", "marketplace");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productDataLPCId_fkey" FOREIGN KEY ("productDataLPCId") REFERENCES "ProductDataLPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;
