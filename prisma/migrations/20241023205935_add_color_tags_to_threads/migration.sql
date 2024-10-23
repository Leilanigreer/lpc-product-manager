-- CreateTable
CREATE TABLE "_ThreadColorToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ThreadColorToTag_AB_unique" ON "_ThreadColorToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ThreadColorToTag_B_index" ON "_ThreadColorToTag"("B");

-- AddForeignKey
ALTER TABLE "_ThreadColorToTag" ADD CONSTRAINT "_ThreadColorToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThreadColorToTag" ADD CONSTRAINT "_ThreadColorToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
