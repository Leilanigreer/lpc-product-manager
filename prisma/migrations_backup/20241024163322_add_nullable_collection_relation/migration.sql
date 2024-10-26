-- AlterTable
ALTER TABLE "ProductPrice" ADD COLUMN     "ShopifyCollectionId" TEXT;

-- AlterTable
ALTER TABLE "Thread" ALTER COLUMN "amann_number" DROP NOT NULL,
ALTER COLUMN "isacord_number" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ShopifyCollections" (
    "id" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyCollections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyCollections_handle_key" ON "ShopifyCollections"("handle");

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_ShopifyCollectionId_fkey" FOREIGN KEY ("ShopifyCollectionId") REFERENCES "ShopifyCollections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
