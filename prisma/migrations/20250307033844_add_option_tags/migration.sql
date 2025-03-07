-- CreateTable
CREATE TABLE "OptionTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OptionToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OptionTag_name_key" ON "OptionTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_OptionToTag_AB_unique" ON "_OptionToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_OptionToTag_B_index" ON "_OptionToTag"("B");

-- AddForeignKey
ALTER TABLE "_OptionToTag" ADD CONSTRAINT "_OptionToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionToTag" ADD CONSTRAINT "_OptionToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "OptionTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
