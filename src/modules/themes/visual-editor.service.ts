/**
 * Visual Editor Service
 * Handles drag-and-drop block management, undo/redo, and state management
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { VisualEditorGateway } from './visual-editor.gateway';
import { AiThemeGeneratorService, GeneratedThemeData } from './ai-theme-generator.service';
import {
  BlockOperationDto,
  BlockOperation,
  MoveBlockDto,
  ReorderBlocksDto,
  InlineEditDto,
  ApplyAiThemeDto,
  LivePreviewUpdateDto,
  CreateBlockFromTemplateDto,
} from './dto/visual-editor.dto';
import {
  CompleteThemeSettingsDto,
  UpdateThemeSettingsDto,
} from './dto/theme-customization-settings.dto';
import { v4 as uuid } from 'uuid';

export interface HistoryEntry {
  id: string;
  operation: BlockOperation;
  blockId: string;
  previousState: any;
  newState: any;
  timestamp: number;
}

interface EditorSession {
  themeId: string;
  userId: string;
  history: HistoryEntry[];
  historyIndex: number;
  unsavedChanges: Map<string, any>;
}

@Injectable()
export class VisualEditorService {
  private sessions: Map<string, EditorSession> = new Map();
  private blockTemplates: Map<string, any> = new Map();
  private readonly MAX_HISTORY = 50;

  constructor(
    private prisma: PrismaService,
    private gateway: VisualEditorGateway,
    private aiThemeGenerator: AiThemeGeneratorService,
  ) {
    this.initializeBlockTemplates();
  }

  // ============ SESSION MANAGEMENT ============

  getOrCreateSession(themeId: string, userId: string): EditorSession {
    const key = `${themeId}:${userId}`;
    if (!this.sessions.has(key)) {
      this.sessions.set(key, {
        themeId,
        userId,
        history: [],
        historyIndex: -1,
        unsavedChanges: new Map(),
      });
    }
    return this.sessions.get(key)!;
  }

  clearSession(themeId: string, userId: string) {
    const key = `${themeId}:${userId}`;
    this.sessions.delete(key);
  }

  // ============ BLOCK OPERATIONS ============

  async addBlock(
    themeId: string,
    userId: string,
    blockData: any,
    position?: number,
    parentId?: string,
  ) {
    const theme = await this.getThemeWithBlocks(themeId);
    const session = this.getOrCreateSession(themeId, userId);

    const newBlock = {
      id: uuid(),
      type: blockData.type,
      props: blockData.props || {},
      order: position ?? theme.blocks.length,
      parentId: parentId || null,
      visibility: { desktop: true, tablet: true, mobile: true },
      ...blockData,
    };

    // Add to history
    this.addToHistory(session, {
      operation: BlockOperation.ADD,
      blockId: newBlock.id,
      previousState: null,
      newState: newBlock,
    });

    // Save to database
    const created = await this.prisma.themeCustomizationBlock.create({
      data: {
        theme: { connect: { id: themeId } },
        name: newBlock.type,
        type: newBlock.type,
        richContent: newBlock.props,
        position: newBlock.order,
      },
    });

    // Notify other clients
    this.gateway.broadcastToTheme(themeId, 'blockAdded', {
      block: { ...newBlock, id: created.id },
      position,
      userId,
    });

    return { ...newBlock, id: created.id };
  }

  async removeBlock(themeId: string, userId: string, blockId: string) {
    const block = await this.prisma.themeCustomizationBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    const session = this.getOrCreateSession(themeId, userId);

    // Add to history
    this.addToHistory(session, {
      operation: BlockOperation.REMOVE,
      blockId,
      previousState: block,
      newState: null,
    });

    // Delete from database
    await this.prisma.themeCustomizationBlock.delete({
      where: { id: blockId },
    });

    // Notify other clients
    this.gateway.broadcastToTheme(themeId, 'blockRemoved', { blockId, userId });

    return { success: true, blockId };
  }

  async moveBlock(themeId: string, userId: string, dto: MoveBlockDto) {
    const block = await this.prisma.themeCustomizationBlock.findUnique({
      where: { id: dto.blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    const session = this.getOrCreateSession(themeId, userId);
    const previousState = { position: block.position };

    // Add to history
    this.addToHistory(session, {
      operation: BlockOperation.MOVE,
      blockId: dto.blockId,
      previousState,
      newState: { position: dto.newOrder },
    });

    // Update position
    await this.prisma.themeCustomizationBlock.update({
      where: { id: dto.blockId },
      data: { position: dto.newOrder },
    });

    // Notify other clients
    this.gateway.broadcastToTheme(themeId, 'blockMoved', { ...dto, userId });

    return { success: true, blockId: dto.blockId, newOrder: dto.newOrder };
  }

  async updateBlock(themeId: string, userId: string, blockId: string, updates: any) {
    const block = await this.prisma.themeCustomizationBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    const session = this.getOrCreateSession(themeId, userId);

    // Add to history
    this.addToHistory(session, {
      operation: BlockOperation.UPDATE,
      blockId,
      previousState: block.content,
      newState: updates,
    });

    // Merge updates with existing content
    const existingContent = (block.richContent as object) || {};
    const newContent = { ...existingContent, ...updates };

    const updated = await this.prisma.themeCustomizationBlock.update({
      where: { id: blockId },
      data: { richContent: newContent },
    });

    // Notify other clients
    this.gateway.broadcastToTheme(themeId, 'blockUpdated', {
      blockId,
      updates,
      userId,
    });

    return updated;
  }

  async duplicateBlock(themeId: string, userId: string, blockId: string) {
    const block = await this.prisma.themeCustomizationBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    const newBlock = await this.prisma.themeCustomizationBlock.create({
      data: {
        theme: { connect: { id: themeId } },
        name: block.name,
        type: block.type,
        richContent: block.richContent,
        position: block.position + 1,
      },
    });

    const session = this.getOrCreateSession(themeId, userId);
    this.addToHistory(session, {
      operation: BlockOperation.DUPLICATE,
      blockId: newBlock.id,
      previousState: null,
      newState: newBlock,
    });

    // Notify other clients
    this.gateway.broadcastToTheme(themeId, 'blockDuplicated', {
      originalBlockId: blockId,
      newBlock,
      userId,
    });

    return newBlock;
  }

  async reorderBlocks(themeId: string, userId: string, dto: ReorderBlocksDto) {
    const updates = dto.blockIds.map((id, index) =>
      this.prisma.themeCustomizationBlock.update({
        where: { id },
        data: { position: index },
      }),
    );

    await this.prisma.$transaction(updates);

    // Notify other clients
    this.gateway.broadcastToTheme(themeId, 'blocksReordered', {
      blockIds: dto.blockIds,
      zone: dto.zone,
      userId,
    });

    return { success: true, blockIds: dto.blockIds };
  }

  // ============ INLINE EDITING ============

  async inlineEdit(themeId: string, userId: string, dto: InlineEditDto) {
    const block = await this.prisma.themeCustomizationBlock.findUnique({
      where: { id: dto.blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    const content = (block.richContent as Record<string, any>) || {};
    const previousValue = content[dto.field];
    content[dto.field] = dto.value;

    if (dto.saveImmediately) {
      await this.prisma.themeCustomizationBlock.update({
        where: { id: dto.blockId },
        data: { content },
      });

      const session = this.getOrCreateSession(themeId, userId);
      this.addToHistory(session, {
        operation: BlockOperation.UPDATE,
        blockId: dto.blockId,
        previousState: { [dto.field]: previousValue },
        newState: { [dto.field]: dto.value },
      });
    }

    // Broadcast for live preview
    this.gateway.broadcastToTheme(themeId, 'inlineEdit', {
      ...dto,
      userId,
      saved: dto.saveImmediately,
    });

    return { success: true, blockId: dto.blockId, field: dto.field };
  }

  // ============ UNDO/REDO ============

  async undo(themeId: string, userId: string): Promise<HistoryEntry | null> {
    const session = this.getOrCreateSession(themeId, userId);

    if (session.historyIndex < 0) {
      return null;
    }

    const entry = session.history[session.historyIndex];
    session.historyIndex--;

    // Revert the operation
    await this.revertOperation(entry);

    // Notify other clients
    this.gateway.broadcastToTheme(themeId, 'undone', { entry, userId });

    return entry;
  }

  async redo(themeId: string, userId: string): Promise<HistoryEntry | null> {
    const session = this.getOrCreateSession(themeId, userId);

    if (session.historyIndex >= session.history.length - 1) {
      return null;
    }

    session.historyIndex++;
    const entry = session.history[session.historyIndex];

    // Re-apply the operation
    await this.applyOperation(entry);

    // Notify other clients
    this.gateway.broadcastToTheme(themeId, 'redone', { entry, userId });

    return entry;
  }

  private async revertOperation(entry: HistoryEntry) {
    switch (entry.operation) {
      case BlockOperation.ADD:
        await this.prisma.themeCustomizationBlock.delete({ where: { id: entry.blockId } });
        break;
      case BlockOperation.REMOVE:
        await this.prisma.themeCustomizationBlock.create({ data: entry.previousState });
        break;
      case BlockOperation.UPDATE:
      case BlockOperation.MOVE:
        await this.prisma.themeCustomizationBlock.update({
          where: { id: entry.blockId },
          data: entry.previousState,
        });
        break;
    }
  }

  private async applyOperation(entry: HistoryEntry) {
    switch (entry.operation) {
      case BlockOperation.ADD:
      case BlockOperation.DUPLICATE:
        await this.prisma.themeCustomizationBlock.create({ data: entry.newState });
        break;
      case BlockOperation.REMOVE:
        await this.prisma.themeCustomizationBlock.delete({ where: { id: entry.blockId } });
        break;
      case BlockOperation.UPDATE:
      case BlockOperation.MOVE:
        await this.prisma.themeCustomizationBlock.update({
          where: { id: entry.blockId },
          data: entry.newState,
        });
        break;
    }
  }

  // ============ THEME SETTINGS ============

  async updateThemeSettings(dto: UpdateThemeSettingsDto) {
    const theme = await this.prisma.theme.findUnique({
      where: { id: dto.themeId },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const currentConfig = (theme.config as Record<string, any>) || {};
    const currentSettings = currentConfig.customSettings || {};
    const newSettings = dto.merge ? this.deepMerge(currentSettings, dto.settings) : dto.settings;

    const newConfig = { ...currentConfig, customSettings: newSettings };

    const updated = await this.prisma.theme.update({
      where: { id: dto.themeId },
      data: { config: newConfig },
    });

    // Notify clients about settings change
    this.gateway.notifyThemeUpdate(dto.themeId, 'settings', newSettings);

    return updated;
  }

  async getThemeSettings(themeId: string): Promise<CompleteThemeSettingsDto> {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const config = (theme.config as Record<string, any>) || {};
    return (config.customSettings as CompleteThemeSettingsDto) || {};
  }

  // ============ AI INTEGRATION ============

  async applyAiTheme(dto: ApplyAiThemeDto, userId: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id: dto.themeId },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    // Get AI-generated theme data (stored temporarily or retrieved)
    const aiTheme = await this.getAiGeneratedTheme(dto.aiGeneratedThemeId);

    if (!aiTheme) {
      throw new NotFoundException('AI-generated theme not found');
    }

    const currentConfig = (theme.config as Record<string, any>) || {};
    const currentSettings = currentConfig.customSettings || {};
    let newSettings = aiTheme.settings;

    // Apply exclusions
    if (dto.excludeSettings?.length) {
      for (const key of dto.excludeSettings) {
        delete (newSettings as any)[key];
      }
    }

    // Merge or replace settings
    if (dto.mergeSettings) {
      newSettings = this.deepMerge(currentSettings, newSettings);
    }

    // Update theme config with new settings
    const newConfig = { ...currentConfig, customSettings: newSettings };
    await this.prisma.theme.update({
      where: { id: dto.themeId },
      data: { config: newConfig as any },
    });

    // Apply pages if requested
    if (dto.includePages && aiTheme.pages?.length) {
      // Clear existing custom pages and add new ones
      // This would integrate with a pages service
    }

    // Apply blocks if requested
    if (dto.includeBlocks && aiTheme.pages?.length) {
      for (const page of aiTheme.pages) {
        for (const block of page.blocks || []) {
          await this.addBlock(dto.themeId, userId, block);
        }
      }
    }

    // Notify clients
    this.gateway.notifyThemeUpdate(dto.themeId, 'aiApplied', {
      aiThemeId: dto.aiGeneratedThemeId,
      settings: newSettings,
    });

    return { success: true, themeId: dto.themeId };
  }

  private async getAiGeneratedTheme(id: string): Promise<GeneratedThemeData | null> {
    // In a real implementation, this would retrieve from cache or database
    // For now, return null - would be stored when AI generates theme
    return null;
  }

  // ============ BLOCK TEMPLATES ============

  private initializeBlockTemplates() {
    const templates = [
      {
        id: 'hero-basic',
        name: 'Basic Hero',
        type: 'hero',
        category: 'headers',
        defaultProps: {
          title: 'Welcome',
          subtitle: 'Your amazing subtitle',
          ctaText: 'Get Started',
        },
      },
      {
        id: 'hero-centered',
        name: 'Centered Hero',
        type: 'hero',
        category: 'headers',
        defaultProps: { title: 'Welcome', subtitle: 'Centered content', alignment: 'center' },
      },
      {
        id: 'features-3col',
        name: '3 Column Features',
        type: 'features',
        category: 'content',
        defaultProps: { columns: 3, features: [] },
      },
      {
        id: 'testimonials-grid',
        name: 'Testimonials Grid',
        type: 'testimonials',
        category: 'social-proof',
        defaultProps: { layout: 'grid', testimonials: [] },
      },
      {
        id: 'pricing-3tier',
        name: '3 Tier Pricing',
        type: 'pricing',
        category: 'commerce',
        defaultProps: { plans: [], showToggle: true },
      },
      {
        id: 'cta-simple',
        name: 'Simple CTA',
        type: 'cta',
        category: 'conversion',
        defaultProps: { title: 'Ready to get started?', buttonText: 'Contact Us' },
      },
      {
        id: 'contact-form',
        name: 'Contact Form',
        type: 'contactForm',
        category: 'forms',
        defaultProps: { fields: ['name', 'email', 'message'], submitText: 'Send Message' },
      },
    ];

    for (const template of templates) {
      this.blockTemplates.set(template.id, template);
    }
  }

  getBlockTemplates(category?: string) {
    const templates = Array.from(this.blockTemplates.values());
    if (category) {
      return templates.filter((t) => t.category === category);
    }
    return templates;
  }

  async createBlockFromTemplate(dto: CreateBlockFromTemplateDto, userId: string) {
    const template = this.blockTemplates.get(dto.templateId);
    if (!template) {
      throw new NotFoundException('Block template not found');
    }

    const blockData = {
      type: template.type,
      props: { ...template.defaultProps, ...dto.overrideProps },
    };

    return this.addBlock(dto.themeId, userId, blockData, dto.position, dto.parentBlockId);
  }

  // ============ HELPER METHODS ============

  private async getThemeWithBlocks(themeId: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
      include: {
        customizationBlocks: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    return {
      ...theme,
      blocks: theme.customizationBlocks,
    };
  }

  private addToHistory(session: EditorSession, entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    // Remove any redo history
    if (session.historyIndex < session.history.length - 1) {
      session.history = session.history.slice(0, session.historyIndex + 1);
    }

    // Add new entry
    session.history.push({
      ...entry,
      id: uuid(),
      timestamp: Date.now(),
    });

    // Trim history if too long
    if (session.history.length > this.MAX_HISTORY) {
      session.history = session.history.slice(-this.MAX_HISTORY);
    }

    session.historyIndex = session.history.length - 1;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    }
    return result;
  }
}
