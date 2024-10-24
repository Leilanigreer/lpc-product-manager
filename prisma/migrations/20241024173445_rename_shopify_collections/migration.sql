/*
  Warnings:

  - You are about to drop the column `ShopifyCollectionId` on the `ProductPrice` table. All the data in the column will be lost.
  - You are about to drop the column `collectionId` on the `ProductPrice` table. All the data in the column will be lost.
  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductPrice" DROP CONSTRAINT "ProductPrice_ShopifyCollectionId_fkey";

-- DropForeignKey
ALTER TABLE "ProductPrice" DROP CONSTRAINT "ProductPrice_collectionId_fkey";

-- AlterTable
ALTER TABLE "ProductPrice" DROP COLUMN "ShopifyCollectionId",
DROP COLUMN "collectionId",
ADD COLUMN     "shopifyCollectionId" TEXT;

-- DropTable
DROP TABLE "Collection";

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_shopifyCollectionId_fkey" FOREIGN KEY ("shopifyCollectionId") REFERENCES "ShopifyCollections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
