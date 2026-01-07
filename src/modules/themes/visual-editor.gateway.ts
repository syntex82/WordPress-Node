/**
 * Visual Editor WebSocket Gateway
 * Real-time communication for live preview and collaborative editing
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface EditorClient {
  id: string;
  socket: Socket;
  userId: string;
  themeId: string;
  viewingPage?: string;
  role: string;
}

interface PreviewUpdate {
  path: string;
  value: any;
  temporary?: boolean;
  timestamp: number;
}

interface BlockUpdate {
  blockId: string;
  operation: 'add' | 'remove' | 'move' | 'update' | 'duplicate';
  data?: any;
  position?: number;
}

@WebSocketGateway({
  namespace: '/visual-editor',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class VisualEditorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VisualEditorGateway.name);
  private clients: Map<string, EditorClient> = new Map();
  private themeRooms: Map<string, Set<string>> = new Map();
  private previewStates: Map<string, Map<string, any>> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const editorClient: EditorClient = {
        id: client.id,
        socket: client,
        userId: payload.sub,
        themeId: '',
        role: payload.role || 'user',
      };

      this.clients.set(client.id, editorClient);
      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
      
      client.emit('connected', { clientId: client.id });
    } catch (error) {
      this.logger.error(`Client ${client.id} connection failed: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const editorClient = this.clients.get(client.id);
    
    if (editorClient?.themeId) {
      const room = this.themeRooms.get(editorClient.themeId);
      if (room) {
        room.delete(client.id);
        if (room.size === 0) {
          this.themeRooms.delete(editorClient.themeId);
          this.previewStates.delete(editorClient.themeId);
        }
      }
      
      // Notify others in the room
      this.server.to(`theme:${editorClient.themeId}`).emit('userLeft', {
        userId: editorClient.userId,
        clientId: client.id,
      });
    }
    
    this.clients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTheme')
  handleJoinTheme(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { themeId: string; pageSlug?: string },
  ) {
    const editorClient = this.clients.get(client.id);
    if (!editorClient) return;

    // Leave previous theme room if any
    if (editorClient.themeId) {
      client.leave(`theme:${editorClient.themeId}`);
      const prevRoom = this.themeRooms.get(editorClient.themeId);
      if (prevRoom) prevRoom.delete(client.id);
    }

    // Join new theme room
    editorClient.themeId = data.themeId;
    editorClient.viewingPage = data.pageSlug;
    client.join(`theme:${data.themeId}`);

    // Track room members
    if (!this.themeRooms.has(data.themeId)) {
      this.themeRooms.set(data.themeId, new Set());
      this.previewStates.set(data.themeId, new Map());
    }
    this.themeRooms.get(data.themeId)!.add(client.id);

    // Notify others
    client.to(`theme:${data.themeId}`).emit('userJoined', {
      userId: editorClient.userId,
      clientId: client.id,
      page: data.pageSlug,
    });

    // Send current preview state
    const previewState = this.previewStates.get(data.themeId);
    if (previewState && previewState.size > 0) {
      client.emit('syncState', Object.fromEntries(previewState));
    }

    // Send list of active users
    const activeUsers = this.getActiveUsersInTheme(data.themeId);
    client.emit('activeUsers', activeUsers);

    this.logger.log(`Client ${client.id} joined theme ${data.themeId}`);
    return { success: true, themeId: data.themeId };
  }

  @SubscribeMessage('leaveTheme')
  handleLeaveTheme(@ConnectedSocket() client: Socket) {
    const editorClient = this.clients.get(client.id);
    if (!editorClient?.themeId) return;

    const themeId = editorClient.themeId;
    client.leave(`theme:${themeId}`);

    const room = this.themeRooms.get(themeId);
    if (room) {
      room.delete(client.id);
      if (room.size === 0) {
        this.themeRooms.delete(themeId);
        this.previewStates.delete(themeId);
      }
    }

    client.to(`theme:${themeId}`).emit('userLeft', {
      userId: editorClient.userId,
      clientId: client.id,
    });

    editorClient.themeId = '';
    editorClient.viewingPage = undefined;

    return { success: true };
  }

  @SubscribeMessage('previewUpdate')
  handlePreviewUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() update: PreviewUpdate,
  ) {
    const editorClient = this.clients.get(client.id);
    if (!editorClient?.themeId) return { success: false, error: 'Not in a theme room' };

    const themeId = editorClient.themeId;
    const previewState = this.previewStates.get(themeId);

    if (previewState && !update.temporary) {
      previewState.set(update.path, update.value);
    }

    // Broadcast to all clients in the theme room (including sender for confirmation)
    this.server.to(`theme:${themeId}`).emit('previewChange', {
      ...update,
      userId: editorClient.userId,
      clientId: client.id,
    });

    return { success: true, path: update.path };
  }

  @SubscribeMessage('blockUpdate')
  handleBlockUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() update: BlockUpdate,
  ) {
    const editorClient = this.clients.get(client.id);
    if (!editorClient?.themeId) return { success: false, error: 'Not in a theme room' };

    // Broadcast block changes to all clients
    this.server.to(`theme:${editorClient.themeId}`).emit('blockChange', {
      ...update,
      userId: editorClient.userId,
      clientId: client.id,
      timestamp: Date.now(),
    });

    return { success: true, blockId: update.blockId, operation: update.operation };
  }

  @SubscribeMessage('selectBlock')
  handleSelectBlock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { blockId: string | null },
  ) {
    const editorClient = this.clients.get(client.id);
    if (!editorClient?.themeId) return;

    // Notify others about selection (for showing cursors/selection indicators)
    client.to(`theme:${editorClient.themeId}`).emit('userSelection', {
      userId: editorClient.userId,
      clientId: client.id,
      blockId: data.blockId,
    });

    return { success: true };
  }

  @SubscribeMessage('cursorMove')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { x: number; y: number; blockId?: string },
  ) {
    const editorClient = this.clients.get(client.id);
    if (!editorClient?.themeId) return;

    // Broadcast cursor position for collaborative editing
    client.to(`theme:${editorClient.themeId}`).emit('userCursor', {
      userId: editorClient.userId,
      clientId: client.id,
      ...data,
    });
  }

  @SubscribeMessage('requestSync')
  handleRequestSync(@ConnectedSocket() client: Socket) {
    const editorClient = this.clients.get(client.id);
    if (!editorClient?.themeId) return;

    const previewState = this.previewStates.get(editorClient.themeId);
    if (previewState) {
      client.emit('syncState', Object.fromEntries(previewState));
    }

    return { success: true };
  }

  @SubscribeMessage('clearPreviewChanges')
  handleClearPreviewChanges(@ConnectedSocket() client: Socket) {
    const editorClient = this.clients.get(client.id);
    if (!editorClient?.themeId) return;

    this.previewStates.set(editorClient.themeId, new Map());

    this.server.to(`theme:${editorClient.themeId}`).emit('previewCleared', {
      userId: editorClient.userId,
      clientId: client.id,
    });

    return { success: true };
  }

  @SubscribeMessage('saveChanges')
  handleSaveChanges(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notify?: boolean },
  ) {
    const editorClient = this.clients.get(client.id);
    if (!editorClient?.themeId) return;

    // Clear preview state after save
    this.previewStates.set(editorClient.themeId, new Map());

    if (data.notify) {
      this.server.to(`theme:${editorClient.themeId}`).emit('changesSaved', {
        userId: editorClient.userId,
        clientId: client.id,
        timestamp: Date.now(),
      });
    }

    return { success: true };
  }

  // Helper methods
  private getActiveUsersInTheme(themeId: string): Array<{ userId: string; clientId: string; page?: string }> {
    const room = this.themeRooms.get(themeId);
    if (!room) return [];

    return Array.from(room)
      .map(clientId => {
        const client = this.clients.get(clientId);
        if (!client) return null;
        return {
          userId: client.userId,
          clientId: client.id,
          page: client.viewingPage,
        };
      })
      .filter(Boolean) as Array<{ userId: string; clientId: string; page?: string }>;
  }

  // Public methods for service integration
  broadcastToTheme(themeId: string, event: string, data: any) {
    this.server.to(`theme:${themeId}`).emit(event, data);
  }

  notifyThemeUpdate(themeId: string, updateType: string, data: any) {
    this.server.to(`theme:${themeId}`).emit('themeUpdated', {
      type: updateType,
      data,
      timestamp: Date.now(),
    });
  }
}

