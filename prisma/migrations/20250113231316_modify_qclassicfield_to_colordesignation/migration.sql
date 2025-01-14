/*
  Warnings:

  - You are about to drop the column `needsQClassicField` on the `ShopifyCollections` table. All the data in the column will be lost.
  - You are about to drop the column `overrideQClassicField` on the `StyleCollection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShopifyCollections" DROP COLUMN "needsQClassicField",
ADD COLUMN     "needsColorDesignation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StyleCollection" DROP COLUMN "overrideQClassicField",
ADD COLUMN     "overrideColorDesignation" BOOLEAN;
