-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "language_code" TEXT,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "is_premium" BOOLEAN,
    "initial_channels_required" INTEGER NOT NULL DEFAULT 2,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "daily_requests" INTEGER NOT NULL DEFAULT 0,
    "last_request_date" TIMESTAMP(3),
    "openai_thread_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");
