/**
 * Advanced Fraud Detection Service for PPC Ads
 * Detects click fraud, bot traffic, and suspicious patterns
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface FraudSignal {
  type: string;
  score: number;
  details: string;
}

export interface FraudAnalysis {
  isFraudulent: boolean;
  fraudScore: number; // 0-100
  signals: FraudSignal[];
  action: 'allow' | 'flag' | 'block';
}

interface ClickContext {
  adId: string;
  impressionId?: string;
  sessionId?: string;
  visitorId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  device?: string;
  referer?: string;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  // Known bot user agents
  private readonly botPatterns = [
    /bot|crawler|spider|scraper|curl|wget|python|java|ruby/i,
    /headless|phantom|selenium|puppeteer|playwright/i,
    /googlebot|bingbot|yandex|baidu|duckduck/i,
  ];

  // Suspicious IP ranges (simplified - in production use GeoIP database)
  private readonly suspiciousPatterns = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
  ];

  constructor(private readonly prisma: PrismaService) {}

  async analyzeClick(context: ClickContext): Promise<FraudAnalysis> {
    const signals: FraudSignal[] = [];
    let totalScore = 0;

    // Check bot user agent
    const botScore = this.checkBotUserAgent(context.userAgent);
    if (botScore > 0) {
      signals.push({ type: 'bot_detection', score: botScore, details: 'Bot-like user agent detected' });
      totalScore += botScore;
    }

    // Check click frequency
    const frequencyScore = await this.checkClickFrequency(context);
    if (frequencyScore > 0) {
      signals.push({ type: 'high_frequency', score: frequencyScore, details: 'Abnormal click frequency' });
      totalScore += frequencyScore;
    }

    // Check duplicate clicks
    const duplicateScore = await this.checkDuplicateClick(context);
    if (duplicateScore > 0) {
      signals.push({ type: 'duplicate_click', score: duplicateScore, details: 'Duplicate click detected' });
      totalScore += duplicateScore;
    }

    // Check session consistency
    const sessionScore = await this.checkSessionConsistency(context);
    if (sessionScore > 0) {
      signals.push({ type: 'session_anomaly', score: sessionScore, details: 'Session behavior anomaly' });
      totalScore += sessionScore;
    }

    // Check device fingerprint consistency
    const fingerprintScore = this.checkFingerprintConsistency(context);
    if (fingerprintScore > 0) {
      signals.push({ type: 'fingerprint_mismatch', score: fingerprintScore, details: 'Device fingerprint inconsistency' });
      totalScore += fingerprintScore;
    }

    // Check IP reputation
    const ipScore = await this.checkIPReputation(context.ip);
    if (ipScore > 0) {
      signals.push({ type: 'suspicious_ip', score: ipScore, details: 'IP has suspicious history' });
      totalScore += ipScore;
    }

    // Normalize score to 0-100
    const normalizedScore = Math.min(100, totalScore);

    // Determine action
    let action: 'allow' | 'flag' | 'block' = 'allow';
    if (normalizedScore >= 80) action = 'block';
    else if (normalizedScore >= 50) action = 'flag';

    return {
      isFraudulent: normalizedScore >= 50,
      fraudScore: normalizedScore,
      signals,
      action,
    };
  }

  private checkBotUserAgent(userAgent?: string): number {
    if (!userAgent) return 20;
    if (userAgent.length < 20) return 30;
    for (const pattern of this.botPatterns) {
      if (pattern.test(userAgent)) return 90;
    }
    return 0;
  }

  private async checkClickFrequency(context: ClickContext): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const where: any = { adId: context.adId, createdAt: { gte: fiveMinutesAgo } };
    if (context.sessionId) where.sessionId = context.sessionId;
    else if (context.ip) where.ip = context.ip;

    const recentClicks = await this.prisma.adClick.count({ where });

    if (recentClicks >= 10) return 80;
    if (recentClicks >= 5) return 50;
    if (recentClicks >= 3) return 20;
    return 0;
  }

  private async checkDuplicateClick(context: ClickContext): Promise<number> {
    if (!context.impressionId) return 0;
    const existing = await this.prisma.adClick.findFirst({
      where: { adId: context.adId, impressionId: context.impressionId },
    });
    return existing ? 70 : 0;
  }

  private async checkSessionConsistency(context: ClickContext): Promise<number> {
    if (!context.sessionId) return 10;
    const sessionClicks = await this.prisma.adClick.findMany({
      where: { sessionId: context.sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    if (sessionClicks.length < 2) return 0;
    const uniqueAds = new Set(sessionClicks.map(c => c.adId)).size;
    if (uniqueAds === 1 && sessionClicks.length >= 5) return 40;
    return 0;
  }

  private checkFingerprintConsistency(context: ClickContext): number {
    if (!context.userAgent || !context.device) return 0;
    const uaDevice = context.userAgent.toLowerCase();
    if (context.device === 'mobile' && !/(mobile|android|iphone)/i.test(uaDevice)) return 30;
    if (context.device === 'desktop' && /(mobile|android|iphone)/i.test(uaDevice)) return 30;
    return 0;
  }

  private async checkIPReputation(ip?: string): Promise<number> {
    if (!ip) return 5;
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(ip)) return 15;
    }
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const fraudulentFromIP = await this.prisma.adClick.count({
      where: { ip, isFraudulent: true, createdAt: { gte: hourAgo } },
    });
    if (fraudulentFromIP >= 5) return 60;
    if (fraudulentFromIP >= 2) return 30;
    return 0;
  }
}

