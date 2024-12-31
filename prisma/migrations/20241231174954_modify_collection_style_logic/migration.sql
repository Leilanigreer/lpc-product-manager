/*
  Warnings:

  - You are about to drop the column `needsQClassicField` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `needsSecondaryLeather` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `needsStitchingColor` on the `Style` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShopifyCollections" ADD COLUMN     "needsQClassicField" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needsSecondaryLeather" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needsStitchingColor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Style" DROP COLUMN "needsQClassicField",
DROP COLUMN "needsSecondaryLeather",
DROP COLUMN "needsStitchingColor";

-- AlterTable
ALTER TABLE "StyleCollection" ADD COLUMN     "overrideQClassicField" BOOLEAN,
ADD COLUMN     "overrideSecondaryLeather" BOOLEAN,
ADD COLUMN     "overrideStitchingColor" BOOLEAN;
