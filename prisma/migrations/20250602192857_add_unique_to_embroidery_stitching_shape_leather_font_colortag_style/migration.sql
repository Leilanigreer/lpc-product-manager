/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `EmbroideryThread` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[abbreviation]` on the table `EmbroideryThread` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Font` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[number]` on the table `IsacordNumber` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `LeatherColor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[abbreviation]` on the table `LeatherColor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Shape` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[abbreviation]` on the table `Shape` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `StitchingThread` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[abbreviation]` on the table `StitchingThread` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Style` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[abbreviation]` on the table `Style` will be added. If there are existing duplicate values, this will fail.

*/

-- CreateIndex
CREATE UNIQUE INDEX "EmbroideryThread_name_key" ON "EmbroideryThread"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EmbroideryThread_abbreviation_key" ON "EmbroideryThread"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Font_name_key" ON "Font"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeatherColor_name_key" ON "LeatherColor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeatherColor_abbreviation_key" ON "LeatherColor"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Shape_name_key" ON "Shape"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Shape_abbreviation_key" ON "Shape"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "StitchingThread_name_key" ON "StitchingThread"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StitchingThread_abbreviation_key" ON "StitchingThread"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Style_name_key" ON "Style"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Style_abbreviation_key" ON "Style"("abbreviation");
