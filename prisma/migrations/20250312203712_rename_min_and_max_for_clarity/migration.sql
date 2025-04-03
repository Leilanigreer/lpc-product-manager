/*
  Warnings:

  - You are about to drop the column `allowMultiple` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `maxCharacters` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `maxSelection` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `minCharacters` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `minSelection` on the `Option` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Option" DROP COLUMN "allowMultiple",
DROP COLUMN "maxCharacters",
DROP COLUMN "maxSelection",
DROP COLUMN "minCharacters",
DROP COLUMN "minSelection",
ADD COLUMN     "allowMultipleSelections" BOOLEAN,
ADD COLUMN     "maxCharLimit" INTEGER,
ADD COLUMN     "maxSelectable" INTEGER,
ADD COLUMN     "minCharLimit" INTEGER,
ADD COLUMN     "minSelectable" INTEGER;
