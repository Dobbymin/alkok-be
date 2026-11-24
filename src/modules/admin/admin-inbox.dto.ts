import { IsArray, IsOptional, IsString } from 'class-validator';

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
  @IsString()
  pricingSummary?: string;
}

export class RejectInboxDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
