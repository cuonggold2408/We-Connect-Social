-- CreateEnum
CREATE TYPE "friendship_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'UNFRIEND');

-- AlterTable
ALTER TABLE "post_images" ALTER COLUMN "image_url" SET DATA TYPE VARCHAR(500);

-- CreateTable
CREATE TABLE "friendships" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "status" "friendship_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "friendships_receiver_id_idx" ON "friendships"("receiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_sender_id_receiver_id_key" ON "friendships"("sender_id", "receiver_id");

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
