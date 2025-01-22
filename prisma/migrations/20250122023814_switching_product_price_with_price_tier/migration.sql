-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShapeType" ADD VALUE 'DRIVER';
ALTER TYPE "ShapeType" ADD VALUE 'HYBRID';

-- AlterTable
ALTER TABLE "ShopifyCollections" ADD COLUMN     "priceTierId" TEXT;

-- CreateTable
CREATE TABLE "PriceTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shopifyPrice" DECIMAL(10,2) NOT NULL,
    "marketplacePrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShapeTypeAdjustment" (
    "id" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "shapeType" "ShapeType" NOT NULL,
    "shopifyAdjustment" DECIMAL(10,2) NOT NULL,
    "marketAdjustment" DECIMAL(10,2) NOT NULL,
    "isBasePrice" BOOLEAN NOT NULL DEFAULT false,
    "minShopifyPrice" DECIMAL(10,2),
    "minMarketPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShapeTypeAdjustment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShopifyCollections" ADD CONSTRAINT "ShopifyCollections_priceTierId_fkey" FOREIGN KEY ("priceTierId") REFERENCES "PriceTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShapeTypeAdjustment" ADD CONSTRAINT "ShapeTypeAdjustment_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "PriceTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
