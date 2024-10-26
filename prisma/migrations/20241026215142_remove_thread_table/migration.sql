/*
  Warnings:

  - You are about to drop the `Thread` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ThreadColorToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ThreadColorToTag" DROP CONSTRAINT "_ThreadColorToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ThreadColorToTag" DROP CONSTRAINT "_ThreadColorToTag_B_fkey";

-- DropTable
DROP TABLE "Thread";

-- DropTable
DROP TABLE "_ThreadColorToTag";
