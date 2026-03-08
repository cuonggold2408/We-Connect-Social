-- DropIndex
DROP INDEX "reactions_post_id_idx";

-- DropIndex
DROP INDEX "reactions_user_id_idx";

-- CreateIndex
CREATE INDEX "reactions_post_id_type_idx" ON "reactions"("post_id", "type");

-- CreateIndex
CREATE INDEX "reactions_post_id_created_at_idx" ON "reactions"("post_id", "created_at" DESC);
