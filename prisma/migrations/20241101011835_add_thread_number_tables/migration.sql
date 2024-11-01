/*
  Warnings:

  - You are about to drop the column `isacord_number` on the `EmbroideryThread` table. All the data in the column will be lost.
  - You are about to drop the column `amann_number` on the `StitchingThread` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmbroideryThread" DROP COLUMN "isacord_number";

-- AlterTable
ALTER TABLE "StitchingThread" DROP COLUMN "amann_number";

-- CreateTable
CREATE TABLE "IsacordNumber" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IsacordNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmannNumber" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmannNumber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IsacordNumber_threadId_idx" ON "IsacordNumber"("threadId");

-- CreateIndex
CREATE INDEX "AmannNumber_threadId_idx" ON "AmannNumber"("threadId");

-- AddForeignKey
ALTER TABLE "IsacordNumber" ADD CONSTRAINT "IsacordNumber_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmbroideryThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmannNumber" ADD CONSTRAINT "AmannNumber_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "StitchingThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
