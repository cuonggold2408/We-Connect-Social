-- AlterTable
ALTER TABLE "users" ALTER COLUMN "last_active_at" DROP NOT NULL,
ALTER COLUMN "last_active_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "access_users" (
    "id" UUID NOT NULL,
    "refresh_token" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "device_info" VARCHAR(150),
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "access_users_refresh_token_key" ON "access_users"("refresh_token");

-- CreateIndex
CREATE INDEX "access_users_user_id_idx" ON "access_users"("user_id");

-- CreateIndex
CREATE INDEX "access_users_refresh_token_idx" ON "access_users"("refresh_token");

-- AddForeignKey
ALTER TABLE "access_users" ADD CONSTRAINT "access_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
