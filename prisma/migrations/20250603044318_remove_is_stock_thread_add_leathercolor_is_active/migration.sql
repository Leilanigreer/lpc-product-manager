/*
  Warnings:

  - You are about to drop the column `isStockThread` on the `AmannNumber` table. All the data in the column will be lost.
  - You are about to drop the column `isStockThread` on the `IsacordNumber` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AmannNumber" DROP COLUMN "isStockThread";

-- AlterTable
ALTER TABLE "IsacordNumber" DROP COLUMN "isStockThread";

-- AlterTable
ALTER TABLE "LeatherColor" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
