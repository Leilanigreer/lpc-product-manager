-- CreateTable
CREATE TABLE "StyleCollection" (
    "id" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StyleCollection_styleId_idx" ON "StyleCollection"("styleId");

-- CreateIndex
CREATE INDEX "StyleCollection_collectionId_idx" ON "StyleCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "StyleCollection_styleId_collectionId_key" ON "StyleCollection"("styleId", "collectionId");

-- AddForeignKey
ALTER TABLE "StyleCollection" ADD CONSTRAINT "StyleCollection_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StyleCollection" ADD CONSTRAINT "StyleCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ShopifyCollections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
