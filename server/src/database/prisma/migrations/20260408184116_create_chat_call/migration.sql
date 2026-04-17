-- CreateEnum
CREATE TYPE "message_type" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'CALL_LOG');

-- CreateEnum
CREATE TYPE "call_status" AS ENUM ('RINGING', 'ACCEPTED', 'REJECTED', 'MISSED', 'ENDED', 'FAILED');

-- CreateEnum
CREATE TYPE "call_type" AS ENUM ('AUDIO', 'VIDEO');

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "last_message_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "last_read_at" TIMESTAMPTZ(6),
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT,
    "type" "message_type" NOT NULL DEFAULT 'TEXT',
    "file_url" VARCHAR(500),
    "file_name" VARCHAR(255),
    "file_size" INTEGER,
    "call_session_id" UUID,
    "reply_to_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_sessions" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "caller_id" UUID NOT NULL,
    "callee_id" UUID NOT NULL,
    "type" "call_type" NOT NULL DEFAULT 'VIDEO',
    "status" "call_status" NOT NULL DEFAULT 'RINGING',
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "duration" INTEGER,
    "end_reason" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_call_session_id_key" ON "messages"("call_session_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "call_sessions_caller_id_idx" ON "call_sessions"("caller_id");

-- CreateIndex
CREATE INDEX "call_sessions_callee_id_idx" ON "call_sessions"("callee_id");

-- CreateIndex
CREATE INDEX "call_sessions_conversation_id_created_at_idx" ON "call_sessions"("conversation_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_call_session_id_fkey" FOREIGN KEY ("call_session_id") REFERENCES "call_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_caller_id_fkey" FOREIGN KEY ("caller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_callee_id_fkey" FOREIGN KEY ("callee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
