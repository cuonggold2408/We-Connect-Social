-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "reaction_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "comment_reactions" (
    "id" UUID NOT NULL,
    "type" "reaction_type" NOT NULL DEFAULT 'LIKE',
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_reactions_comment_id_type_idx" ON "comment_reactions"("comment_id", "type");

-- CreateIndex
CREATE INDEX "comment_reactions_comment_id_created_at_idx" ON "comment_reactions"("comment_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "comment_reactions_user_id_comment_id_key" ON "comment_reactions"("user_id", "comment_id");

-- AddForeignKey
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
