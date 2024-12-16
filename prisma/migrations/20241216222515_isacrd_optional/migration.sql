-- DropForeignKey
ALTER TABLE "ProductDataLPC" DROP CONSTRAINT "ProductDataLPC_isacordId_fkey";

-- AlterTable
ALTER TABLE "ProductDataLPC" ALTER COLUMN "isacordId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_isacordId_fkey" FOREIGN KEY ("isacordId") REFERENCES "IsacordNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
