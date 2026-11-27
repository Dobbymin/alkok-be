import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GuideBeforeAfterExampleInputDto, GuideCommonMistakeInputDto } from './admin-contents.dto';

export class ApproveInboxDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  workImpact?: string;

  @IsOptional()
  @IsString()
  markdownBody?: string;

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
  @IsString()
  pricingSummary?: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @IsString()
  installPrompt?: string;

  @IsOptional()
  @IsString()
  skillMdPreview?: string;
}

export class RejectInboxDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
