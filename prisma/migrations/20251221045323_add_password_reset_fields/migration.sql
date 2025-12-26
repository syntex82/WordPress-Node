/*
  Warnings:

  - A unique constraint covering the columns `[cartId,courseId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CartItemType" AS ENUM ('PRODUCT', 'COURSE');

-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('WELCOME', 'PASSWORD_RESET', 'ORDER_CONFIRMATION', 'COURSE_ENROLLMENT', 'NEWSLETTER', 'PROMOTIONAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM', 'USER_ACTION', 'CONTENT', 'SECURITY', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'DATABASE', 'MEDIA', 'THEMES', 'PLUGINS', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "DeveloperStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeveloperCategory" AS ENUM ('FRONTEND', 'BACKEND', 'FULLSTACK', 'WORDPRESS', 'MOBILE', 'DEVOPS', 'DESIGN', 'DATABASE', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "HiringRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketplaceTransactionType" AS ENUM ('ESCROW_DEPOSIT', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'PLATFORM_FEE', 'DEVELOPER_PAYOUT', 'DISPUTE_RESOLUTION');

-- CreateEnum
CREATE TYPE "MarketplaceTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_CLIENT', 'RESOLVED_DEVELOPER', 'CLOSED');

-- AlterEnum
ALTER TYPE "MenuItemType" ADD VALUE 'LOGIN';

-- AlterEnum
ALTER TYPE "SecurityEventType" ADD VALUE 'PASSWORD_RESET_REQUESTED';

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "itemType" "CartItemType" NOT NULL DEFAULT 'PRODUCT',
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "pricePaid" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "moduleId" TEXT;

-- AlterTable
ALTER TABLE "PageView" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "scrollDepth" INTEGER,
ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateTable
CREATE TABLE "CustomTheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "settings" JSONB NOT NULL,
    "customCSS" TEXT,
    "pages" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "previewUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceTheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "longDescription" TEXT,
    "version" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorEmail" TEXT,
    "authorUrl" TEXT,
    "thumbnailUrl" TEXT,
    "screenshotUrls" JSONB,
    "downloadUrl" TEXT,
    "demoUrl" TEXT,
    "repositoryUrl" TEXT,
    "fileSize" INTEGER,
    "category" TEXT NOT NULL DEFAULT 'blog',
    "tags" JSONB,
    "features" JSONB,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER,
    "minVersion" TEXT,
    "maxVersion" TEXT,
    "changelog" TEXT,
    "documentation" TEXT,
    "supportUrl" TEXT,
    "licenseType" TEXT DEFAULT 'GPL-2.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceThemeRating" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceThemeRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageCustomization" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "layout" TEXT,
    "showHeader" BOOLEAN NOT NULL DEFAULT true,
    "showFooter" BOOLEAN NOT NULL DEFAULT true,
    "showSidebar" BOOLEAN NOT NULL DEFAULT false,
    "customCSS" TEXT,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "headerStyle" TEXT,
    "footerStyle" TEXT,
    "featuredImagePosition" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCustomization" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "layout" TEXT,
    "showHeader" BOOLEAN NOT NULL DEFAULT true,
    "showFooter" BOOLEAN NOT NULL DEFAULT true,
    "showSidebar" BOOLEAN NOT NULL DEFAULT false,
    "showAuthor" BOOLEAN NOT NULL DEFAULT true,
    "showDate" BOOLEAN NOT NULL DEFAULT true,
    "showCategory" BOOLEAN NOT NULL DEFAULT true,
    "showTags" BOOLEAN NOT NULL DEFAULT true,
    "showRelatedPosts" BOOLEAN NOT NULL DEFAULT true,
    "relatedPostsCount" INTEGER NOT NULL DEFAULT 3,
    "customCSS" TEXT,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "featuredImagePosition" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeCustomizationImage" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "title" TEXT,
    "description" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "section" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "customData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeCustomizationImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeCustomizationBlock" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "content" TEXT,
    "richContent" JSONB,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "customCSS" TEXT,
    "layout" TEXT,
    "columns" INTEGER NOT NULL DEFAULT 1,
    "padding" TEXT,
    "margin" TEXT,
    "backgroundImage" TEXT,
    "featuredImage" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "customData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeCustomizationBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeCustomizationLink" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "target" TEXT NOT NULL DEFAULT '_self',
    "rel" TEXT,
    "title" TEXT,
    "className" TEXT,
    "customCSS" TEXT,
    "group" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeCustomizationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "label" TEXT,
    "value" DOUBLE PRECISION,
    "path" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country" TEXT,
    "city" TEXT,
    "referer" TEXT,
    "landingPage" TEXT,
    "exitPage" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoRedirect" (
    "id" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "type" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoSitemapEntry" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "priority" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "changefreq" TEXT NOT NULL DEFAULT 'weekly',
    "lastmod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoSitemapEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoSchemaMarkup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "scopeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoSchemaMarkup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoAuditLog" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "issues" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "participant1Id" TEXT NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "EmailTemplateType" NOT NULL DEFAULT 'CUSTOM',
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "recipientId" TEXT,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT,
    "textContent" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "providerMessageId" TEXT,
    "providerResponse" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "icon" TEXT,
    "iconColor" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "BackupType" NOT NULL DEFAULT 'FULL',
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "filePath" TEXT,
    "fileSize" BIGINT,
    "checksum" TEXT,
    "includesDatabase" BOOLEAN NOT NULL DEFAULT true,
    "includesMedia" BOOLEAN NOT NULL DEFAULT true,
    "includesThemes" BOOLEAN NOT NULL DEFAULT true,
    "includesPlugins" BOOLEAN NOT NULL DEFAULT true,
    "tablesCount" INTEGER,
    "recordsCount" INTEGER,
    "filesCount" INTEGER,
    "errorMessage" TEXT,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleId" TEXT,
    "createdById" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL,
    "cronExpression" TEXT,
    "hour" INTEGER NOT NULL DEFAULT 3,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "backupType" "BackupType" NOT NULL DEFAULT 'FULL',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "maxBackups" INTEGER NOT NULL DEFAULT 10,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePlugin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "longDescription" TEXT,
    "version" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorEmail" TEXT,
    "authorUrl" TEXT,
    "iconUrl" TEXT,
    "screenshotUrls" JSONB,
    "downloadUrl" TEXT,
    "repositoryUrl" TEXT,
    "fileSize" INTEGER,
    "category" TEXT NOT NULL DEFAULT 'utility',
    "tags" JSONB,
    "features" JSONB,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "activeInstalls" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER,
    "minVersion" TEXT,
    "maxVersion" TEXT,
    "testedUpTo" TEXT,
    "changelog" TEXT,
    "documentation" TEXT,
    "supportUrl" TEXT,
    "licenseType" TEXT DEFAULT 'MIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplacePlugin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePluginRating" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplacePluginRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "targetType" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "settings" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualRecommendation" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationCache" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationClick" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "clickedType" TEXT NOT NULL,
    "clickedId" TEXT NOT NULL,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Developer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "profileImage" TEXT,
    "coverImage" TEXT,
    "category" "DeveloperCategory" NOT NULL DEFAULT 'FULLSTACK',
    "skills" TEXT[],
    "languages" TEXT[],
    "frameworks" TEXT[],
    "tools" TEXT[],
    "spokenLanguages" TEXT[],
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "education" JSONB,
    "certifications" JSONB,
    "portfolio" JSONB,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "minimumBudget" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "availability" TEXT NOT NULL DEFAULT 'available',
    "availableHours" INTEGER NOT NULL DEFAULT 40,
    "timezone" TEXT,
    "status" "DeveloperStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "projectsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "responseTime" INTEGER,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "websiteUrl" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "applicationNote" TEXT,
    "rejectionReason" TEXT,
    "suspensionReason" TEXT,
    "stripeConnectId" TEXT,
    "stripeAccountStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Developer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "attachments" JSONB,
    "budgetType" TEXT NOT NULL DEFAULT 'fixed',
    "budgetAmount" DECIMAL(10,2) NOT NULL,
    "estimatedHours" INTEGER,
    "deadline" TIMESTAMP(3),
    "status" "HiringRequestStatus" NOT NULL DEFAULT 'PENDING',
    "responseMessage" TEXT,
    "respondedAt" TIMESTAMP(3),
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiringRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "deliverables" JSONB,
    "budgetType" TEXT NOT NULL DEFAULT 'fixed',
    "totalBudget" DECIMAL(10,2) NOT NULL,
    "hourlyRate" DECIMAL(10,2),
    "hoursLogged" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amountInEscrow" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "startDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "milestones" JSONB,
    "files" JSONB,
    "clientRating" INTEGER,
    "clientReview" TEXT,
    "developerRating" INTEGER,
    "developerReview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMessage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceTransaction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "MarketplaceTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "status" "MarketplaceTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "stripeTransferId" TEXT,
    "stripeChargeId" TEXT,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperReview" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "projectId" TEXT,
    "overallRating" INTEGER NOT NULL,
    "communicationRating" INTEGER,
    "qualityRating" INTEGER,
    "timelinessRating" INTEGER,
    "valueRating" INTEGER,
    "title" TEXT,
    "content" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperPayout" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "stripePayoutId" TEXT,
    "stripeTransferId" TEXT,
    "payoutMethod" TEXT NOT NULL DEFAULT 'stripe',
    "accountLast4" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDispute" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "initiatorType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomTheme_name_key" ON "CustomTheme"("name");

-- CreateIndex
CREATE INDEX "CustomTheme_isActive_idx" ON "CustomTheme"("isActive");

-- CreateIndex
CREATE INDEX "CustomTheme_createdById_idx" ON "CustomTheme"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceTheme_slug_key" ON "MarketplaceTheme"("slug");

-- CreateIndex
CREATE INDEX "MarketplaceTheme_status_idx" ON "MarketplaceTheme"("status");

-- CreateIndex
CREATE INDEX "MarketplaceTheme_category_idx" ON "MarketplaceTheme"("category");

-- CreateIndex
CREATE INDEX "MarketplaceTheme_isFeatured_idx" ON "MarketplaceTheme"("isFeatured");

-- CreateIndex
CREATE INDEX "MarketplaceTheme_downloads_idx" ON "MarketplaceTheme"("downloads");

-- CreateIndex
CREATE INDEX "MarketplaceTheme_rating_idx" ON "MarketplaceTheme"("rating");

-- CreateIndex
CREATE INDEX "MarketplaceTheme_submittedById_idx" ON "MarketplaceTheme"("submittedById");

-- CreateIndex
CREATE INDEX "MarketplaceThemeRating_themeId_idx" ON "MarketplaceThemeRating"("themeId");

-- CreateIndex
CREATE INDEX "MarketplaceThemeRating_userId_idx" ON "MarketplaceThemeRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceThemeRating_themeId_userId_key" ON "MarketplaceThemeRating"("themeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PageCustomization_pageId_key" ON "PageCustomization"("pageId");

-- CreateIndex
CREATE INDEX "PageCustomization_pageId_idx" ON "PageCustomization"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PostCustomization_postId_key" ON "PostCustomization"("postId");

-- CreateIndex
CREATE INDEX "PostCustomization_postId_idx" ON "PostCustomization"("postId");

-- CreateIndex
CREATE INDEX "ThemeCustomizationImage_themeId_idx" ON "ThemeCustomizationImage"("themeId");

-- CreateIndex
CREATE INDEX "ThemeCustomizationImage_type_idx" ON "ThemeCustomizationImage"("type");

-- CreateIndex
CREATE INDEX "ThemeCustomizationImage_section_idx" ON "ThemeCustomizationImage"("section");

-- CreateIndex
CREATE INDEX "ThemeCustomizationBlock_themeId_idx" ON "ThemeCustomizationBlock"("themeId");

-- CreateIndex
CREATE INDEX "ThemeCustomizationBlock_type_idx" ON "ThemeCustomizationBlock"("type");

-- CreateIndex
CREATE INDEX "ThemeCustomizationBlock_position_idx" ON "ThemeCustomizationBlock"("position");

-- CreateIndex
CREATE INDEX "ThemeCustomizationLink_themeId_idx" ON "ThemeCustomizationLink"("themeId");

-- CreateIndex
CREATE INDEX "ThemeCustomizationLink_type_idx" ON "ThemeCustomizationLink"("type");

-- CreateIndex
CREATE INDEX "ThemeCustomizationLink_group_idx" ON "ThemeCustomizationLink"("group");

-- CreateIndex
CREATE INDEX "ThemeCustomizationLink_position_idx" ON "ThemeCustomizationLink"("position");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_category_idx" ON "AnalyticsEvent"("category");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_action_idx" ON "AnalyticsEvent"("action");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_userId_idx" ON "AnalyticsSession"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsSession_startedAt_idx" ON "AnalyticsSession"("startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_isActive_idx" ON "AnalyticsSession"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SeoRedirect_fromPath_key" ON "SeoRedirect"("fromPath");

-- CreateIndex
CREATE INDEX "SeoRedirect_fromPath_idx" ON "SeoRedirect"("fromPath");

-- CreateIndex
CREATE INDEX "SeoRedirect_isActive_idx" ON "SeoRedirect"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SeoSitemapEntry_url_key" ON "SeoSitemapEntry"("url");

-- CreateIndex
CREATE INDEX "SeoSitemapEntry_isActive_idx" ON "SeoSitemapEntry"("isActive");

-- CreateIndex
CREATE INDEX "SeoSchemaMarkup_type_idx" ON "SeoSchemaMarkup"("type");

-- CreateIndex
CREATE INDEX "SeoSchemaMarkup_scope_idx" ON "SeoSchemaMarkup"("scope");

-- CreateIndex
CREATE INDEX "SeoSchemaMarkup_isActive_idx" ON "SeoSchemaMarkup"("isActive");

-- CreateIndex
CREATE INDEX "SeoAuditLog_contentType_contentId_idx" ON "SeoAuditLog"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "SeoAuditLog_createdAt_idx" ON "SeoAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Conversation_participant1Id_idx" ON "Conversation"("participant1Id");

-- CreateIndex
CREATE INDEX "Conversation_participant2Id_idx" ON "Conversation"("participant2Id");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_participant1Id_participant2Id_key" ON "Conversation"("participant1Id", "participant2Id");

-- CreateIndex
CREATE INDEX "DirectMessage_conversationId_idx" ON "DirectMessage"("conversationId");

-- CreateIndex
CREATE INDEX "DirectMessage_senderId_idx" ON "DirectMessage"("senderId");

-- CreateIndex
CREATE INDEX "DirectMessage_createdAt_idx" ON "DirectMessage"("createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_isRead_idx" ON "DirectMessage"("isRead");

-- CreateIndex
CREATE INDEX "CourseModule_courseId_idx" ON "CourseModule"("courseId");

-- CreateIndex
CREATE INDEX "CourseModule_orderIndex_idx" ON "CourseModule"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_slug_key" ON "EmailTemplate"("slug");

-- CreateIndex
CREATE INDEX "EmailTemplate_type_idx" ON "EmailTemplate"("type");

-- CreateIndex
CREATE INDEX "EmailTemplate_slug_idx" ON "EmailTemplate"("slug");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailLog_templateId_idx" ON "EmailLog"("templateId");

-- CreateIndex
CREATE INDEX "EmailLog_recipientId_idx" ON "EmailLog"("recipientId");

-- CreateIndex
CREATE INDEX "EmailLog_toEmail_idx" ON "EmailLog"("toEmail");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Backup_status_idx" ON "Backup"("status");

-- CreateIndex
CREATE INDEX "Backup_type_idx" ON "Backup"("type");

-- CreateIndex
CREATE INDEX "Backup_createdAt_idx" ON "Backup"("createdAt");

-- CreateIndex
CREATE INDEX "Backup_createdById_idx" ON "Backup"("createdById");

-- CreateIndex
CREATE INDEX "BackupSchedule_isActive_idx" ON "BackupSchedule"("isActive");

-- CreateIndex
CREATE INDEX "BackupSchedule_nextRunAt_idx" ON "BackupSchedule"("nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePlugin_slug_key" ON "MarketplacePlugin"("slug");

-- CreateIndex
CREATE INDEX "MarketplacePlugin_status_idx" ON "MarketplacePlugin"("status");

-- CreateIndex
CREATE INDEX "MarketplacePlugin_category_idx" ON "MarketplacePlugin"("category");

-- CreateIndex
CREATE INDEX "MarketplacePlugin_isFeatured_idx" ON "MarketplacePlugin"("isFeatured");

-- CreateIndex
CREATE INDEX "MarketplacePlugin_downloads_idx" ON "MarketplacePlugin"("downloads");

-- CreateIndex
CREATE INDEX "MarketplacePlugin_rating_idx" ON "MarketplacePlugin"("rating");

-- CreateIndex
CREATE INDEX "MarketplacePlugin_submittedById_idx" ON "MarketplacePlugin"("submittedById");

-- CreateIndex
CREATE INDEX "MarketplacePluginRating_pluginId_idx" ON "MarketplacePluginRating"("pluginId");

-- CreateIndex
CREATE INDEX "MarketplacePluginRating_userId_idx" ON "MarketplacePluginRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePluginRating_pluginId_userId_key" ON "MarketplacePluginRating"("pluginId", "userId");

-- CreateIndex
CREATE INDEX "UserInteraction_userId_idx" ON "UserInteraction"("userId");

-- CreateIndex
CREATE INDEX "UserInteraction_sessionId_idx" ON "UserInteraction"("sessionId");

-- CreateIndex
CREATE INDEX "UserInteraction_contentType_contentId_idx" ON "UserInteraction"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "UserInteraction_interactionType_idx" ON "UserInteraction"("interactionType");

-- CreateIndex
CREATE INDEX "UserInteraction_createdAt_idx" ON "UserInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "RecommendationRule_sourceType_sourceId_idx" ON "RecommendationRule"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "RecommendationRule_targetType_idx" ON "RecommendationRule"("targetType");

-- CreateIndex
CREATE INDEX "RecommendationRule_algorithm_idx" ON "RecommendationRule"("algorithm");

-- CreateIndex
CREATE INDEX "RecommendationRule_isActive_idx" ON "RecommendationRule"("isActive");

-- CreateIndex
CREATE INDEX "RecommendationRule_priority_idx" ON "RecommendationRule"("priority");

-- CreateIndex
CREATE INDEX "ManualRecommendation_ruleId_idx" ON "ManualRecommendation"("ruleId");

-- CreateIndex
CREATE INDEX "ManualRecommendation_contentType_contentId_idx" ON "ManualRecommendation"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "RecommendationCache_expiresAt_idx" ON "RecommendationCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationCache_sourceType_sourceId_targetType_algorith_key" ON "RecommendationCache"("sourceType", "sourceId", "targetType", "algorithm");

-- CreateIndex
CREATE INDEX "RecommendationClick_userId_idx" ON "RecommendationClick"("userId");

-- CreateIndex
CREATE INDEX "RecommendationClick_createdAt_idx" ON "RecommendationClick"("createdAt");

-- CreateIndex
CREATE INDEX "RecommendationClick_recommendationType_idx" ON "RecommendationClick"("recommendationType");

-- CreateIndex
CREATE INDEX "RecommendationClick_sourceType_sourceId_idx" ON "RecommendationClick"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationSettings_key_key" ON "RecommendationSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Developer_userId_key" ON "Developer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Developer_slug_key" ON "Developer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Developer_stripeConnectId_key" ON "Developer"("stripeConnectId");

-- CreateIndex
CREATE INDEX "Developer_status_idx" ON "Developer"("status");

-- CreateIndex
CREATE INDEX "Developer_category_idx" ON "Developer"("category");

-- CreateIndex
CREATE INDEX "Developer_rating_idx" ON "Developer"("rating");

-- CreateIndex
CREATE INDEX "Developer_isFeatured_idx" ON "Developer"("isFeatured");

-- CreateIndex
CREATE INDEX "Developer_availability_idx" ON "Developer"("availability");

-- CreateIndex
CREATE INDEX "Developer_slug_idx" ON "Developer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HiringRequest_projectId_key" ON "HiringRequest"("projectId");

-- CreateIndex
CREATE INDEX "HiringRequest_clientId_idx" ON "HiringRequest"("clientId");

-- CreateIndex
CREATE INDEX "HiringRequest_developerId_idx" ON "HiringRequest"("developerId");

-- CreateIndex
CREATE INDEX "HiringRequest_status_idx" ON "HiringRequest"("status");

-- CreateIndex
CREATE INDEX "HiringRequest_createdAt_idx" ON "HiringRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");

-- CreateIndex
CREATE INDEX "Project_developerId_idx" ON "Project"("developerId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectMessage_projectId_idx" ON "ProjectMessage"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMessage_senderId_idx" ON "ProjectMessage"("senderId");

-- CreateIndex
CREATE INDEX "ProjectMessage_createdAt_idx" ON "ProjectMessage"("createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_projectId_idx" ON "MarketplaceTransaction"("projectId");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_type_idx" ON "MarketplaceTransaction"("type");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_status_idx" ON "MarketplaceTransaction"("status");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_createdAt_idx" ON "MarketplaceTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "DeveloperReview_developerId_idx" ON "DeveloperReview"("developerId");

-- CreateIndex
CREATE INDEX "DeveloperReview_reviewerId_idx" ON "DeveloperReview"("reviewerId");

-- CreateIndex
CREATE INDEX "DeveloperReview_overallRating_idx" ON "DeveloperReview"("overallRating");

-- CreateIndex
CREATE INDEX "DeveloperReview_isApproved_idx" ON "DeveloperReview"("isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperReview_developerId_reviewerId_projectId_key" ON "DeveloperReview"("developerId", "reviewerId", "projectId");

-- CreateIndex
CREATE INDEX "DeveloperPayout_developerId_idx" ON "DeveloperPayout"("developerId");

-- CreateIndex
CREATE INDEX "DeveloperPayout_status_idx" ON "DeveloperPayout"("status");

-- CreateIndex
CREATE INDEX "DeveloperPayout_requestedAt_idx" ON "DeveloperPayout"("requestedAt");

-- CreateIndex
CREATE INDEX "ProjectDispute_projectId_idx" ON "ProjectDispute"("projectId");

-- CreateIndex
CREATE INDEX "ProjectDispute_status_idx" ON "ProjectDispute"("status");

-- CreateIndex
CREATE INDEX "ProjectDispute_createdAt_idx" ON "ProjectDispute"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceSettings_key_key" ON "MarketplaceSettings"("key");

-- CreateIndex
CREATE INDEX "CartItem_courseId_idx" ON "CartItem"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_courseId_key" ON "CartItem"("cartId", "courseId");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- CreateIndex
CREATE INDEX "PageView_sessionId_idx" ON "PageView"("sessionId");

-- CreateIndex
CREATE INDEX "PageView_device_idx" ON "PageView"("device");

-- CreateIndex
CREATE INDEX "PageView_country_idx" ON "PageView"("country");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- AddForeignKey
ALTER TABLE "CustomTheme" ADD CONSTRAINT "CustomTheme_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTheme" ADD CONSTRAINT "MarketplaceTheme_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTheme" ADD CONSTRAINT "MarketplaceTheme_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceThemeRating" ADD CONSTRAINT "MarketplaceThemeRating_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "MarketplaceTheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceThemeRating" ADD CONSTRAINT "MarketplaceThemeRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageCustomization" ADD CONSTRAINT "PageCustomization_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCustomization" ADD CONSTRAINT "PostCustomization_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeCustomizationImage" ADD CONSTRAINT "ThemeCustomizationImage_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeCustomizationBlock" ADD CONSTRAINT "ThemeCustomizationBlock_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeCustomizationLink" ADD CONSTRAINT "ThemeCustomizationLink_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backup" ADD CONSTRAINT "Backup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePlugin" ADD CONSTRAINT "MarketplacePlugin_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePlugin" ADD CONSTRAINT "MarketplacePlugin_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePluginRating" ADD CONSTRAINT "MarketplacePluginRating_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "MarketplacePlugin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePluginRating" ADD CONSTRAINT "MarketplacePluginRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualRecommendation" ADD CONSTRAINT "ManualRecommendation_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RecommendationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationClick" ADD CONSTRAINT "RecommendationClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Developer" ADD CONSTRAINT "Developer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringRequest" ADD CONSTRAINT "HiringRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringRequest" ADD CONSTRAINT "HiringRequest_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_id_fkey" FOREIGN KEY ("id") REFERENCES "HiringRequest"("projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMessage" ADD CONSTRAINT "ProjectMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceTransaction" ADD CONSTRAINT "MarketplaceTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperReview" ADD CONSTRAINT "DeveloperReview_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperReview" ADD CONSTRAINT "DeveloperReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperPayout" ADD CONSTRAINT "DeveloperPayout_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDispute" ADD CONSTRAINT "ProjectDispute_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
