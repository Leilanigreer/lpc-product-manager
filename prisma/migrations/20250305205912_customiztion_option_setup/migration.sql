-- CreateTable
CREATE TABLE "OptionLayout" (
    "id" TEXT NOT NULL,
    "Type" TEXT NOT NULL,
    "OptionName" BOOLEAN NOT NULL,
    "Nickname" BOOLEAN NOT NULL,
    "Required" BOOLEAN NOT NULL,
    "Description" BOOLEAN NOT NULL,
    "InCartName" BOOLEAN NOT NULL,
    "Sku" BOOLEAN NOT NULL,
    "AllowedTypes" BOOLEAN NOT NULL,
    "MinSelection" BOOLEAN NOT NULL,
    "MaxSelection" BOOLEAN NOT NULL,
    "Default" BOOLEAN NOT NULL,
    "Image" BOOLEAN NOT NULL,
    "AllowMultiple" BOOLEAN NOT NULL,
    "Color" BOOLEAN NOT NULL,
    "Placeholder" BOOLEAN NOT NULL,
    "MinCharacters" BOOLEAN NOT NULL,
    "MaxCharacters" BOOLEAN NOT NULL,
    "MinNumber" BOOLEAN NOT NULL,
    "MaxNumber" BOOLEAN NOT NULL,
    "OptionValues" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "required" BOOLEAN NOT NULL,
    "description" TEXT,
    "inCartName" TEXT,
    "allowedTypes" TEXT,
    "minSelection" INTEGER,
    "maxSelection" INTEGER,
    "allowMultiple" BOOLEAN,
    "placeholderText" TEXT,
    "minCharacters" INTEGER,
    "maxCharacters" INTEGER,
    "minNumber" INTEGER,
    "maxNumber" INTEGER,
    "layoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionValue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "sku" TEXT,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "OptionLayout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionValue" ADD CONSTRAINT "OptionValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
