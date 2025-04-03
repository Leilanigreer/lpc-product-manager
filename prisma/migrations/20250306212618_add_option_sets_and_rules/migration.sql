-- CreateEnum
CREATE TYPE "RuleConditionType" AS ENUM ('ANY', 'ALL');

-- CreateEnum
CREATE TYPE "RuleActionType" AS ENUM ('SHOW', 'HIDE');

-- AlterTable
ALTER TABLE "OptionValue" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "displayOrder" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OptionSet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "collectionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionSetRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "optionSetId" TEXT NOT NULL,
    "conditionType" "RuleConditionType" NOT NULL,
    "conditions" JSONB NOT NULL,
    "action" "RuleActionType" NOT NULL,
    "actionTargets" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionSetRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionSetRuleToOption" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "optionSetOptionId" TEXT NOT NULL,

    CONSTRAINT "OptionSetRuleToOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionSetOption" (
    "id" TEXT NOT NULL,
    "optionSetId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OptionSetOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptionSetRule_optionSetId_idx" ON "OptionSetRule"("optionSetId");

-- CreateIndex
CREATE INDEX "OptionSetRuleToOption_ruleId_idx" ON "OptionSetRuleToOption"("ruleId");

-- CreateIndex
CREATE INDEX "OptionSetRuleToOption_optionSetOptionId_idx" ON "OptionSetRuleToOption"("optionSetOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "OptionSetRuleToOption_ruleId_optionSetOptionId_key" ON "OptionSetRuleToOption"("ruleId", "optionSetOptionId");

-- CreateIndex
CREATE INDEX "OptionSetOption_optionSetId_idx" ON "OptionSetOption"("optionSetId");

-- CreateIndex
CREATE INDEX "OptionSetOption_optionId_idx" ON "OptionSetOption"("optionId");

-- AddForeignKey
ALTER TABLE "OptionSet" ADD CONSTRAINT "OptionSet_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ShopifyCollections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionSetRule" ADD CONSTRAINT "OptionSetRule_optionSetId_fkey" FOREIGN KEY ("optionSetId") REFERENCES "OptionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionSetRuleToOption" ADD CONSTRAINT "OptionSetRuleToOption_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "OptionSetRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionSetRuleToOption" ADD CONSTRAINT "OptionSetRuleToOption_optionSetOptionId_fkey" FOREIGN KEY ("optionSetOptionId") REFERENCES "OptionSetOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionSetOption" ADD CONSTRAINT "OptionSetOption_optionSetId_fkey" FOREIGN KEY ("optionSetId") REFERENCES "OptionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionSetOption" ADD CONSTRAINT "OptionSetOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
