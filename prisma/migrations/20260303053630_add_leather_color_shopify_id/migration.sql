-- DropForeignKey
ALTER TABLE "ProductSetDataLPC" DROP CONSTRAINT "ProductSetDataLPC_leatherColor1Id_fkey";

-- AlterTable
ALTER TABLE "ProductSetDataLPC" ADD COLUMN     "leatherColor1ShopifyId" TEXT,
ADD COLUMN     "leatherColor2ShopifyId" TEXT,
ALTER COLUMN "leatherColor1Id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ProductSetDataLPC" ADD CONSTRAINT "ProductSetDataLPC_leatherColor1Id_fkey" FOREIGN KEY ("leatherColor1Id") REFERENCES "LeatherColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
