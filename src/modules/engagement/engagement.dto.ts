import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ReportReason } from '@prisma/client';

export class SubmitReportDto {
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  detail!: string;

  @IsOptional()
  @IsEmail()
  reporterEmail?: string;

  // Honeypot field: real users leave this empty
  @IsOptional()
  @IsString()
  website?: string;
}
