import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { SourceType } from '@prisma/client';

export class CreateSourceDto {
  @IsString()
  name!: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  feedUrl!: string;

  @IsEnum(SourceType)
  sourceType!: SourceType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  fetchIntervalHours: number = 12;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  feedUrl?: string;

  @IsOptional()
  @IsEnum(SourceType)
  sourceType?: SourceType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  fetchIntervalHours?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
