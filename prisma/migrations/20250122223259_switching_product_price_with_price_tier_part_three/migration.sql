/*
  Warnings:

  - A unique constraint covering the columns `[priceTierId]` on the table `ShopifyCollections` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShopifyCollections_priceTierId_key" ON "ShopifyCollections"("priceTierId");
