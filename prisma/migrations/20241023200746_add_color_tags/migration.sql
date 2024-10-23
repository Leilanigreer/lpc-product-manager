-- CreateTable
CREATE TABLE "ColorTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColorTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LeatherColorToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ColorTag_name_key" ON "ColorTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_LeatherColorToTag_AB_unique" ON "_LeatherColorToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_LeatherColorToTag_B_index" ON "_LeatherColorToTag"("B");

-- AddForeignKey
ALTER TABLE "_LeatherColorToTag" ADD CONSTRAINT "_LeatherColorToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeatherColorToTag" ADD CONSTRAINT "_LeatherColorToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "LeatherColor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
