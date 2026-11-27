import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import {
  DifficultyLevel,
  KoreanSupportLevel,
  PricingModel,
  SkillExecutionVerification,
  SkillKind,
  ToolKind,
} from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export const GUIDE_MISTAKE_CATEGORIES = [
  'SECURITY',
  'HALLUCINATION',
  'FREE_LIMIT',
  'WORKFLOW',
] as const;
export type GuideMistakeCategory = (typeof GUIDE_MISTAKE_CATEGORIES)[number];

export class GuidePromptDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: [String] })
  variables!: string[];

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: '변수별 입력 예시 매핑',
  })
  variableExamples?: Record<string, string>;

  @ApiPropertyOptional()
  expectedOutput?: string;

  @ApiPropertyOptional()
  tips?: string;
}

export class GuideBeforeAfterExampleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  beforeInput!: string;

  @ApiProperty()
  afterOutput!: string;

  @ApiProperty({ type: [String] })
  improvementPoints!: string[];
}

export class GuideCommonMistakeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: GUIDE_MISTAKE_CATEGORIES })
  category!: GuideMistakeCategory;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  mistake!: string;

  @ApiProperty()
  prevention!: string;
}

export class GuideTocItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  level!: number;
}

export class GuideDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  publishStatus!: string;

  @ApiProperty()
  verificationStatus!: string;

  @ApiPropertyOptional({ nullable: true })
  verifiedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty()
  sourceType!: string;

  @ApiProperty()
  sourceUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceName!: string | null;

  @ApiProperty()
  helpfulCount!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  isBookmarked!: boolean;

  @ApiProperty()
  isHelpful!: boolean;

  @ApiProperty({ enum: DifficultyLevel })
  difficulty!: DifficultyLevel;

  @ApiPropertyOptional({ nullable: true })
  estimatedMinutes!: number | null;

  @ApiProperty({ enum: PricingModel })
  pricingModel!: PricingModel;

  @ApiProperty()
  markdownBody!: string;

  @ApiProperty({ type: [GuidePromptDto] })
  prompts!: GuidePromptDto[];

  @ApiProperty({ type: [GuideBeforeAfterExampleDto] })
  beforeAfterExamples!: GuideBeforeAfterExampleDto[];

  @ApiProperty({ type: [GuideCommonMistakeDto] })
  commonMistakes!: GuideCommonMistakeDto[];

  @ApiProperty({ type: [String] })
  verificationChecklist!: string[];

  @ApiPropertyOptional({ nullable: true })
  cautions!: string | null;

  @ApiProperty({ type: [GuideTocItemDto] })
  toc!: GuideTocItemDto[];
}

export class GuideDetailEnvelopeResponseDto {
  @ApiProperty({ type: GuideDetailResponseDto })
  data!: GuideDetailResponseDto;
}

export class GuideListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  workDomain?: string;

  @IsOptional()
  @IsString()
  aiUse?: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @IsOptional()
  @IsIn(['recommended', 'latest', 'helpful'])
  sort?: 'recommended' | 'latest' | 'helpful' = 'recommended';
}

export class ToolListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ToolKind)
  toolKind?: ToolKind;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasFreePlan?: boolean;

  @IsOptional()
  @IsEnum(KoreanSupportLevel)
  koreanSupport?: KoreanSupportLevel;

  @IsOptional()
  @IsString()
  workDomain?: string;

  @IsOptional()
  @IsString()
  aiUse?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  validOnly?: boolean;

  @IsOptional()
  @IsIn(['recommended', 'latest', 'helpful'])
  sort?: 'recommended' | 'latest' | 'helpful' = 'recommended';
}

export class NewsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  tag?: string;
}

export class CompareToolsQueryDto {
  @IsString()
  slugs!: string;
}

export class SkillBeforeAfterDto {
  @ApiProperty({ type: [String] })
  beforeItems!: string[];

  @ApiProperty({ type: [String] })
  afterItems!: string[];
}

export class SkillWorkflowStepDto {
  @ApiProperty()
  step!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  badge?: string;
}

export class SkillPrerequisiteDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  required!: boolean;

  @ApiProperty()
  description!: string;
}

export class SkillInstallGuideDto {
  @ApiProperty()
  environment!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ type: [String] })
  steps!: string[];

  @ApiPropertyOptional()
  command?: string;

  @ApiPropertyOptional()
  invokeExample?: string;
}

export class SkillExamplePromptDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  prompt!: string;
}

export class SkillExpectedOutputDto {
  @ApiProperty()
  order!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;
}

export class SkillFaqItemDto {
  @ApiProperty()
  question!: string;

  @ApiProperty()
  answer!: string;
}

export class SkillWebAlternativeDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [String] })
  recommendedTools!: string[];

  @ApiPropertyOptional()
  guideSlug?: string;
}

export class SkillDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  publishStatus!: string;

  @ApiProperty()
  verificationStatus!: string;

  @ApiPropertyOptional({ nullable: true })
  verifiedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty()
  sourceType!: string;

  @ApiProperty()
  sourceUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceName!: string | null;

  @ApiProperty()
  helpfulCount!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  isBookmarked!: boolean;

  @ApiProperty()
  isHelpful!: boolean;

  @ApiProperty({ enum: SkillKind })
  skillKind!: SkillKind;

  @ApiProperty()
  skillSlug!: string;

  @ApiProperty()
  authorName!: string;

  @ApiPropertyOptional({ nullable: true })
  license!: string | null;

  @ApiProperty()
  repositoryUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceFileUrl!: string | null;

  @ApiProperty({ enum: SkillExecutionVerification })
  executionVerification!: SkillExecutionVerification;

  @ApiProperty({ enum: DifficultyLevel })
  difficulty!: DifficultyLevel;

  @ApiProperty({ enum: PricingModel })
  pricingModel!: PricingModel;

  @ApiProperty({ type: [String] })
  compatibleAgents!: string[];

  @ApiProperty()
  overview!: string;

  @ApiProperty({ type: [String] })
  useCases!: string[];

  @ApiProperty({ type: SkillBeforeAfterDto })
  beforeAfter!: SkillBeforeAfterDto;

  @ApiProperty({ type: [SkillWorkflowStepDto] })
  workflowSteps!: SkillWorkflowStepDto[];

  @ApiProperty({ type: [SkillPrerequisiteDto] })
  prerequisites!: SkillPrerequisiteDto[];

  @ApiPropertyOptional({ nullable: true })
  installPrompt!: string | null;

  @ApiProperty({ type: [SkillInstallGuideDto] })
  installGuides!: SkillInstallGuideDto[];

  @ApiProperty({ type: [SkillExamplePromptDto] })
  examplePrompts!: SkillExamplePromptDto[];

  @ApiProperty({ type: [SkillExpectedOutputDto] })
  expectedOutputs!: SkillExpectedOutputDto[];

  @ApiProperty({ type: [String] })
  postRunChecklist!: string[];

  @ApiProperty({ type: [String] })
  tips!: string[];

  @ApiPropertyOptional({ nullable: true })
  cautions!: string | null;

  @ApiProperty({ type: [SkillFaqItemDto] })
  faq!: SkillFaqItemDto[];

  @ApiProperty({ type: [String] })
  fileStructure!: string[];

  @ApiPropertyOptional({ nullable: true })
  skillMdPreview!: string | null;

  @ApiPropertyOptional({ type: SkillWebAlternativeDto, nullable: true })
  webAlternative!: SkillWebAlternativeDto | null;

  @ApiProperty({ type: [GuideTocItemDto] })
  toc!: GuideTocItemDto[];
}

export class SkillDetailEnvelopeResponseDto {
  @ApiProperty({ type: SkillDetailResponseDto })
  data!: SkillDetailResponseDto;
}

export class SkillListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SkillKind)
  skillKind?: SkillKind;

  @IsOptional()
  @IsString()
  agent?: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @IsOptional()
  @IsString()
  workDomain?: string;

  @IsOptional()
  @IsString()
  aiUse?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  validOnly?: boolean;

  @IsOptional()
  @IsIn(['recommended', 'latest', 'helpful'])
  sort?: 'recommended' | 'latest' | 'helpful' = 'recommended';
}
