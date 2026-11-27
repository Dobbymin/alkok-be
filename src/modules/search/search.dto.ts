import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class SearchQueryDto extends PaginationQueryDto {
  @IsString()
  @MinLength(1)
  q!: string;

  @IsOptional()
  @IsIn(['ALL', 'GUIDE', 'TOOL', 'SKILL', 'NEWS', 'VAULT'])
  type?: 'ALL' | 'GUIDE' | 'TOOL' | 'SKILL' | 'NEWS' | 'VAULT' = 'ALL';

  @IsOptional()
  @IsString()
  workDomain?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  validOnly?: boolean;
}

export class SearchSuggestQueryDto {
  @IsString()
  @MinLength(1)
  q!: string;
}
