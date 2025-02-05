-- DropForeignKey
ALTER TABLE "IsacordNumber" DROP CONSTRAINT "IsacordNumber_threadId_fkey";

-- AlterTable
ALTER TABLE "IsacordNumber" ADD COLUMN     "isStockThread" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wawakColorName" TEXT,
ADD COLUMN     "wawakItemNumber" TEXT,
ALTER COLUMN "threadId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "IsacordNumber" ADD CONSTRAINT "IsacordNumber_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmbroideryThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
