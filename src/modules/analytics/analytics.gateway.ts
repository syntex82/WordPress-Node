/**
 * Analytics Gateway - Real-time Analytics WebSocket
 * Provides live visitor tracking and real-time dashboard updates
 */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface VisitorData {
  sessionId: string;
  visitorId?: string;
  path: string;
  title?: string;
  referrer?: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  scrollDepth?: number;
}

interface RealTimeStats {
  activeVisitors: number;
  pageViewsLastMinute: number;
  topPagesNow: Array<{ path: string; count: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  countryBreakdown: Array<{ country: string; count: number }>;
  recentEvents: Array<{ category: string; action: string; path: string; time: Date }>;
  trafficSources: Array<{ source: string; count: number }>;
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/analytics',
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);
  private adminClients: Map<string, Socket> = new Map();
  private visitorSockets: Map<string, string> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      const isVisitor = client.handshake.query?.type === 'visitor';

      if (isVisitor) {
        const sessionId = client.handshake.query?.sessionId as string;
        if (sessionId) {
          this.visitorSockets.set(client.id, sessionId);
          this.logger.debug(`Visitor connected: ${sessionId}`);
        }
      } else if (token) {
        const decoded = this.jwtService.verify(token);
        if (decoded?.role === 'ADMIN' || decoded?.role === 'SUPER_ADMIN') {
          this.adminClients.set(client.id, client);
          client.join('admin-dashboard');
          this.logger.log(`Admin connected to analytics: ${decoded.email}`);
          const stats = await this.getRealTimeStats();
          client.emit('realtime:update', stats);
        }
      }
    } catch (error) {
      this.logger.warn(`Connection failed: ${error.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    const sessionId = this.visitorSockets.get(client.id);
    if (sessionId) {
      this.visitorSockets.delete(client.id);
      this.updateVisitorStatus(sessionId, false);
      this.broadcastToAdmins();
    }
    this.adminClients.delete(client.id);
  }

  @SubscribeMessage('visitor:heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket, @MessageBody() data: VisitorData) {
    await this.updateRealtimeVisitor(data);
    this.broadcastToAdmins();
  }

  @SubscribeMessage('visitor:pageview')
  async handlePageView(@ConnectedSocket() client: Socket, @MessageBody() data: VisitorData) {
    this.visitorSockets.set(client.id, data.sessionId);
    await this.updateRealtimeVisitor(data);
    this.broadcastToAdmins();
  }

  @SubscribeMessage('visitor:scroll')
  async handleScroll(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; scrollDepth: number },
  ) {
    await this.prisma.realtimeVisitor.updateMany({
      where: { sessionId: data.sessionId },
      data: { scrollDepth: data.scrollDepth },
    });
  }

  @SubscribeMessage('visitor:leave')
  async handleLeave(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    await this.updateVisitorStatus(data.sessionId, false);
    this.visitorSockets.delete(client.id);
    this.broadcastToAdmins();
  }

  private async updateRealtimeVisitor(data: VisitorData) {
    await this.prisma.realtimeVisitor.upsert({
      where: { sessionId: data.sessionId },
      create: {
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        path: data.path,
        title: data.title,
        referrer: data.referrer,
        device: data.device,
        browser: data.browser,
        os: data.os,
        country: data.country,
        city: data.city,
        scrollDepth: data.scrollDepth || 0,
        isActive: true,
        lastSeen: new Date(),
      },
      update: {
        path: data.path,
        title: data.title,
        scrollDepth: data.scrollDepth || undefined,
        isActive: true,
        lastSeen: new Date(),
      },
    });
  }

  private async updateVisitorStatus(sessionId: string, isActive: boolean) {
    await this.prisma.realtimeVisitor.updateMany({
      where: { sessionId },
      data: { isActive },
    });
  }

  private async broadcastToAdmins() {
    if (this.adminClients.size === 0) return;
    const stats = await this.getRealTimeStats();
    this.server.to('admin-dashboard').emit('realtime:update', stats);
  }

  async getRealTimeStats(): Promise<RealTimeStats> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const activeVisitors = await this.prisma.realtimeVisitor.findMany({
      where: { isActive: true, lastSeen: { gte: fiveMinutesAgo } },
    });

    const pageViewsLastMinute = await this.prisma.pageView.count({
      where: { createdAt: { gte: oneMinuteAgo } },
    });

    const pageGroups = activeVisitors.reduce((acc, v) => {
      acc[v.path] = (acc[v.path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPagesNow = Object.entries(pageGroups)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
    activeVisitors.forEach(v => {
      const device = (v.device || 'desktop').toLowerCase();
      if (device in deviceBreakdown) deviceBreakdown[device as keyof typeof deviceBreakdown]++;
    });

    const countryGroups = activeVisitors.reduce((acc, v) => {
      if (v.country) acc[v.country] = (acc[v.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const countryBreakdown = Object.entries(countryGroups)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentEvents = await this.prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: fiveMinutesAgo } },
      select: { category: true, action: true, path: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const refererGroups = activeVisitors.reduce((acc, v) => {
      const source = v.referrer ? this.extractDomain(v.referrer) : 'direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trafficSources = Object.entries(refererGroups)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      activeVisitors: activeVisitors.length,
      pageViewsLastMinute,
      topPagesNow,
      deviceBreakdown,
      countryBreakdown,
      recentEvents: recentEvents.map(e => ({
        category: e.category,
        action: e.action,
        path: e.path || '',
        time: e.createdAt,
      })),
      trafficSources,
    };
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupStaleVisitors() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await this.prisma.realtimeVisitor.updateMany({
      where: { isActive: true, lastSeen: { lt: fiveMinutesAgo } },
      data: { isActive: false },
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await this.prisma.realtimeVisitor.deleteMany({
      where: { lastSeen: { lt: oneHourAgo } },
    });
  }

  @Cron('*/5 * * * * *')
  async broadcastStats() {
    if (this.adminClients.size > 0) {
      await this.broadcastToAdmins();
    }
  }
}