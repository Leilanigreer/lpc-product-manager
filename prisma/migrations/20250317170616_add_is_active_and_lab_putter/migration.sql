-- AlterEnum
ALTER TYPE "ShapeType" ADD VALUE 'LAB_PUTTER';

-- AlterTable
ALTER TABLE "Shape" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
