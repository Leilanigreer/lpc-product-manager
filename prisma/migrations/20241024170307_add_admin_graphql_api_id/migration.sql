/*
  Warnings:

  - Added the required column `admin_graphql_api_id` to the `ShopifyCollections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ShopifyCollections" ADD COLUMN     "admin_graphql_api_id" TEXT NOT NULL;
