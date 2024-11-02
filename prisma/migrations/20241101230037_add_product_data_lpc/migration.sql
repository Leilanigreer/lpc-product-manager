-- CreateTable
CREATE TABLE "ProductDataLPC" (
    "id" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT NOT NULL,
    "shopifyInventoryId" TEXT NOT NULL,
    "SKU" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "fontId" TEXT NOT NULL,
    "shapeId" TEXT NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL,
    "leatherColor1Id" TEXT NOT NULL,
    "leatherColor2Id" TEXT,
    "amannId" TEXT,
    "isacordId" TEXT NOT NULL,
    "styleId" TEXT,
    "quiltedLeatherColorId" TEXT,
    "mainHandle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDataLPC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductDataLPC_collectionId_idx" ON "ProductDataLPC"("collectionId");

-- CreateIndex
CREATE INDEX "ProductDataLPC_fontId_idx" ON "ProductDataLPC"("fontId");

-- CreateIndex
CREATE INDEX "ProductDataLPC_shapeId_idx" ON "ProductDataLPC"("shapeId");

-- CreateIndex
CREATE INDEX "ProductDataLPC_leatherColor1Id_idx" ON "ProductDataLPC"("leatherColor1Id");

-- CreateIndex
CREATE INDEX "ProductDataLPC_leatherColor2Id_idx" ON "ProductDataLPC"("leatherColor2Id");

-- CreateIndex
CREATE INDEX "ProductDataLPC_amannId_idx" ON "ProductDataLPC"("amannId");

-- CreateIndex
CREATE INDEX "ProductDataLPC_isacordId_idx" ON "ProductDataLPC"("isacordId");

-- CreateIndex
CREATE INDEX "ProductDataLPC_styleId_idx" ON "ProductDataLPC"("styleId");

-- CreateIndex
CREATE INDEX "ProductDataLPC_quiltedLeatherColorId_idx" ON "ProductDataLPC"("quiltedLeatherColorId");

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ShopifyCollections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_fontId_fkey" FOREIGN KEY ("fontId") REFERENCES "Font"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_leatherColor1Id_fkey" FOREIGN KEY ("leatherColor1Id") REFERENCES "LeatherColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_leatherColor2Id_fkey" FOREIGN KEY ("leatherColor2Id") REFERENCES "LeatherColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_amannId_fkey" FOREIGN KEY ("amannId") REFERENCES "AmannNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_isacordId_fkey" FOREIGN KEY ("isacordId") REFERENCES "IsacordNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDataLPC" ADD CONSTRAINT "ProductDataLPC_quiltedLeatherColorId_fkey" FOREIGN KEY ("quiltedLeatherColorId") REFERENCES "LeatherColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
