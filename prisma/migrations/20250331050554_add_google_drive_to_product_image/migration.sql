-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "googleDriveId" TEXT,
ADD COLUMN     "googleDriveUrl" TEXT,
ALTER COLUMN "cloudinaryUrl" DROP NOT NULL,
ALTER COLUMN "cloudinaryId" DROP NOT NULL;
