import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { SkillDetailEnvelopeResponseDto, SkillListQueryDto } from './contents.dto';
import { ContentsService } from './contents.service';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'listSkills', summary: '플러그인·스킬·MCP 목록' })
  list(@Query() query: SkillListQueryDto, @CurrentUser() user?: AuthUser) {
    return this.contentsService.listSkills(query, user?.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'getSkillBySlug', summary: '플러그인·스킬·MCP 상세' })
  @ApiOkResponse({ type: SkillDetailEnvelopeResponseDto })
  getBySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.contentsService.getSkillBySlug(slug, user?.id);
  }
}
