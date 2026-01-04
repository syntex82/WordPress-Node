-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MENTION';
ALTER TYPE "NotificationType" ADD VALUE 'POST_LIKED';
ALTER TYPE "NotificationType" ADD VALUE 'POST_COMMENT';
ALTER TYPE "NotificationType" ADD VALUE 'POST_SHARED';
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW';

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "secondaryColor" TEXT NOT NULL DEFAULT '#a5b4fc',
    "backgroundColor" TEXT NOT NULL DEFAULT '#f8fafc',
    "textColor" TEXT NOT NULL DEFAULT '#1e293b',
    "accentColor" TEXT NOT NULL DEFAULT '#6366f1',
    "titleFont" TEXT NOT NULL DEFAULT 'Helvetica-Bold',
    "bodyFont" TEXT NOT NULL DEFAULT 'Helvetica',
    "titleFontSize" INTEGER NOT NULL DEFAULT 42,
    "nameFontSize" INTEGER NOT NULL DEFAULT 36,
    "courseFontSize" INTEGER NOT NULL DEFAULT 28,
    "bodyFontSize" INTEGER NOT NULL DEFAULT 14,
    "titleText" TEXT NOT NULL DEFAULT 'Certificate of Completion',
    "subtitleText" TEXT NOT NULL DEFAULT 'This is to certify that',
    "completionText" TEXT NOT NULL DEFAULT 'has successfully completed the course',
    "brandingText" TEXT NOT NULL DEFAULT 'NodePress LMS',
    "showBorder" BOOLEAN NOT NULL DEFAULT true,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showBranding" BOOLEAN NOT NULL DEFAULT true,
    "borderWidth" INTEGER NOT NULL DEFAULT 3,
    "borderStyle" TEXT NOT NULL DEFAULT 'double',
    "customCSS" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertificateTemplate_isDefault_idx" ON "CertificateTemplate"("isDefault");
