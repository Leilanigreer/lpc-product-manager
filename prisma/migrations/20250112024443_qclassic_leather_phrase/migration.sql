-- AlterTable
ALTER TABLE "Style" ADD COLUMN     "leatherPhrase" TEXT,
ADD COLUMN     "useOppositeLeather" BOOLEAN NOT NULL DEFAULT false;
