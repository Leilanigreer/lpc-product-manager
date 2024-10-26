-- CreateTable
CREATE TABLE "EmbroideryThread" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "isacord_number" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbroideryThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StitchingThread" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "amann_number" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StitchingThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EmbroideryThreadToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_StitchingThreadToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EmbroideryThreadToTag_AB_unique" ON "_EmbroideryThreadToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_EmbroideryThreadToTag_B_index" ON "_EmbroideryThreadToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_StitchingThreadToTag_AB_unique" ON "_StitchingThreadToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_StitchingThreadToTag_B_index" ON "_StitchingThreadToTag"("B");

-- AddForeignKey
ALTER TABLE "_EmbroideryThreadToTag" ADD CONSTRAINT "_EmbroideryThreadToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmbroideryThreadToTag" ADD CONSTRAINT "_EmbroideryThreadToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "EmbroideryThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StitchingThreadToTag" ADD CONSTRAINT "_StitchingThreadToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StitchingThreadToTag" ADD CONSTRAINT "_StitchingThreadToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "StitchingThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
