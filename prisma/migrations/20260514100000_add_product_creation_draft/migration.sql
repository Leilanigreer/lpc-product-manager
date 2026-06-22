-- CreateTable
CREATE TABLE "ProductCreationDraft" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "formState" JSONB NOT NULL,
    "aiDescription" TEXT NOT NULL DEFAULT '',
    "googleDriveFolderUrl" TEXT,
    "groupImageDriveFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCreationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductCreationDraft_shop_updatedAt_idx" ON "ProductCreationDraft"("shop", "updatedAt");
