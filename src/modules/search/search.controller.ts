import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { SearchQueryDto, SearchSuggestQueryDto } from './search.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'search', summary: '한국어 하이브리드 통합 검색' })
  search(@Query() query: SearchQueryDto, @CurrentUser() user?: AuthUser) {
    return this.searchService.search(query, user?.id);
  }

  @Get('suggest')
  @ApiOperation({ operationId: 'searchSuggest', summary: 'Cmd/Ctrl+K 퀵 서치 자동완성(상위 8건)' })
  suggest(@Query() query: SearchSuggestQueryDto, @Req() req: Request) {
    return this.searchService.suggest(query.q, req.ip || 'unknown');
  }
}
