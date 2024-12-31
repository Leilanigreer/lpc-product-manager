-- AlterTable
ALTER TABLE "Style" ADD COLUMN     "needsQClassicField" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needsSecondaryLeather" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needsStitchingColor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stylePerShape" BOOLEAN NOT NULL DEFAULT true;
