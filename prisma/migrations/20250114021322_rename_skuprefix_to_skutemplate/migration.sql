/*
  Warnings:

  - You are about to drop the column `skuPrefix` on the `ShopifyCollections` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShopifyCollections" DROP COLUMN "skuPrefix",
ADD COLUMN     "skuPattern" TEXT;

-- AlterTable
ALTER TABLE "StyleCollection" ADD COLUMN     "skuPattern" TEXT;
