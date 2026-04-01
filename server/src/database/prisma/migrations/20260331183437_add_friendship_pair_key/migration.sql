/*
  Warnings:

  - A unique constraint covering the columns `[pair_key]` on the table `friendships` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pair_key` to the `friendships` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "friendships_receiver_id_status_idx";

-- DropIndex
DROP INDEX "friendships_sender_id_status_idx";

-- AlterTable
ALTER TABLE "friendships" ADD COLUMN     "accepted_at" TIMESTAMPTZ(6),
ADD COLUMN     "pair_key" VARCHAR(73) NOT NULL;

-- CreateIndex
CREATE INDEX "friendships_receiver_id_status_created_at_idx" ON "friendships"("receiver_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "friendships_sender_id_status_created_at_idx" ON "friendships"("sender_id", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "friendships_pair_key_key" ON "friendships"("pair_key");
