import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { NewsListQueryDto } from './contents.dto';
import { ContentsService } from './contents.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'listNews', summary: 'AI 소식 목록' })
  list(@Query() query: NewsListQueryDto, @CurrentUser() user?: AuthUser) {
    return this.contentsService.listNews(query, user?.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'getNewsBySlug', summary: 'AI 소식 상세' })
  getBySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.contentsService.getNewsBySlug(slug, user?.id);
  }
}
