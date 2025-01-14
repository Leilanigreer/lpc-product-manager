-- CreateEnum
CREATE TYPE "StyleNamePattern" AS ENUM ('STANDARD', 'STYLE_FIRST', 'CUSTOM');

-- AlterTable
ALTER TABLE "ShopifyCollections" ADD COLUMN     "defaultStyleNamePattern" "StyleNamePattern" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "stylePerCollection" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Style" ADD COLUMN     "customNamePattern" TEXT,
ADD COLUMN     "namePattern" "StyleNamePattern" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "StyleCollection" ADD COLUMN     "overrideCustomNamePattern" TEXT,
ADD COLUMN     "overrideNamePattern" "StyleNamePattern";
