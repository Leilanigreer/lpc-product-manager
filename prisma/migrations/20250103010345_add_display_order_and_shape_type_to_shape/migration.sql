-- CreateEnum
CREATE TYPE "ShapeType" AS ENUM ('WOOD', 'PUTTER', 'OTHER');

-- AlterTable
ALTER TABLE "Shape" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shapeType" "ShapeType" NOT NULL DEFAULT 'OTHER';
