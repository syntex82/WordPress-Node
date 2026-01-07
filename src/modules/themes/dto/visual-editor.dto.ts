/**
 * Visual Editor DTOs
 * DTOs for the drag-and-drop visual theme editor
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============ BLOCK POSITION & LAYOUT ============

export class BlockPositionDto {
  @IsNumber()
  @Min(0)
  x: number;

  @IsNumber()
  @Min(0)
  y: number;

  @IsNumber()
  @Min(0)
  width: number;

  @IsNumber()
  @Min(0)
  height: number;

  @IsNumber()
  @Min(0)
  order: number;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  zone?: string; // header, content, sidebar, footer
}

export class MoveBlockDto {
  @IsString()
  blockId: string;

  @IsNumber()
  @Min(0)
  newOrder: number;

  @IsOptional()
  @IsString()
  newParentId?: string;

  @IsOptional()
  @IsString()
  newZone?: string;
}

export class ReorderBlocksDto {
  @IsArray()
  @IsString({ each: true })
  blockIds: string[];

  @IsOptional()
  @IsString()
  zone?: string;
}

// ============ BLOCK OPERATIONS ============

export enum BlockOperation {
  ADD = 'add',
  REMOVE = 'remove',
  MOVE = 'move',
  UPDATE = 'update',
  DUPLICATE = 'duplicate',
  HIDE = 'hide',
  SHOW = 'show',
}

export class BlockOperationDto {
  @IsEnum(BlockOperation)
  operation: BlockOperation;

  @IsString()
  blockId: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  timestamp?: number;
}

// ============ UNDO/REDO ============

export class EditorHistoryEntryDto {
  @IsString()
  id: string;

  @IsEnum(BlockOperation)
  operation: BlockOperation;

  @IsString()
  blockId: string;

  @IsObject()
  previousState: Record<string, any>;

  @IsObject()
  newState: Record<string, any>;

  @IsNumber()
  timestamp: number;
}

export class UndoRedoDto {
  @IsString()
  themeId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  steps?: number;
}

// ============ VISUAL EDITOR STATE ============

export class EditorViewportDto {
  @IsEnum(['desktop', 'tablet', 'mobile'])
  device: 'desktop' | 'tablet' | 'mobile';

  @IsNumber()
  @Min(320)
  @Max(2560)
  width: number;

  @IsNumber()
  @Min(1)
  zoom: number;
}

export class EditorStateDto {
  @IsString()
  themeId: string;

  @IsOptional()
  @IsString()
  selectedBlockId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expandedBlocks?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EditorViewportDto)
  viewport?: EditorViewportDto;

  @IsOptional()
  @IsBoolean()
  showGrid?: boolean;

  @IsOptional()
  @IsBoolean()
  showGuides?: boolean;
}

// ============ LIVE PREVIEW ============

export class LivePreviewUpdateDto {
  @IsString()
  themeId: string;

  @IsString()
  path: string; // e.g., 'settings.colors.primary' or 'blocks[0].props.title'

  @IsOptional()
  value?: any;

  @IsOptional()
  @IsBoolean()
  temporary?: boolean; // Don't save, just preview
}

export class PreviewSessionDto {
  @IsString()
  themeId: string;

  @IsOptional()
  @IsString()
  pageSlug?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EditorViewportDto)
  viewport?: EditorViewportDto;
}

// ============ BLOCK TEMPLATES ============

export class BlockTemplateDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsObject()
  defaultProps: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockTemplateDto)
  children?: BlockTemplateDto[];
}

export class CreateBlockFromTemplateDto {
  @IsString()
  templateId: string;

  @IsString()
  themeId: string;

  @IsOptional()
  @IsString()
  pageId?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsString()
  parentBlockId?: string;

  @IsOptional()
  @IsObject()
  overrideProps?: Record<string, any>;
}

// ============ INLINE EDITING ============

export class InlineEditDto {
  @IsString()
  blockId: string;

  @IsString()
  field: string; // e.g., 'title', 'content', 'buttonText'

  @IsString()
  value: string;

  @IsOptional()
  @IsBoolean()
  saveImmediately?: boolean;
}

// ============ BATCH OPERATIONS ============

export class BatchBlockOperationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockOperationDto)
  operations: BlockOperationDto[];

  @IsOptional()
  @IsBoolean()
  atomic?: boolean; // All or nothing
}

// ============ APPLY AI THEME ============

export class ApplyAiThemeDto {
  @IsString()
  themeId: string;

  @IsString()
  aiGeneratedThemeId: string;

  @IsOptional()
  @IsBoolean()
  mergeSettings?: boolean; // Merge with existing or replace

  @IsOptional()
  @IsBoolean()
  includePages?: boolean;

  @IsOptional()
  @IsBoolean()
  includeBlocks?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeSettings?: string[]; // e.g., ['colors', 'typography']
}
