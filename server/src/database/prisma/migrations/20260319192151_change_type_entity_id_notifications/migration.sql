/*
  Warnings:

  - Changed the type of `entity_id` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "entity_id",
ADD COLUMN     "entity_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_actor_id_entity_type_entity_id_idx" ON "notifications"("actor_id", "entity_type", "entity_id");
