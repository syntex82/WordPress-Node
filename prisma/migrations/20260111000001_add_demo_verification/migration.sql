-- CreateEnum
CREATE TYPE "DemoVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'BLOCKED', 'COMPLETED');

-- CreateTable
CREATE TABLE "DemoVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "preferredSubdomain" TEXT,
    "token" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "status" "DemoVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "demoInstanceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "emailSentCount" INTEGER NOT NULL DEFAULT 1,
    "lastEmailSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemoVerification_token_key" ON "DemoVerification"("token");

-- CreateIndex
CREATE INDEX "DemoVerification_email_idx" ON "DemoVerification"("email");

-- CreateIndex
CREATE INDEX "DemoVerification_token_idx" ON "DemoVerification"("token");

-- CreateIndex
CREATE INDEX "DemoVerification_status_idx" ON "DemoVerification"("status");

-- CreateIndex
CREATE INDEX "DemoVerification_createdAt_idx" ON "DemoVerification"("createdAt");

-- CreateIndex
CREATE INDEX "DemoVerification_tokenExpiresAt_idx" ON "DemoVerification"("tokenExpiresAt");

