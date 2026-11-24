import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { DifficultyLevel, KoreanSupportLevel, PricingModel, ToolKind } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

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
