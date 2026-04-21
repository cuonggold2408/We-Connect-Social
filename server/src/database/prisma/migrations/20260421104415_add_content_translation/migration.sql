-- CreateEnum
CREATE TYPE "TranslatableEntity" AS ENUM ('POST', 'COMMENT', 'MESSAGE');

-- CreateEnum
CREATE TYPE "AutoTranslateMode" AS ENUM ('ON_HOVER', 'ALWAYS_BUTTON', 'OFF');

-- CreateTable
CREATE TABLE "content_translations" (
    "id" UUID NOT NULL,
    "entityType" "TranslatableEntity" NOT NULL,
    "entityId" UUID NOT NULL,
    "sourceLang" VARCHAR(10) NOT NULL,
    "targetLang" VARCHAR(10) NOT NULL,
    "sourceTextHash" VARCHAR(16) NOT NULL,
    "translatedText" TEXT NOT NULL,
    "provider" VARCHAR(30) NOT NULL,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "content_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_translations_sourceTextHash_targetLang_idx" ON "content_translations"("sourceTextHash", "targetLang");

-- CreateIndex
CREATE UNIQUE INDEX "content_translations_entityType_entityId_targetLang_key" ON "content_translations"("entityType", "entityId", "targetLang");
