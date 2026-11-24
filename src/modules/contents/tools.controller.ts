import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CompareToolsQueryDto, ToolListQueryDto } from './contents.dto';
import { ContentsService } from './contents.service';

@ApiTags('tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'listTools', summary: 'AI 도구·모델 목록' })
  list(@Query() query: ToolListQueryDto, @CurrentUser() user?: AuthUser) {
    return this.contentsService.listTools(query, user?.id);
  }

  // Register /compare BEFORE /:slug
  @Get('compare')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'compareTools', summary: 'AI 도구·모델 최대 4개 비교표' })
  compare(@Query() query: CompareToolsQueryDto, @CurrentUser() user?: AuthUser) {
    return this.contentsService.compareTools(query.slugs, user?.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'getToolBySlug', summary: 'AI 도구·모델 상세' })
  getBySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.contentsService.getToolBySlug(slug, user?.id);
  }
}
