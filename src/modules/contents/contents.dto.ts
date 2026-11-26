import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { DifficultyLevel, KoreanSupportLevel, PricingModel, ToolKind } from '@prisma/client';
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
