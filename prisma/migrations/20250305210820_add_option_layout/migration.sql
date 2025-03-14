/*
  Warnings:

  - You are about to drop the `OptionLayout` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OptionType" AS ENUM ('FILE_UPLOAD', 'CHECKBOX', 'DROPDOWN', 'IMAGE_SWATCH', 'COLOR_SWATCH', 'RADIO_BUTTON', 'BUTTON', 'TEXT_BOX', 'NUMBER_FIELD', 'DATE_PICKER');

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_layoutId_fkey";

-- DropTable
DROP TABLE "OptionLayout";

-- CreateTable
CREATE TABLE "option_layouts" (
    "id" TEXT NOT NULL,
    "type" "OptionType" NOT NULL,
    "optionName" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "optionDescription" TEXT NOT NULL,
    "inCartName" TEXT NOT NULL,
    "addOnPrice" TEXT NOT NULL,
    "allowedTypes" BOOLEAN NOT NULL,
    "minSelectable" BOOLEAN NOT NULL DEFAULT false,
    "maxSelectable" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" BOOLEAN NOT NULL DEFAULT false,
    "image" BOOLEAN NOT NULL DEFAULT false,
    "allowMultipleSelections" BOOLEAN NOT NULL DEFAULT false,
    "colorHex" BOOLEAN NOT NULL DEFAULT false,
    "placeholderText" BOOLEAN NOT NULL DEFAULT false,
    "minCharLimit" BOOLEAN NOT NULL DEFAULT false,
    "maxCharLimit" BOOLEAN NOT NULL DEFAULT false,
    "minNumber" BOOLEAN NOT NULL DEFAULT false,
    "maxNumber" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "option_layouts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "option_layouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
