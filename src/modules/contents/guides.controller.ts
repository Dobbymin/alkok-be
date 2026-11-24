import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { GuideListQueryDto } from './contents.dto';
import { ContentsService } from './contents.service';

@ApiTags('guides')
@Controller('guides')
export class GuidesController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'listGuides', summary: '업무 활용 가이드 목록' })
  list(@Query() query: GuideListQueryDto, @CurrentUser() user?: AuthUser) {
    return this.contentsService.listGuides(query, user?.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'getGuideBySlug', summary: '업무 활용 가이드 상세' })
  getBySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.contentsService.getGuideBySlug(slug, user?.id);
  }
}
