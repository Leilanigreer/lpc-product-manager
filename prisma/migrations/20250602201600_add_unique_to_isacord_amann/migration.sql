/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `AmannNumber` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[number]` on the table `IsacordNumber` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AmannNumber_number_key" ON "AmannNumber"("number");

-- CreateIndex
CREATE UNIQUE INDEX "IsacordNumber_number_key" ON "IsacordNumber"("number");
