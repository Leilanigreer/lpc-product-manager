/*
  Warnings:

  - You are about to drop the column `image_url` on the `Font` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `LeatherColor` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `Style` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Font" DROP COLUMN "image_url",
ADD COLUMN     "url_id" TEXT;

-- AlterTable
ALTER TABLE "LeatherColor" DROP COLUMN "image_url",
ADD COLUMN     "url_id" TEXT;

-- AlterTable
ALTER TABLE "Style" DROP COLUMN "image_url",
ADD COLUMN     "url_id" TEXT;
