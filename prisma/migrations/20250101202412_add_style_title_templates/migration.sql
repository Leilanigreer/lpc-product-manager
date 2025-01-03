-- AlterTable
ALTER TABLE "StyleCollection" ADD COLUMN     "handleTemplate" TEXT,
ADD COLUMN     "seoTemplate" TEXT,
ADD COLUMN     "titleTemplate" TEXT,
ADD COLUMN     "validation" JSONB;
