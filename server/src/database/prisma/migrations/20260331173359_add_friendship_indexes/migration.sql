-- DropIndex
DROP INDEX "friendships_receiver_id_idx";

-- CreateIndex
CREATE INDEX "friendships_receiver_id_status_idx" ON "friendships"("receiver_id", "status");

-- CreateIndex
CREATE INDEX "friendships_sender_id_status_idx" ON "friendships"("sender_id", "status");
