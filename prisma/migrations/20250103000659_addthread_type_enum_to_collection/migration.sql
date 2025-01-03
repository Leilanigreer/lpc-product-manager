-- CreateEnum
CREATE TYPE "ThreadType" AS ENUM ('EMBROIDERY', 'STITCHING', 'NONE');

-- AlterTable
ALTER TABLE "ShopifyCollections" ADD COLUMN     "threadType" "ThreadType" NOT NULL DEFAULT 'NONE';
