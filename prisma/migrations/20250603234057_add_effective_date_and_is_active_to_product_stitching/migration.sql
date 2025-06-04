-- AlterTable
ALTER TABLE "ProductStitching" ADD COLUMN     "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "ProductStitching_effectiveDate_idx" ON "ProductStitching"("effectiveDate");
