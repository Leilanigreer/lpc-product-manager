/*
  Warnings:

  - You are about to drop the column `cloudinaryId` on the `ProductImage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "cloudinaryId",
ADD COLUMN     "cloudinaryPublicId" TEXT;
