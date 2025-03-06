/*
  Warnings:

  - You are about to drop the column `addOnPrice` on the `option_layouts` table. All the data in the column will be lost.
  - You are about to drop the column `colorHex` on the `option_layouts` table. All the data in the column will be lost.
  - You are about to drop the column `defaultValue` on the `option_layouts` table. All the data in the column will be lost.
  - You are about to drop the column `optionDescription` on the `option_layouts` table. All the data in the column will be lost.
  - The `optionName` column on the `option_layouts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `nickname` column on the `option_layouts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `inCartName` column on the `option_layouts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "option_layouts" DROP COLUMN "addOnPrice",
DROP COLUMN "colorHex",
DROP COLUMN "defaultValue",
DROP COLUMN "optionDescription",
ADD COLUMN     "color" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "optionValues" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceSKU" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "optionName",
ADD COLUMN     "optionName" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "nickname",
ADD COLUMN     "nickname" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "required" SET DEFAULT true,
DROP COLUMN "inCartName",
ADD COLUMN     "inCartName" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "allowedTypes" SET DEFAULT false;
