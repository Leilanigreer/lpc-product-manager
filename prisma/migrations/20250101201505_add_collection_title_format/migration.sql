-- CreateTable
CREATE TABLE "CollectionTitleFormat" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "seoTemplate" TEXT NOT NULL,
    "handleTemplate" TEXT NOT NULL,
    "validation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionTitleFormat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionTitleFormat_collectionId_key" ON "CollectionTitleFormat"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionTitleFormat_collectionId_idx" ON "CollectionTitleFormat"("collectionId");

-- AddForeignKey
ALTER TABLE "CollectionTitleFormat" ADD CONSTRAINT "CollectionTitleFormat_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ShopifyCollections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
