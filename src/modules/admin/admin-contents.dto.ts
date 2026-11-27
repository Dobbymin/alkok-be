import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ContentType,
  DifficultyLevel,
  KoreanSupportLevel,
  PricingModel,
  PublishStatus,
  SkillExecutionVerification,
  SkillKind,
  SourceType,
  ToolKind,
  VerificationStatus,
} from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { GUIDE_MISTAKE_CATEGORIES, type GuideMistakeCategory } from '../contents/contents.dto';

export class PromptBlockDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  variables!: string[];

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @IsOptional()
  @IsObject()
  variableExamples?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tips?: string;
}

export class GuideBeforeAfterExampleInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  beforeInput!: string;

  @ApiProperty()
  @IsString()
  afterOutput!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  improvementPoints?: string[];
}

export class GuideCommonMistakeInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ enum: GUIDE_MISTAKE_CATEGORIES })
  @IsIn(GUIDE_MISTAKE_CATEGORIES)
  category!: GuideMistakeCategory;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  mistake!: string;

  @ApiProperty()
  @IsString()
  prevention!: string;
}

export class AdminContentListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @IsOptional()
  @IsEnum(PublishStatus)
  publishStatus?: PublishStatus;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;
}

export class CreateAdminContentDto {
  @IsEnum(ContentType)
  type!: ContentType;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  summary!: string;

  @IsOptional()
  @IsEnum(PublishStatus)
  publishStatus?: PublishStatus;

  @IsEnum(SourceType)
  sourceType!: SourceType;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  sourceUrl!: string;

  @IsOptional()
  @IsString()
  sourceName?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categorySlugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagSlugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendedToolIds?: string[];

  // Guide fields
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @IsOptional()
  @IsString()
  markdownBody?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromptBlockDto)
  prompts?: PromptBlockDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuideBeforeAfterExampleInputDto)
  beforeAfterExamples?: GuideBeforeAfterExampleInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuideCommonMistakeInputDto)
  commonMistakes?: GuideCommonMistakeInputDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationChecklist?: string[];

  @IsOptional()
  @IsString()
  cautions?: string;

  // Tool fields
  @IsOptional()
  @IsEnum(ToolKind)
  toolKind?: ToolKind;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  officialUrl?: string;

  @IsOptional()
  @IsBoolean()
  hasFreePlan?: boolean;

  @IsOptional()
  @IsString()
  pricingSummary?: string;

  @IsOptional()
  @IsArray()
  pricingPlans?: Record<string, unknown>[];

  @IsOptional()
  @IsEnum(KoreanSupportLevel)
  koreanSupport?: KoreanSupportLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  limitations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  useCases?: string[];

  @IsOptional()
  @IsArray()
  gettingStartedSteps?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  examplePrompts?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  faq?: Record<string, unknown>[];

  // News fields
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @IsOptional()
  @IsString()
  workImpact?: string;

  // Skill fields
  @IsOptional()
  @IsEnum(SkillKind)
  skillKind?: SkillKind;

  @IsOptional()
  @IsString()
  skillSlug?: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  license?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  repositoryUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  sourceFileUrl?: string;

  @IsOptional()
  @IsEnum(SkillExecutionVerification)
  executionVerification?: SkillExecutionVerification;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleAgents?: string[];

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @IsObject()
  beforeAfter?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  workflowSteps?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  prerequisites?: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  installPrompt?: string;

  @IsOptional()
  @IsArray()
  installGuides?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  expectedOutputs?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  postRunChecklist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tips?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileStructure?: string[];

  @IsOptional()
  @IsString()
  skillMdPreview?: string;

  @IsOptional()
  @IsObject()
  webAlternative?: Record<string, unknown>;
}

export class UpdateAdminContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsEnum(PublishStatus)
  publishStatus?: PublishStatus;

  @IsOptional()
  @IsEnum(SourceType)
  sourceType?: SourceType;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  sourceName?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categorySlugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagSlugs?: string[];

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @IsOptional()
  @IsString()
  markdownBody?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromptBlockDto)
  prompts?: PromptBlockDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuideBeforeAfterExampleInputDto)
  beforeAfterExamples?: GuideBeforeAfterExampleInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuideCommonMistakeInputDto)
  commonMistakes?: GuideCommonMistakeInputDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationChecklist?: string[];

  @IsOptional()
  @IsString()
  cautions?: string;

  @IsOptional()
  @IsEnum(ToolKind)
  toolKind?: ToolKind;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  officialUrl?: string;

  @IsOptional()
  @IsBoolean()
  hasFreePlan?: boolean;

  @IsOptional()
  @IsString()
  pricingSummary?: string;

  @IsOptional()
  @IsArray()
  pricingPlans?: Record<string, unknown>[];

  @IsOptional()
  @IsEnum(KoreanSupportLevel)
  koreanSupport?: KoreanSupportLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  limitations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  useCases?: string[];

  @IsOptional()
  @IsArray()
  gettingStartedSteps?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  examplePrompts?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  faq?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @IsOptional()
  @IsString()
  workImpact?: string;

  @IsOptional()
  @IsEnum(SkillKind)
  skillKind?: SkillKind;

  @IsOptional()
  @IsString()
  skillSlug?: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  license?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  repositoryUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  sourceFileUrl?: string;

  @IsOptional()
  @IsEnum(SkillExecutionVerification)
  executionVerification?: SkillExecutionVerification;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleAgents?: string[];

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @IsObject()
  beforeAfter?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  workflowSteps?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  prerequisites?: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  installPrompt?: string;

  @IsOptional()
  @IsArray()
  installGuides?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  expectedOutputs?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  postRunChecklist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tips?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileStructure?: string[];

  @IsOptional()
  @IsString()
  skillMdPreview?: string;

  @IsOptional()
  @IsObject()
  webAlternative?: Record<string, unknown>;
}
