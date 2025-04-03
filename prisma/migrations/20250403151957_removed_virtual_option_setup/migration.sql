/*
  Warnings:

  - You are about to drop the `Option` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OptionSet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OptionSetOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OptionSetRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OptionSetRuleToOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OptionTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OptionValue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_OptionToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `option_layouts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_layoutId_fkey";

-- DropForeignKey
ALTER TABLE "OptionSet" DROP CONSTRAINT "OptionSet_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "OptionSetOption" DROP CONSTRAINT "OptionSetOption_optionId_fkey";

-- DropForeignKey
ALTER TABLE "OptionSetOption" DROP CONSTRAINT "OptionSetOption_optionSetId_fkey";

-- DropForeignKey
ALTER TABLE "OptionSetRule" DROP CONSTRAINT "OptionSetRule_optionSetId_fkey";

-- DropForeignKey
ALTER TABLE "OptionSetRuleToOption" DROP CONSTRAINT "OptionSetRuleToOption_optionSetOptionId_fkey";

-- DropForeignKey
ALTER TABLE "OptionSetRuleToOption" DROP CONSTRAINT "OptionSetRuleToOption_ruleId_fkey";

-- DropForeignKey
ALTER TABLE "OptionValue" DROP CONSTRAINT "OptionValue_optionId_fkey";

-- DropForeignKey
ALTER TABLE "_OptionToTag" DROP CONSTRAINT "_OptionToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_OptionToTag" DROP CONSTRAINT "_OptionToTag_B_fkey";

-- DropTable
DROP TABLE "Option";

-- DropTable
DROP TABLE "OptionSet";

-- DropTable
DROP TABLE "OptionSetOption";

-- DropTable
DROP TABLE "OptionSetRule";

-- DropTable
DROP TABLE "OptionSetRuleToOption";

-- DropTable
DROP TABLE "OptionTag";

-- DropTable
DROP TABLE "OptionValue";

-- DropTable
DROP TABLE "_OptionToTag";

-- DropTable
DROP TABLE "option_layouts";

-- DropEnum
DROP TYPE "OptionType";

-- DropEnum
DROP TYPE "RuleActionType";

-- DropEnum
DROP TYPE "RuleConditionType";
