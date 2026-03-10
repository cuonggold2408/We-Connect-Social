-- CreateEnum
CREATE TYPE "post_visibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- DropIndex
DROP INDEX "posts_author_id_idx";

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "visibility" "post_visibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "posts_author_id_created_at_idx" ON "posts"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_visibility_reaction_count_idx" ON "posts"("visibility", "reaction_count" DESC);
