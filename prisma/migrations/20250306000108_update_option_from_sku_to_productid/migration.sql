/*
  Warnings:

  - You are about to drop the column `sku` on the `OptionValue` table. All the data in the column will be lost.
  - You are about to drop the column `priceSKU` on the `option_layouts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OptionValue" DROP COLUMN "sku",
ADD COLUMN     "associatedProductId" TEXT;

-- AlterTable
ALTER TABLE "option_layouts" DROP COLUMN "priceSKU",
ADD COLUMN     "associatedProductId" BOOLEAN NOT NULL DEFAULT true;
