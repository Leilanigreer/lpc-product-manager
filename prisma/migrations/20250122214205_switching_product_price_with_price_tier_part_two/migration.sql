/*
  Warnings:

  - You are about to drop the column `minMarketPrice` on the `ShapeTypeAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `minShopifyPrice` on the `ShapeTypeAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `stylePerShape` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the `ProductPrice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductPrice" DROP CONSTRAINT "ProductPrice_shapeId_fkey";

-- DropForeignKey
ALTER TABLE "ProductPrice" DROP CONSTRAINT "ProductPrice_shopifyCollectionId_fkey";

-- AlterTable
ALTER TABLE "ShapeTypeAdjustment" DROP COLUMN "minMarketPrice",
DROP COLUMN "minShopifyPrice";

-- AlterTable
ALTER TABLE "Style" DROP COLUMN "stylePerShape";

-- DropTable
DROP TABLE "ProductPrice";
