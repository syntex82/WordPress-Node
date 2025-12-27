/**
 * Course Module DTOs for LMS Curriculum
 */
import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, Min } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class ReorderModulesDto {
  @IsUUID('4', { each: true })
  moduleIds: string[];
}

export class MoveLesonToModuleDto {
  @IsUUID()
  lessonId: string;

  @IsOptional()
  @IsUUID()
  moduleId?: string; // null to move to "unassigned"

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}

export class BulkMoveLessonsDto {
  @IsUUID('4', { each: true })
  lessonIds: string[];

  @IsOptional()
  @IsUUID()
  moduleId?: string;
}
