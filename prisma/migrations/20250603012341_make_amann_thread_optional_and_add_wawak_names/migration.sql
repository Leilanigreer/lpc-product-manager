-- DropForeignKey
ALTER TABLE "AmannNumber" DROP CONSTRAINT "AmannNumber_threadId_fkey";

-- AlterTable
ALTER TABLE "AmannNumber" ADD COLUMN     "WawakColorName" TEXT,
ADD COLUMN     "WawakItemNumber" TEXT,
ADD COLUMN     "isStockThread" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "threadId" DROP NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "AmannNumber" ADD CONSTRAINT "AmannNumber_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "StitchingThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
