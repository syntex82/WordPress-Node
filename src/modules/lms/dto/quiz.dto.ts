/**
 * Quiz DTOs for LMS Module
 */
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  MCQ = 'MCQ',
  MCQ_MULTI = 'MCQ_MULTI',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
}

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  prompt: string;

  @IsOptional()
  @IsArray()
  optionsJson?: string[];

  correctAnswerJson: any; // Can be string, string[], or boolean

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  points?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}

export class UpdateQuestionDto extends CreateQuestionDto {}

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeLimitSeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  attemptsAllowed?: number;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScorePercent?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}

export class UpdateQuizDto extends CreateQuizDto {}

export class SubmitQuizAnswerDto {
  @IsUUID()
  questionId: string;

  answer: any; // Can be string, string[], or boolean
}

export class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitQuizAnswerDto)
  answers: SubmitQuizAnswerDto[];
}

export class StartQuizDto {
  // Can be extended for additional options
}
